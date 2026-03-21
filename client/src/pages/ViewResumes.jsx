import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Trash2, Edit, ArrowLeft, LogOut, FileText } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../supabase'
import { listUserResumes, deleteResume, duplicateResume } from '../lib/resumeDB'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function ViewResumes() {
    const navigate = useNavigate()
    const { user, clearUser, loadResumeData } = useStore()
    const [resumes, setResumes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null })

    const openConfirmDialog = (message, onConfirm) => {
        setConfirmDialog({ open: true, message, onConfirm })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog({ open: false, message: '', onConfirm: null })
    }

    useEffect(() => {
        if (!user) {
            navigate('/signin')
            return
        }
        fetchResumes()
    }, [user, navigate])

    const fetchResumes = async () => {
        try {
            setLoading(true)
            const data = await listUserResumes(user)
            setResumes(data)
        } catch (err) {
            setError('Failed to load resumes')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (resume) => {
        loadResumeData({
            personalInfo: resume.data?.personalInfo || {},
            experience: resume.data?.experience || [],
            education: resume.data?.education || [],
            skills: resume.data?.skills || [],
            projects: resume.data?.projects || [],
            certifications: resume.data?.certifications || [],
            languages: resume.data?.languages || [],
            volunteering: resume.data?.volunteering || []
        })
        navigate(`/build`, { state: { resumeId: resume.id, title: resume.title } })
    }

    const handleDelete = async (resumeId) => {
        openConfirmDialog('Are you sure you want to delete this resume?', async () => {
            closeConfirmDialog()
            try {
                await deleteResume(resumeId)
                setResumes(resumes.filter(r => r.id !== resumeId))
            } catch (err) {
                setError('Failed to delete resume')
                console.error(err)
            }
        })
    }

    const handleDuplicate = async (resume) => {
        try {
            const newResume = await duplicateResume(user, resume.id, `${resume.title} (Copy)`)
            setResumes([newResume, ...resumes])
        } catch (err) {
            setError('Failed to duplicate resume')
            console.error(err)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        clearUser()
        navigate('/signin?logout=1', { replace: true, state: { clearLogin: true } })
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                padding: 'clamp(1rem, 4vw, 2rem)',
                boxSizing: 'border-box'
            }}
        >
            {/* Top Buttons */}
            <div style={{
                maxWidth: '1200px', margin: '0 auto', marginBottom: '3rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                zIndex: 10
            }}>
                <Link
                    to="/student/choice"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: 'var(--color-text-primary)', textDecoration: 'none',
                        fontWeight: 700, fontSize: '0.9rem',
                        padding: '0.6rem 1rem', background: '#fff', borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                    }}
                >
                    <ArrowLeft size={18} /> Back
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

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div
                    initial={{ y: -20 }} animate={{ y: 0 }}
                    style={{ marginBottom: '3rem' }}
                >
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>
                        Your Resumes
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
                        View, edit, and manage all your saved resumes
                    </p>
                </motion.div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Loading resumes...</p>
                    </div>
                )}

                {error && (
                    <div style={{
                        background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '12px',
                        marginBottom: '2rem'
                    }}>
                        {error}
                    </div>
                )}

                {!loading && resumes.length === 0 && (
                    <div style={{
                        background: '#fff', padding: '3rem 2rem', borderRadius: '20px',
                        textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
                    }}>
                        <FileText size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-tertiary)' }} />
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            No resumes yet
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            Create or upload a resume to get started
                        </p>
                        <Link
                            to="/student/choice"
                            style={{
                                display: 'inline-block',
                                background: 'var(--color-accent-primary)', color: '#fff',
                                padding: '0.75rem 1.5rem', borderRadius: '12px',
                                textDecoration: 'none', fontWeight: 600
                            }}
                        >
                            Create Resume
                        </Link>
                    </div>
                )}

                {!loading && resumes.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {resumes.map((resume, index) => (
                            <motion.div
                                key={resume.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                style={{
                                    background: '#fff',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: '1rem'
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 700,
                                            marginBottom: '0.5rem',
                                            wordBreak: 'break-word'
                                        }}>
                                            {resume.title}
                                        </h3>
                                        <p style={{
                                            fontSize: '0.9rem',
                                            color: 'var(--color-text-tertiary)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            Created {new Date(resume.created_at).toLocaleDateString()}
                                        </p>
                                        {resume.updated_at !== resume.created_at && (
                                            <p style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--color-text-tertiary)'
                                            }}>
                                                Updated {new Date(resume.updated_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <button
                                        onClick={() => handleEdit(resume)}
                                        style={{
                                            flex: 1,
                                            minWidth: '100px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: '0.6rem 1rem',
                                            background: 'var(--color-accent-primary)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(resume)}
                                        style={{
                                            flex: 1,
                                            minWidth: '100px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: '0.6rem 1rem',
                                            background: '#f3f4f6',
                                            color: 'var(--color-text-primary)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Copy size={16} /> Duplicate
                                    </button>
                                    <button
                                        onClick={() => handleDelete(resume.id)}
                                        style={{
                                            flex: 1,
                                            minWidth: '100px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: '0.6rem 1rem',
                                            background: '#fee2e2',
                                            color: '#991b1b',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmDialog.open}
                title="Delete Resume"
                message={confirmDialog.message}
                danger={true}
                confirmLabel="Yes, Delete"
                cancelLabel="Cancel"
                onCancel={closeConfirmDialog}
                onConfirm={() => confirmDialog.onConfirm?.()}
            />
        </motion.div>
    )
}
