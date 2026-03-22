import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, MapPin, Phone, Mail, Pin, ArrowRight, Plus, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../supabase'
import { getDbUserId } from '../lib/userIdentity'
import { useToast } from '../context/ToastContext'

export default function MasterProfile() {
    const navigate = useNavigate()
    const { success: toastSuccess, error: toastError } = useToast()
    const { user, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications } = useStore()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [statusType, setStatusType] = useState('info')

    const [personal, setPersonal] = useState({
        firstName: '',
        lastName: '',
        city: '',
        country: '',
        pinCode: '',
        phone: '',
        email: user?.email || '',
        title: '',
        summary: ''
    })

    const [experience, setLocalExperience] = useState([])
    const [education, setLocalEducation] = useState([])
    const [skills, setLocalSkills] = useState([])
    const [projects, setLocalProjects] = useState([])
    const [certifications, setLocalCertifications] = useState([])
    const [skillInput, setSkillInput] = useState('')

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return

            const dbUserId = getDbUserId(user)
            if (!dbUserId) return

            const tableCandidates = ['profiles']

            for (const tableName of tableCandidates) {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('user_id', dbUserId)
                    .maybeSingle()

                if (data) {
                    const city = data.city || data.location?.split(',')[0]?.trim() || ''
                    const country = data.country || data.location?.split(',')[1]?.trim() || ''

                    setPersonal({
                        firstName: data.first_name || '',
                        lastName: data.last_name || '',
                        city,
                        country,
                        pinCode: data.pin_code || '',
                        phone: data.phone || '',
                        email: data.email || user?.email || '',
                        title: data.title || '',
                        summary: data.summary || ''
                    })

                    setLocalExperience(Array.isArray(data.experience_data) ? data.experience_data : [])
                    setLocalEducation(Array.isArray(data.education_data) ? data.education_data : [])
                    setLocalSkills(Array.isArray(data.skills_data) ? data.skills_data : [])
                    setLocalProjects(Array.isArray(data.projects_data) ? data.projects_data : [])
                    setLocalCertifications(Array.isArray(data.certifications_data) ? data.certifications_data : [])
                    return
                }

                if (!error) continue

                const fullMessage = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
                const relationMissing = error.code === 'PGRST205' || /relation .* does not exist|schema cache|not found|404/i.test(fullMessage)
                const noRows = error.code === 'PGRST116' || /0 rows|no rows/i.test(fullMessage)
                if (relationMissing || noRows) continue
            }
        }

        loadProfile()
    }, [user])

    const handleSave = async (e) => {
        e.preventDefault()
        setLoading(true)
        setStatusMessage('')
        try {
            if (!user) {
                throw new Error('Please sign in first')
            }

            const dbUserId = getDbUserId(user)
            if (!dbUserId) {
                throw new Error('Unable to identify your account')
            }

            const profileData = {
                user_id: dbUserId,
                first_name: personal.firstName,
                last_name: personal.lastName,
                city: personal.city,
                country: personal.country,
                pin_code: personal.pinCode,
                phone: personal.phone,
                email: personal.email,
                title: personal.title,
                summary: personal.summary,
                location: [personal.city, personal.country].filter(Boolean).join(', '),
                experience_data: experience,
                education_data: education,
                skills_data: skills,
                projects_data: projects,
                certifications_data: certifications,
                updated_at: new Date().toISOString()
            }

            const saveMasterProfile = async (basePayload) => {
                const tableCandidates = ['profiles']

                for (const tableName of tableCandidates) {
                    const attemptPayload = { ...basePayload }

                    for (let attempt = 0; attempt < 8; attempt += 1) {
                        const { error } = await supabase
                            .from(tableName)
                            .upsert([attemptPayload], { onConflict: 'user_id' })

                        if (!error) return { error: null, tableName }

                        const fullMessage = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
                        // PGRST205 is Supabase's error code for "table not found"
                        const relationMissing = error.code === 'PGRST205' || /relation .* does not exist|schema cache|not found|404/i.test(fullMessage)
                        const missingColumnMatch = fullMessage.match(/Could not find the '([^']+)' column/i) || fullMessage.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)

                        if (missingColumnMatch && attemptPayload[missingColumnMatch[1]] !== undefined) {
                            delete attemptPayload[missingColumnMatch[1]]
                            continue
                        }

                        if (relationMissing) {
                            break
                        }

                        return { error }
                    }
                }

                return { error: { message: 'Master profile table is not available in Supabase schema.' }, tableName: null }
            }

            const { error, tableName } = await saveMasterProfile(profileData)

            if (!error) {
                // Update the local store with all data
                updatePersonalInfo({
                    firstName: personal.firstName,
                    lastName: personal.lastName,
                    email: personal.email,
                    phone: personal.phone,
                    location: `${personal.city}, ${personal.country}`,
                    title: personal.title,
                    summary: personal.summary
                })
                setExperience(experience)
                setEducation(education)
                setSkills(skills)
                setProjects(projects)
                setCertifications(certifications)

                setSuccess(true)
                const message = `Profile saved successfully${tableName ? ` (${tableName})` : ''}. Redirecting...`
                setStatusType('success')
                setStatusMessage(message)
                toastSuccess(message)
                setTimeout(() => navigate('/student'), 2000)
            } else {
                const details = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
                throw new Error(details || 'Master Profile save failed')
            }
        } catch (error) {
            console.error("Master Profile Save Error:", error)
            const message = `Failed to save profile: ${error.message || 'Unknown error'}`
            setStatusType('error')
            setStatusMessage(message)
            toastError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(1rem, 4vw, 3rem) clamp(0.75rem, 3vw, 1.5rem) 2.5rem', width: '100%', boxSizing: 'border-box' }}
        >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/student/choice" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '2rem', fontWeight: 700 }}>
                    <ArrowLeft size={18} /> Back
                </Link>

                <div style={{ background: '#fff', padding: 'clamp(1.25rem, 3vw, 2.25rem)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' }}>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Create your <span className="text-gradient">Master Profile</span></h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '3rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>This information will be used as the default for all your future resumes.</p>

                    {statusMessage && (
                        <div style={{
                            marginBottom: '1.5rem',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            border: statusType === 'success' ? '1px solid #86efac' : '1px solid #fca5a5',
                            background: statusType === 'success' ? '#f0fdf4' : '#fef2f2',
                            color: statusType === 'success' ? '#166534' : '#991b1b'
                        }}>
                            {statusMessage}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="form-grid-2col">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>First Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                <input
                                    required value={personal.firstName} onChange={e => setPersonal({ ...personal, firstName: e.target.value })}
                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Surname / Last Name</label>
                            <input
                                required value={personal.lastName} onChange={e => setPersonal({ ...personal, lastName: e.target.value })}
                                style={{ width: '100%', padding: '1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>City</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                <input
                                    required value={personal.city} onChange={e => setPersonal({ ...personal, city: e.target.value })}
                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Country</label>
                            <input
                                required value={personal.country} onChange={e => setPersonal({ ...personal, country: e.target.value })}
                                style={{ width: '100%', padding: '1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Pin Code</label>
                            <div style={{ position: 'relative' }}>
                                <Pin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                <input
                                    required value={personal.pinCode} onChange={e => setPersonal({ ...personal, pinCode: e.target.value })}
                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Phone</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                <input
                                    required value={personal.phone} onChange={e => setPersonal({ ...personal, phone: e.target.value })}
                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="span-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                <input
                                    required value={personal.email} readOnly
                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', opacity: 0.7 }}
                                />
                            </div>
                        </div>

                        <div className="span-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Professional Title</label>
                            <input
                                value={personal.title}
                                onChange={e => setPersonal({ ...personal, title: e.target.value })}
                                placeholder="Software Engineer"
                                style={{ width: '100%', padding: '1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                            />
                        </div>

                        <div className="span-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Professional Summary</label>
                            <textarea
                                value={personal.summary}
                                onChange={e => setPersonal({ ...personal, summary: e.target.value })}
                                placeholder="Write a short professional summary"
                                rows={4}
                                style={{ width: '100%', padding: '1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', resize: 'vertical' }}
                            />
                        </div>

                        <div className="span-2" style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.75rem' }}>Skills</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <input
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && skillInput.trim()) {
                                            e.preventDefault()
                                            setLocalSkills([...(skills || []), { name: skillInput.trim() }])
                                            setSkillInput('')
                                        }
                                    }}
                                    placeholder="Add skill and press Enter"
                                    style={{ flex: 1, padding: '0.9rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!skillInput.trim()) return
                                        setLocalSkills([...(skills || []), { name: skillInput.trim() }])
                                        setSkillInput('')
                                    }}
                                    style={{ padding: '0.9rem 1rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px', fontWeight: 800 }}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {(skills || []).map((skill, idx) => {
                                    const name = typeof skill === 'string' ? skill : (skill?.name || '')
                                    if (!name) return null
                                    return (
                                        <div key={`skill-${idx}`} style={{ background: '#dbeafe', color: '#1e40af', padding: '0.35rem 0.7rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.8rem' }}>
                                            {name}
                                            <button
                                                type="button"
                                                onClick={() => setLocalSkills((skills || []).filter((_, i) => i !== idx))}
                                                style={{ color: '#1e3a8a' }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="span-2" style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.25rem', paddingTop: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.75rem' }}>Experience</h3>
                            {(experience || []).map((exp, idx) => (
                                <div key={`exp-${idx}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input value={exp.role || ''} onChange={(e) => setLocalExperience(experience.map((it, i) => i === idx ? { ...it, role: e.target.value } : it))} placeholder="Role" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                        <input value={exp.company || ''} onChange={(e) => setLocalExperience(experience.map((it, i) => i === idx ? { ...it, company: e.target.value } : it))} placeholder="Company" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input value={exp.startDate || ''} onChange={(e) => setLocalExperience(experience.map((it, i) => i === idx ? { ...it, startDate: e.target.value } : it))} placeholder="Start Date" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                        <input value={exp.endDate || ''} onChange={(e) => setLocalExperience(experience.map((it, i) => i === idx ? { ...it, endDate: e.target.value } : it))} placeholder="End Date" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                    </div>
                                    <textarea value={exp.description || ''} onChange={(e) => setLocalExperience(experience.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} placeholder="Description" rows={3} style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff', marginBottom: '0.5rem', resize: 'vertical' }} />
                                    <button type="button" onClick={() => setLocalExperience(experience.filter((_, i) => i !== idx))} style={{ color: '#dc2626', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => setLocalExperience([...(experience || []), { role: '', company: '', startDate: '', endDate: '', description: '' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 800 }}>
                                <Plus size={14} /> Add Experience
                            </button>
                        </div>

                        <div className="span-2" style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.25rem', paddingTop: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.75rem' }}>Education</h3>
                            {(education || []).map((edu, idx) => (
                                <div key={`edu-${idx}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input value={edu.degree || ''} onChange={(e) => setLocalEducation(education.map((it, i) => i === idx ? { ...it, degree: e.target.value } : it))} placeholder="Degree" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                        <input value={edu.school || edu.institution || ''} onChange={(e) => setLocalEducation(education.map((it, i) => i === idx ? { ...it, school: e.target.value, institution: e.target.value } : it))} placeholder="School / Institution" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input value={edu.startDate || ''} onChange={(e) => setLocalEducation(education.map((it, i) => i === idx ? { ...it, startDate: e.target.value } : it))} placeholder="Start Date" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                        <input value={edu.endDate || edu.year || ''} onChange={(e) => setLocalEducation(education.map((it, i) => i === idx ? { ...it, endDate: e.target.value, year: e.target.value } : it))} placeholder="End Date / Year" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                    </div>
                                    <textarea value={edu.description || ''} onChange={(e) => setLocalEducation(education.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} placeholder="Description" rows={2} style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff', marginBottom: '0.5rem', resize: 'vertical' }} />
                                    <button type="button" onClick={() => setLocalEducation(education.filter((_, i) => i !== idx))} style={{ color: '#dc2626', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => setLocalEducation([...(education || []), { degree: '', school: '', startDate: '', endDate: '', description: '' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 800 }}>
                                <Plus size={14} /> Add Education
                            </button>
                        </div>

                        <div className="span-2" style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.25rem', paddingTop: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.75rem' }}>Projects</h3>
                            {(projects || []).map((project, idx) => (
                                <div key={`project-${idx}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input value={project.name || ''} onChange={(e) => setLocalProjects(projects.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))} placeholder="Project Name" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                        <input value={project.link || ''} onChange={(e) => setLocalProjects(projects.map((it, i) => i === idx ? { ...it, link: e.target.value } : it))} placeholder="Project Link" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                    </div>
                                    <textarea value={project.description || ''} onChange={(e) => setLocalProjects(projects.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} placeholder="Project Description" rows={3} style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff', marginBottom: '0.5rem', resize: 'vertical' }} />
                                    <button type="button" onClick={() => setLocalProjects(projects.filter((_, i) => i !== idx))} style={{ color: '#dc2626', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => setLocalProjects([...(projects || []), { name: '', link: '', description: '' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 800 }}>
                                <Plus size={14} /> Add Project
                            </button>
                        </div>

                        <div className="span-2" style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.25rem', paddingTop: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.75rem' }}>Certifications</h3>
                            {(certifications || []).map((cert, idx) => (
                                <div key={`cert-${idx}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input value={cert.name || ''} onChange={(e) => setLocalCertifications(certifications.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))} placeholder="Certification Name" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                        <input value={cert.issuer || ''} onChange={(e) => setLocalCertifications(certifications.map((it, i) => i === idx ? { ...it, issuer: e.target.value } : it))} placeholder="Issuer" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input value={cert.issueDate || ''} onChange={(e) => setLocalCertifications(certifications.map((it, i) => i === idx ? { ...it, issueDate: e.target.value } : it))} placeholder="Issue Date" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                        <input value={cert.expiryDate || ''} onChange={(e) => setLocalCertifications(certifications.map((it, i) => i === idx ? { ...it, expiryDate: e.target.value } : it))} placeholder="Expiry Date" style={{ width: '100%', padding: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#fff' }} />
                                    </div>
                                    <button type="button" onClick={() => setLocalCertifications(certifications.filter((_, i) => i !== idx))} style={{ color: '#dc2626', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => setLocalCertifications([...(certifications || []), { name: '', issuer: '', issueDate: '', expiryDate: '' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 800 }}>
                                <Plus size={14} /> Add Certification
                            </button>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="span-2"
                            style={{
                                padding: '1.2rem', background: success ? '#10b981' : 'var(--color-accent-primary)',
                                color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '1rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                transition: 'all 0.3s'
                            }}
                        >
                            {loading ? 'Saving...' : (success ? 'Profile Saved! Redirecting...' : 'Save & Pick a Template')}
                            {!loading && !success && <ArrowRight size={20} />}
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    )
}
