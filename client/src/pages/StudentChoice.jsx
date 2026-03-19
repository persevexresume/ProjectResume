import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, UserPlus, ArrowLeft, LogOut, FileText, Edit3, Eye, ChevronRight, Loader } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../supabase'
import { useEffect, useState } from 'react'
import { getDbUserId } from '../lib/userIdentity'

export default function StudentChoice() {
    const navigate = useNavigate()
    const { user, clearUser, loadResume } = useStore()
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

            // Fetch most recent resume - THIS SHOULD BE THE PRIORITY
            const { data: resumeData } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', dbUserId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (resumeData && resumeData.data) {
                setSavedResume(resumeData)
                setLoading(false)
                return  // Stop here - only show resume if it exists with data
            }

            // Only fetch master profile if NO resume exists
            const candidates = ['profiles', 'master_profiles', 'students']
            for (const tableName of candidates) {
                const { data: profileData } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('user_id', dbUserId)
                    .maybeSingle()

                if (profileData) {
                    setSavedProfile(profileData)
                    break
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

    const handleEditResume = () => {
        if (savedResume) {
            loadResume(savedResume)
            navigate('/build')
        }
    }

    const handleEditProfile = () => {
        navigate('/master-profile')
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
                        {/* Saved Resume Section - PRIORITY */}
                        {savedResume && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                style={{
                                    background: 'linear-gradient(135deg, #fff 0%, #f0f9ff 100%)',
                                    borderRadius: '24px',
                                    padding: '2.5rem',
                                    marginBottom: '2rem',
                                    boxShadow: '0 20px 60px rgba(79, 70, 229, 0.15)',
                                    border: '2px solid #4f46e5',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    color: '#fff',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    📥 Uploaded PDF
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', marginTop: '0.5rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem', color: '#1e1b4b' }}>
                                            {savedResume.title || 'Your Resume'}
                                        </h2>
                                        <p style={{ color: '#64748b', fontSize: '1rem' }}>
                                            Updated: {new Date(savedResume.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    {savedResume.score && (
                                        <div style={{
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            color: '#fff',
                                            padding: '1.25rem 2rem',
                                            borderRadius: '16px',
                                            textAlign: 'center',
                                            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
                                        }}>
                                            <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.25rem' }}>ATS Score</p>
                                            <p style={{ fontSize: '2.2rem', fontWeight: 900 }}>{savedResume.score}%</p>
                                        </div>
                                    )}
                                </div>

                                {/* Display Extracted Resume Data */}
                                {savedResume.data && (
                                    <>
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                            gap: '1.25rem', marginBottom: '2rem'
                                        }}>
                                            {(savedResume.data.firstName || savedResume.data.lastName) && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</p>
                                                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b' }}>
                                                        {`${savedResume.data.firstName || ''} ${savedResume.data.lastName || ''}`.trim()}
                                                    </p>
                                                </div>
                                            )}

                                            {savedResume.data.title && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</p>
                                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b' }}>{savedResume.data.title}</p>
                                                </div>
                                            )}

                                            {savedResume.data.email && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                                                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e1b4b', wordBreak: 'break-all' }}>{savedResume.data.email}</p>
                                                </div>
                                            )}

                                            {savedResume.data.phone && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</p>
                                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b' }}>{savedResume.data.phone}</p>
                                                </div>
                                            )}

                                            {savedResume.data.location && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</p>
                                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b' }}>{savedResume.data.location}</p>
                                                </div>
                                            )}

                                            {savedResume.data.linkedin && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LinkedIn</p>
                                                    <a href={savedResume.data.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                        View Profile →
                                                    </a>
                                                </div>
                                            )}

                                            {savedResume.data.github && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GitHub</p>
                                                    <a href={savedResume.data.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                        View Profile →
                                                    </a>
                                                </div>
                                            )}

                                            {savedResume.data.website && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</p>
                                                    <a href={`https://${savedResume.data.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                        {savedResume.data.website} →
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Summary Section */}
                                        {savedResume.data.summary && (
                                            <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional Summary</p>
                                                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#334155' }}>{savedResume.data.summary}</p>
                                            </div>
                                        )}

                                        {/* Skills Section */}
                                        {savedResume.data.skills && Array.isArray(savedResume.data.skills) && savedResume.data.skills.length > 0 && (
                                            <div style={{ marginBottom: '2rem' }}>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical Skills</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                    {savedResume.data.skills.slice(0, 15).map((skill, idx) => (
                                                        <span key={idx} style={{
                                                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                                            color: '#fff',
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '20px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 600,
                                                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                                                        }}>
                                                            {typeof skill === 'string' ? skill : skill.name || skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div style={{
                                    display: 'flex', gap: '1rem', flexWrap: 'wrap'
                                }}>
                                    <button
                                        onClick={handleEditResume}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff',
                                            border: 'none', padding: '0.85rem 1.75rem',
                                            borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
                                            transition: 'all 0.2s',
                                            fontSize: '1rem',
                                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Edit3 size={18} /> Edit Resume
                                    </button>

                                    <button
                                        onClick={() => navigate(`/student`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            background: '#e2e8f0', color: '#1e1b4b',
                                            border: 'none', padding: '0.85rem 1.75rem',
                                            borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
                                            transition: 'all 0.2s',
                                            fontSize: '1rem'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Eye size={18} /> View All
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Saved Profile Section */}
                        {savedProfile && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                style={{
                                    background: '#fff',
                                    borderRadius: '24px',
                                    padding: '2rem',
                                    marginBottom: '2rem',
                                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
                                    border: '2px solid #e5e7eb'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                            👤 Master Profile
                                        </h2>
                                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                                            {savedProfile.first_name || savedProfile.name ? `${savedProfile.first_name || ''} ${savedProfile.last_name || savedProfile.name || ''}`.trim() : 'Your professional profile'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '1rem', marginBottom: '1.5rem'
                                }}>
                                    {savedProfile.title && (
                                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Title</p>
                                            <p style={{ fontSize: '1rem', fontWeight: 700 }}>{savedProfile.title}</p>
                                        </div>
                                    )}
                                    {(savedProfile.city || savedProfile.country) && (
                                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Location</p>
                                            <p style={{ fontSize: '1rem', fontWeight: 700 }}>
                                                {[savedProfile.city, savedProfile.country].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                    {savedProfile.phone && (
                                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Phone</p>
                                            <p style={{ fontSize: '1rem', fontWeight: 700 }}>{savedProfile.phone}</p>
                                        </div>
                                    )}
                                </div>

                                {savedProfile.summary && (
                                    <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Summary</p>
                                        <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{savedProfile.summary}</p>
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex', gap: '1rem', flexWrap: 'wrap'
                                }}>
                                    <button
                                        onClick={() => navigate(`/master-profile/view`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                                            border: 'none', padding: '0.85rem 1.75rem',
                                            borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
                                            transition: 'all 0.2s',
                                            fontSize: '1rem',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Eye size={18} /> View Profile
                                    </button>

                                    <button
                                        onClick={handleEditProfile}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            background: '#e2e8f0', color: '#1e1b4b',
                                            border: 'none', padding: '0.85rem 1.75rem',
                                            borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
                                            transition: 'all 0.2s',
                                            fontSize: '1rem'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Edit3 size={18} /> Edit Profile
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Quick Actions Section */}
                        {(!savedResume || !savedProfile) && (
                            <>
                                <h3 style={{
                                    fontSize: '1.3rem', fontWeight: 800, marginTop: '3rem',
                                    marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-text-primary)'
                                }}>
                                    {savedResume && savedProfile ? 'Additional Actions' : 'Get Started'}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                                    <motion.div
                                        whileHover={{ y: -10, scale: 1.02 }}
                                        onClick={() => navigate('/upload-resume')}
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
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>Upload Resume</h3>
                                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', textAlign: 'center' }}>
                                            Already have a resume? Upload it and we'll extract your details.
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
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>Create Master Profile</h3>
                                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', textAlign: 'center' }}>
                                            Build a master profile from scratch to use in any resume.
                                        </p>
                                    </motion.div>
                                </div>
                            </>
                        )}

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
