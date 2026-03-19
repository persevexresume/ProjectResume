import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '../supabase'
import { useToast } from '../context/ToastContext'

export default function VerifyEmail() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { success, error: showError } = useToast()
    const [status, setStatus] = useState('verifying') // verifying, success, error
    const [email, setEmail] = useState('')
    const [token, setToken] = useState('')
    const [resendLoading, setResendLoading] = useState(false)

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Get token from URL
                const urlToken = searchParams.get('token')
                const urlEmail = searchParams.get('email')

                if (!urlToken || !urlEmail) {
                    setStatus('error')
                    showError('Invalid or missing verification link')
                    return
                }

                setEmail(urlEmail)
                setToken(urlToken)

                // Try to verify with Supabase
                const { data: { user }, error: authErr } = await supabase.auth.verifyOtp({
                    email: urlEmail,
                    token: urlToken,
                    type: 'email'
                })

                if (authErr) {
                    // Continue - we'll try to verify in the database
                    setStatus('error')
                    showError(authErr.message || 'Verification failed. Link may be expired.')
                    return
                }

                // Success
                setStatus('success')
                success('Email verified successfully!')
                
                // Redirect to signin after 2 seconds
                setTimeout(() => {
                    navigate('/signin')
                }, 2000)
            } catch (err) {
                setStatus('error')
                showError('Verification error: ' + err.message)
            }
        }

        verifyEmail()
    }, [searchParams, navigate, success, showError])

    const handleResend = async () => {
        if (!email) return

        setResendLoading(true)
        try {
            const { error: err } = await supabase.auth.resend({
                type: 'signup',
                email: email
            })

            if (err) {
                showError('Failed to resend verification email')
                return
            }

            success('Verification email sent! Check your inbox.')
        } catch (err) {
            showError('Error: ' + err.message)
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'white', borderRadius: '16px', padding: '3rem', width: '100%',
                    maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center'
                }}
            >
                {status === 'verifying' && (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            style={{ margin: '0 auto 2rem' }}
                        >
                            <Clock size={48} style={{ color: '#667eea' }} />
                        </motion.div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>
                            Verifying Email
                        </h1>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            Please wait while we verify your email address...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            style={{ margin: '0 auto 2rem' }}
                        >
                            <CheckCircle2 size={64} style={{ color: '#22c55e' }} />
                        </motion.div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>
                            Email Verified!
                        </h1>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            Your email has been verified successfully. Redirecting to sign in...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            style={{ margin: '0 auto 2rem' }}
                        >
                            <AlertCircle size={64} style={{ color: '#ef4444' }} />
                        </motion.div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.5rem' }}>
                            Verification Failed
                        </h1>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            The verification link may have expired or is invalid.
                        </p>

                        {email && (
                            <>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                    Resend verification email to {email}
                                </p>
                                <button
                                    onClick={handleResend}
                                    disabled={resendLoading}
                                    style={{
                                        width: '100%', padding: '0.75rem', background: '#667eea', color: 'white',
                                        border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer',
                                        opacity: resendLoading ? 0.7 : 1, transition: 'all 0.2s'
                                    }}
                                >
                                    {resendLoading ? 'Sending...' : 'Resend Email'}
                                </button>
                            </>
                        )}
                    </>
                )}

                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        Having issues?{' '}
                        <a href="mailto:support@persevex.app" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 700 }}>
                            Contact Support
                        </a>
                    </p>
                </div>
            </motion.div>
        </motion.div>
    )
}
