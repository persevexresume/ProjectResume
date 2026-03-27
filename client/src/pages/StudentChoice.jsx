import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, UserPlus, ArrowLeft, LogOut, FileText, ChevronRight, Loader } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../supabase'
import { useEffect, useState } from 'react'
import { getDbUserId } from '../lib/userIdentity'

export default function StudentChoice() {
    const navigate = useNavigate()
    const { user, clearUser } = useStore()
    const [savedResume, setSavedResume] = useState(null)
    const [savedProfile, setSavedProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            navigate('/signin')
            return
        }
        fetchSavedData()
    }, [user, navigate])

    const fetchSavedData = async () => {
        try {
            const dbUserId = getDbUserId(user)
            if (!dbUserId) {
                setLoading(false)
                return
            }

            // Fetch most recent resume
            const { data: resumeData } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', dbUserId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (resumeData) {
                setSavedResume(resumeData)
            }

            // Fetch master profile — check tables in order (students table uses 'id', others use 'user_id')
            const profileTableCandidates = ['profiles']
            for (const tableName of profileTableCandidates) {
                try {
                    const { data: profileData, error: tableError } = await supabase
                        .from(tableName)
                        .select('*')
                        .eq('user_id', dbUserId)
                        .maybeSingle()

                    if (!tableError && profileData) {
                        setSavedProfile(profileData)
                        break
                    }
                } catch (err) {
                    // Silently fail for missing tables in candidates loop
                    console.log(`Note: Profile table ${tableName} skip or not found.`)
                }
            }

            // Also check the students table itself (uses 'id' as primary key, not 'user_id')
            if (!savedProfile) {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', dbUserId)
                    .maybeSingle()
                if (studentData) {
                    setSavedProfile(studentData)
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        clearUser()
        navigate('/signin?logout=1', { replace: true, state: { clearLogin: true } })
    }

    const handleViewAllResumes = () => {
        navigate('/student')
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                minHeight: '100vh',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem 1.5rem 4rem',
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden',
                position: 'relative'
            }}
        >
            {/* Animated Background Blobs */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)', borderRadius: '50%' }}
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)', borderRadius: '50%' }}
                />
            </div>
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    position: 'absolute', top: '1.5rem',
                    left: '1.5rem', right: '1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    zIndex: 10
                }}
            >
                <Link
                    to="/student"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: 'var(--color-text-primary)', textDecoration: 'none',
                        fontWeight: 700, fontSize: '0.9rem',
                        padding: '0.6rem 1.25rem', background: '#fff', borderRadius: '14px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <ArrowLeft size={18} /> Dashboard
                </Link>

                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: '#ef4444', textDecoration: 'none',
                        fontWeight: 700, fontSize: '0.9rem',
                        padding: '0.6rem 1.25rem', background: '#fff', border: 'none', borderRadius: '14px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ maxWidth: '1000px', width: '100%', marginTop: '0', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <Loader size={40} style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Loading your data...</p>
                    </div>
                ) : (
                    <>
                        {/* Quick Actions Section */}
                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{
                                fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem',
                                marginBottom: '2rem', textAlign: 'center', color: '#64748b',
                                letterSpacing: '0.1em', textTransform: 'uppercase'
                            }}>
                                Choose your next step
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                <motion.div
                                    whileHover={{ y: -8, scale: 1.01 }}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    onClick={() => navigate('/master-profile?autoUpload=1')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.8)', padding: '3rem 2rem', borderRadius: '32px',
                                        cursor: 'pointer', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)',
                                        border: '1px solid rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '70px', height: '70px', background: 'var(--color-accent-primary)',
                                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 1.5rem', color: '#fff', boxShadow: '0 10px 20px -5px var(--color-accent-primary)'
                                    }}>
                                        <Upload size={28} />
                                    </div>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>Upload & Populate</h3>
                                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', textAlign: 'center' }}>
                                        Upload your existing resume to instantly fill your Master Profile.
                                    </p>
                                </motion.div>

                                <motion.div
                                    whileHover={{ y: -8, scale: 1.01 }}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    onClick={() => navigate('/master-profile')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.8)', padding: '3rem 2rem', borderRadius: '32px',
                                        cursor: 'pointer', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)',
                                        border: '1px solid rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '80px', height: '80px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 2rem', color: '#fff', boxShadow: '0 15px 30px -10px rgba(16, 185, 129, 0.4)'
                                    }}>
                                        <UserPlus size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center', color: '#1e293b' }}>
                                        {savedProfile ? 'Edit Master Profile' : 'Create Profile'}
                                    </h3>
                                    <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '1rem', textAlign: 'center' }}>
                                        {savedProfile ? 'Update your permanent professional identity for future resumes.' : 'Build your master profile from scratch to unlock all features.'}
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Additional Info Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                style={{
                                    background: 'rgba(255,255,255,0.4)', padding: '2rem', borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(5px)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                        <FileText size={18} />
                                    </div>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>Expert Tip</span>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    The Master Profile is the heart of Persevex. Keeping it updated ensures every new resume you build starts with 90% completion.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                style={{
                                    background: 'rgba(255,255,255,0.4)', padding: '2rem', borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(5px)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                        <ChevronRight size={18} />
                                    </div>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>Fast Track</span>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    Already have a resume? The "Upload & Populate" option uses AI to extract your skills, experience, and education automatically.
                                </p>
                            </motion.div>
                        </div>

                    </>
                )}
            </motion.div>
        </motion.div>
    )
}
