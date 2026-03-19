import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, ArrowLeft, LogOut, FileText, Edit3, Eye, ChevronRight, Loader } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../supabase'
import { useEffect, useState } from 'react'
import { getDbUserId } from '../lib/userIdentity'

export default function StudentChoice() {
    const navigate = useNavigate()
    const { user, clearUser, loadResume } = useStore()
    const [savedResume, setSavedResume] = useState(null)
    const [loading, setLoading] = useState(true)

    const pickValue = (...values) => {
        for (const value of values) {
            if (value === 0) return value
            if (typeof value === 'string' && value.trim()) return value.trim()
            if (value) return value
        }
        return ''
    }

    const normalizeResumePreview = (resume) => {
        const rawData = resume?.data && typeof resume.data === 'object' ? resume.data : {}
        const personal = rawData.personalInfo && typeof rawData.personalInfo === 'object' ? rawData.personalInfo : {}

        const firstName = pickValue(rawData.firstName, personal.firstName, personal.first_name)
        const lastName = pickValue(rawData.lastName, personal.lastName, personal.last_name)
        const composedName = `${firstName || ''} ${lastName || ''}`.trim()
        const fullName = pickValue(rawData.fullName, personal.fullName, rawData.name, personal.name, composedName)

        const locationFromParts = [pickValue(rawData.city, personal.city), pickValue(rawData.country, personal.country)].filter(Boolean).join(', ')
        const location = pickValue(rawData.location, personal.location, locationFromParts)

        const rawSkills = rawData.skills ?? personal.skills ?? rawData.skillset ?? personal.skillset
        let skills = []
        if (Array.isArray(rawSkills)) {
            skills = rawSkills
        } else if (typeof rawSkills === 'string') {
            skills = rawSkills.split(',').map(skill => skill.trim()).filter(Boolean)
        }

        const website = pickValue(rawData.website, personal.website)
        const websiteHref = website && /^https?:\/\//i.test(website) ? website : (website ? `https://${website}` : '')

        const summary = pickValue(rawData.summary, personal.summary, rawData.objective, personal.objective)
        const title = pickValue(rawData.title, personal.title)
        const email = pickValue(rawData.email, personal.email)
        const phone = pickValue(rawData.phone, personal.phone)
        const linkedin = pickValue(rawData.linkedin, personal.linkedin)
        const github = pickValue(rawData.github, personal.github)

        return {
            name: fullName,
            title,
            email,
            phone,
            location,
            linkedin,
            github,
            website,
            websiteHref,
            summary,
            skills,
            hasAnyData: Boolean(fullName || title || email || phone || location || linkedin || github || website || summary || skills.length)
        }
    }

    const resumePreview = normalizeResumePreview(savedResume)

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

            if (resumeData) {
                setSavedResume(resumeData)
                setLoading(false)
                return
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

                                {/* Display Resume Data (uploaded PDF or manual entry) */}
                                {resumePreview.hasAnyData && (
                                    <>
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                            gap: '1.25rem', marginBottom: '2rem'
                                        }}>
                                            {resumePreview.name && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</p>
                                                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b' }}>
                                                        {resumePreview.name}
                                                    </p>
                                                </div>
                                            )}

                                            {resumePreview.title && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</p>
                                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b' }}>{resumePreview.title}</p>
                                                </div>
                                            )}

                                            {resumePreview.email && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                                                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e1b4b', wordBreak: 'break-all' }}>{resumePreview.email}</p>
                                                </div>
                                            )}

                                            {resumePreview.phone && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</p>
                                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b' }}>{resumePreview.phone}</p>
                                                </div>
                                            )}

                                            {resumePreview.location && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</p>
                                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b' }}>{resumePreview.location}</p>
                                                </div>
                                            )}

                                            {resumePreview.linkedin && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LinkedIn</p>
                                                    <a href={resumePreview.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                        View Profile →
                                                    </a>
                                                </div>
                                            )}

                                            {resumePreview.github && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GitHub</p>
                                                    <a href={resumePreview.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                        View Profile →
                                                    </a>
                                                </div>
                                            )}

                                            {resumePreview.website && (
                                                <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</p>
                                                    <a href={resumePreview.websiteHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                        {resumePreview.website} →
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Summary Section */}
                                        {resumePreview.summary && (
                                            <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional Summary</p>
                                                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#334155' }}>{resumePreview.summary}</p>
                                            </div>
                                        )}

                                        {/* Skills Section */}
                                        {resumePreview.skills.length > 0 && (
                                            <div style={{ marginBottom: '2rem' }}>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical Skills</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                    {resumePreview.skills.slice(0, 15).map((skill, idx) => (
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

                        {/* Quick Actions Section */}
                        {!savedResume && (
                            <>
                                <h3 style={{
                                    fontSize: '1.3rem', fontWeight: 800, marginTop: '3rem',
                                    marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-text-primary)'
                                }}>
                                    Get Started
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
                                        onClick={() => navigate('/templates')}
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
                                            <FileText size={28} />
                                        </div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', textAlign: 'center' }}>Create Resume Manually</h3>
                                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', textAlign: 'center' }}>
                                            Start from a template and enter details manually.
                                        </p>
                                    </motion.div>
                                </div>
                            </>
                        )}

                        {/* Empty State */}
                        {!savedResume && (
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
