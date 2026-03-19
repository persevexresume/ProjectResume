import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../supabase'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
    const navigate = useNavigate()
    const { success, error: showError } = useToast()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [resetEmail, setResetEmail] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!email.trim()) {
            showError('Please enter your email address')
            return
        }

        setLoading(true)
        try {
            // Try with Supabase Auth first
            const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/signin`
            })

            if (err) {
                // Check if user exists in our students table
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('email', email.toLowerCase())
                    .single()

                if (!studentData) {
                    showError('No account found with this email address')
                    setLoading(false)
                    return
                }

                // If table exists but auth fails, show locale message
                showError('Password reset functionality is being set up. Please contact support.')
                setLoading(false)
                return
            }

            // Success - show confirmation message
            setResetEmail(email)
            setSubmitted(true)
            setEmail('')
            success('Password reset email sent! Check your inbox.')
        } catch (err) {
            showError('Failed to send reset email: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
        >
            <Link to="/signin" style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                <ArrowLeft size={18} /> Back to Sign In
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'white', borderRadius: '16px', padding: '2rem', width: '100%',
                    maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
            >
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', color: '#1e293b' }}>
                    Reset Password
                </h1>
                <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {submitted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px',
                            padding: '2rem', textAlign: 'center'
                        }}
                    >
                        <CheckCircle2 size={48} style={{ color: '#22c55e', margin: '0 auto 1rem', display: 'block' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
                            Check Your Email!
                        </h3>
                        <p style={{ color: '#15803d', marginBottom: '1.5rem' }}>
                            We've sent a reset link to <strong>{resetEmail}</strong>
                        </p>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            The reset link will expire in 1 hour. If you don't see the email, check your spam folder.
                        </p>
                        <button
                            onClick={() => setSubmitted(false)}
                            style={{
                                background: '#22c55e', color: '#fff', border: 'none', padding: '0.75rem 1.5rem',
                                borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Send to Different Email
                        </button>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.5rem' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '2px solid #e2e8f0',
                                        borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '1rem',
                                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
                            }}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        Remember your password?{' '}
                        <Link to="/signin" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 700 }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </motion.div>
    )
}
