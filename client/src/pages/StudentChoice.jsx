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
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)',
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden'
            }}
        >
            {/* Top Buttons */}
            <div style={{
                position: 'absolute', top: 'clamp(0.75rem, 3vw, 2rem)',
                left: 'clamp(0.75rem, 3vw, 2rem)', right: 'clamp(0.75rem, 3vw, 2rem)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                zIndex: 10
            }}>
                <Link
                    to="/student"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: 'var(--color-text-primary)', textDecoration: 'none',
                        fontWeight: 700, fontSize: '0.9rem',
                        padding: '0.6rem 1rem', background: '#fff', borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
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
                        padding: '0.6rem 1rem', background: '#fff', border: 'none', borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>

            <div style={{ maxWidth: '1000px', width: '100%', marginTop: '3rem', boxSizing: 'border-box' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <Loader size={40} style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Loading your data...</p>
                    </div>
                ) : (
                    <>
                        {/* Quick Actions Section */}
                        <>
                            <h3 style={{
                                fontSize: '1.3rem', fontWeight: 800, marginTop: '3rem',
                                marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-text-primary)'
                            }}>
                                Quick Actions
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                                <motion.div
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    onClick={() => navigate('/master-profile')}
                                    style={{
                                        background: '#fff', padding: '2.5rem 1.5rem', borderRadius: '24px',
                                        cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
                                        border: '2px solid transparent', transition: 'all 0.3s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-accent-primary)'}
                                    onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
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
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    onClick={() => navigate('/master-profile')}
                                    style={{
                                        background: '#fff', padding: '2.5rem 1.5rem', borderRadius: '24px',
                                        cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
                                        border: '2px solid transparent', transition: 'all 0.3s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = '#10b981'}
                                    onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    <div style={{
                                        width: '70px', height: '70px', background: '#10b981',
                                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 1.5rem', color: '#fff', boxShadow: '0 10px 20px -5px #10b981'
                                    }}>
                                        <UserPlus size={28} />
                                    </div>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>
                                        {savedProfile ? 'Edit Master Profile' : 'Create Master Profile'}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', textAlign: 'center' }}>
                                        {savedProfile ? 'Update your permanent professional identity.' : 'Build a master profile from scratch.'}
                                    </p>
                                </motion.div>
                            </div>
                        </>

                        {/* Empty State */}
                        {!savedResume && !savedProfile && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                style={{
                                    textAlign: 'center',
                                    padding: '3rem 2rem',
                                    background: '#fff',
                                    borderRadius: '24px',
                                    marginTop: '2rem',
                                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)'
                                }}
                            >
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
                                    Welcome, {user?.email?.split('@')[0]}! 👋
                                </h2>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: 1.8 }}>
                                    No resume or profile yet. Choose an option above to get started with your professional documents.
                                </p>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    )
}
