import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, MapPin, Phone, Mail, Pin, ArrowRight, Briefcase, GraduationCap, Zap, Trash2, Plus } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../supabase'
import { getDbUserId } from '../lib/userIdentity'
import { useToast } from '../context/ToastContext'

export default function MasterProfile() {
    const navigate = useNavigate()
    const { success: toastSuccess, error: toastError } = useToast()
    const { user, updatePersonalInfo, setExperience, setEducation, setSkills } = useStore()
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
        summary: '',
        profilePhoto: ''
    })

    const [experience, setLocalExperience] = useState([])
    const [education, setLocalEducation] = useState([])
    const [skills, setLocalSkills] = useState([])

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return

            const dbUserId = getDbUserId(user)
            if (!dbUserId) return

            const tableCandidates = ['profiles', 'master_profiles']

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
                        summary: data.summary || '',
                        profilePhoto: data.profile_photo || data.photo_url || ''
                    })

                    setLocalExperience(Array.isArray(data.experience_data) ? data.experience_data : [])
                    setLocalEducation(Array.isArray(data.education_data) ? data.education_data : [])
                    setLocalSkills(Array.isArray(data.skills_data) ? data.skills_data : [])
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
                location: `${personal.city}, ${personal.country}`,
                profile_photo: personal.profilePhoto,
                experience_data: experience,
                education_data: education,
                skills_data: skills,
                updated_at: new Date().toISOString()
            }

            const saveMasterProfile = async (basePayload) => {
                const tableCandidates = ['profiles', 'master_profiles']

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
                    summary: personal.summary,
                    profilePhoto: personal.profilePhoto
                })
                setExperience(experience)
                setEducation(education)
                setSkills(skills)

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

                    <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                {personal.profilePhoto ? (
                                    <img src={personal.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={60} color="#cbd5e1" />
                                )}
                            </div>
                            <label style={{ position: 'absolute', bottom: '0', right: '0', background: '#3b82f6', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid #fff', boxShadow: '0 5px 15px rgba(59, 130, 246, 0.4)' }}>
                                <Plus size={20} />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                            const reader = new FileReader()
                                            reader.onloadend = () => setPersonal({ ...personal, profilePhoto: reader.result })
                                            reader.readAsDataURL(file)
                                        }
                                    }} 
                                />
                            </label>
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Professional Photo</p>
                    </div>

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

                        <div className="span-2" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginTop: '2.5rem' }}>
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#fef3c7', color: '#d97706', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Briefcase size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Work Experience</h3>
                                </div>
                                <ExperienceSection experience={experience} setExp={setLocalExperience} />
                            </div>

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#dbeafe', color: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <GraduationCap size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Education</h3>
                                </div>
                                <EducationSection education={education} setEdu={setLocalEducation} />
                            </div>

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#f5f3ff', color: '#7c3aed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Zap size={20} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Skills & Expertise</h3>
                                </div>
                                <SkillsSection skills={skills} setSkills={setLocalSkills} />
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="span-2"
                            style={{
                                padding: '1.2rem', background: success ? '#10b981' : 'var(--color-accent-primary)',
                                color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '1rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                transition: 'all 0.3s', marginTop: '2rem',
                                boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.4)'
                            }}
                        >
                            {loading ? 'Saving Your Profile...' : (success ? 'Profile Saved! Redirecting...' : 'Save Master Profile')}
                            {!loading && !success && <ArrowRight size={20} />}
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    )
}

// Sub-components adapted from Build.jsx
const ExperienceSection = ({ experience, setExp }) => {
    const addExp = () => setExp([...experience, { role: '', company: '', startDate: '', endDate: '', description: '' }])
    const updateExp = (idx, field, value) => {
        const updated = [...experience]
        updated[idx][field] = value
        setExp(updated)
    }
    const removeExp = (idx) => setExp(experience.filter((_, i) => i !== idx))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {experience.map((item, idx) => (
                <div key={idx} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative' }}>
                    <button onClick={() => removeExp(idx)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Job Title" value={item.role} onChange={e => updateExp(idx, 'role', e.target.value)} placeholder="Software Engineer" />
                        <InputField label="Company" value={item.company} onChange={e => updateExp(idx, 'company', e.target.value)} placeholder="Google" />
                        <InputField label="Start Date" value={item.startDate} onChange={e => updateExp(idx, 'startDate', e.target.value)} placeholder="Jan 2020" />
                        <InputField label="End Date" value={item.endDate} onChange={e => updateExp(idx, 'endDate', e.target.value)} placeholder="Present" />
                        <div className="md:col-span-2">
                            <InputField label="Description" value={item.description} onChange={e => updateExp(idx, 'description', e.target.value)} placeholder="Describe your achievements..." multiline rows={3} />
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={addExp} style={{ padding: '1rem', background: '#ecfdf5', color: '#059669', border: '2px dashed #10b981', borderRadius: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Add Experience
            </button>
        </div>
    )
}

const EducationSection = ({ education, setEdu }) => {
    const addEdu = () => setEdu([...education, { degree: '', school: '', year: '', grade: '' }])
    const updateEdu = (idx, field, value) => {
        const updated = [...education]
        updated[idx][field] = value
        setEdu(updated)
    }
    const removeEdu = (idx) => setEdu(education.filter((_, i) => i !== idx))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {education.map((item, idx) => (
                <div key={idx} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative' }}>
                    <button onClick={() => removeEdu(idx)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Degree / Course" value={item.degree} onChange={e => updateEdu(idx, 'degree', e.target.value)} placeholder="B.Tech Computer Science" />
                        <InputField label="School / University" value={item.school} onChange={e => updateEdu(idx, 'school', e.target.value)} placeholder="Stanford University" />
                        <InputField label="Year" value={item.year} onChange={e => updateEdu(idx, 'year', e.target.value)} placeholder="2018 - 2022" />
                        <InputField label="GPA / Grade" value={item.grade} onChange={e => updateEdu(idx, 'grade', e.target.value)} placeholder="3.8/4.0" />
                    </div>
                </div>
            ))}
            <button onClick={addEdu} style={{ padding: '1rem', background: '#eff6ff', color: '#2563eb', border: '2px dashed #3b82f6', borderRadius: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Add Education
            </button>
        </div>
    )
}

const SkillsSection = ({ skills, setSkills }) => {
    const [inputValue, setInputValue] = useState('')
    
    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault()
            setSkills([...skills, inputValue.trim()])
            setInputValue('')
        }
    }

    const removeSkill = (idx) => setSkills(skills.filter((_, i) => i !== idx))

    return (
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {skills.map((skill, idx) => (
                    <span key={idx} style={{ background: '#7c3aed', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {skill}
                        <Trash2 size={12} style={{ cursor: 'pointer' }} onClick={() => removeSkill(idx)} />
                    </span>
                ))}
            </div>
            <input 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
                onKeyDown={handleAddSkill}
                placeholder="Type a skill and press Enter..."
                style={{ width: '100%', padding: '0.8rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontWeight: 600 }}
            />
        </div>
    )
}

const InputField = ({ label, value, onChange, placeholder, multiline = false, rows = 1 }) => {
    const Component = multiline ? 'textarea' : 'input'
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>{label}</label>
            <Component
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                style={{ width: '100%', padding: '1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontWeight: 600, fontFamily: 'inherit', resize: 'none' }}
            />
        </div>
    )
}
