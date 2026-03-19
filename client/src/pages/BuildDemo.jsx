import { motion } from 'framer-motion'
import { ArrowLeft, User, Briefcase, GraduationCap, Wrench, Palette } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useStore from '../store/useStore'

const DemoResumeRenderer = ({ data }) => {
    return (
        <div
            id="resume-content"
            style={{
                width: '210mm',
                height: '297mm',
                padding: '20mm',
                background: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                lineHeight: 1.5,
                color: '#1f2937'
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #4f46e5' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 5px 0', letterSpacing: '-1px' }}>
                    {data.personalInfo.firstName || 'Your Name'} {data.personalInfo.lastName}
                </h1>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: 600 }}>
                    {data.personalInfo.title || 'Professional Title'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '10px', color: '#6b7280' }}>
                    {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
                    {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
                    {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
                </div>
            </div>

            {/* Professional Summary */}
            {data.personalInfo.summary && (
                <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 900, margin: '0 0 8px 0', textTransform: 'uppercase', color: '#4f46e5', letterSpacing: '0.5px' }}>Professional Summary</h3>
                    <p style={{ margin: 0, fontSize: '10px', color: '#374151' }}>{data.personalInfo.summary}</p>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 900, margin: '0 0 8px 0', textTransform: 'uppercase', color: '#4f46e5', letterSpacing: '0.5px' }}>Experience</h3>
                    {data.experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: 800, margin: 0 }}>{exp.role}</h4>
                                <span style={{ fontSize: '9px', color: '#6b7280' }}>{exp.startDate} - {exp.endDate || 'Present'}</span>
                            </div>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', margin: '2px 0 4px 0' }}>{exp.company} • {exp.location}</p>
                            {exp.description && <p style={{ fontSize: '9px', margin: 0, color: '#374151' }}>{exp.description}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 900, margin: '0 0 8px 0', textTransform: 'uppercase', color: '#4f46e5', letterSpacing: '0.5px' }}>Education</h3>
                    {data.education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: 800, margin: 0 }}>{edu.degree}</h4>
                                <span style={{ fontSize: '9px', color: '#6b7280' }}>{edu.startDate} - {edu.endDate}</span>
                            </div>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', margin: '2px 0 0 0' }}>{edu.school} • {edu.location}</p>
                            {edu.gpa && <p style={{ fontSize: '9px', color: '#6b7280', margin: '2px 0 0 0' }}>GPA: {edu.gpa}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 900, margin: '0 0 8px 0', textTransform: 'uppercase', color: '#4f46e5', letterSpacing: '0.5px' }}>Skills</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {data.skills.map((skill, i) => (
                            <span key={i} style={{
                                fontSize: '9px',
                                background: '#f3f4f6',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                color: '#4f46e5'
                            }}>
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function BuildDemo() {
    const navigate = useNavigate()
    const { resumeData, updatePersonalInfo, setExperience, setEducation, setSkills } = useStore()
    const [activeTab, setActiveTab] = useState('personal')
    const [showPreview, setShowPreview] = useState(true)

    const [personal, setPersonal] = useState({
        firstName: resumeData.personalInfo.firstName || '',
        lastName: resumeData.personalInfo.lastName || '',
        email: resumeData.personalInfo.email || '',
        phone: resumeData.personalInfo.phone || '',
        location: resumeData.personalInfo.location || '',
        title: resumeData.personalInfo.title || '',
        summary: resumeData.personalInfo.summary || ''
    })

    const [experienceList, setExperienceList] = useState(resumeData.experience || [])
    const [educationList, setEducationList] = useState(resumeData.education || [])
    const [skillsList, setSkillsList] = useState(resumeData.skills || [])

    const handleSaveToStore = () => {
        updatePersonalInfo(personal)
        setExperience(experienceList)
        setEducation(educationList)
        setSkills(skillsList)
    }

    const addExperience = () => {
        setExperienceList([...experienceList, {
            id: Date.now(),
            role: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            description: ''
        }])
    }

    const removeExperience = (id) => {
        setExperienceList(experienceList.filter(e => e.id !== id))
    }

    const updateExperience = (id, field, value) => {
        setExperienceList(experienceList.map(e => e.id === id ? { ...e, [field]: value } : e))
    }

    const addEducation = () => {
        setEducationList([...educationList, {
            id: Date.now(),
            school: '',
            degree: '',
            location: '',
            startDate: '',
            endDate: '',
            gpa: ''
        }])
    }

    const removeEducation = (id) => {
        setEducationList(educationList.filter(e => e.id !== id))
    }

    const updateEducation = (id, field, value) => {
        setEducationList(educationList.map(e => e.id === id ? { ...e, [field]: value } : e))
    }

    const addSkill = () => {
        setSkillsList([...skillsList, { id: Date.now(), name: '', level: 'Intermediate' }])
    }

    const removeSkill = (id) => {
        setSkillsList(skillsList.filter(s => s.id !== id))
    }

    const updateSkill = (id, field, value) => {
        setSkillsList(skillsList.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const tabs = [
        { id: 'personal', icon: <User size={18} />, label: 'Personal' },
        { id: 'experience', icon: <Briefcase size={18} />, label: 'Experience' },
        { id: 'education', icon: <GraduationCap size={18} />, label: 'Education' },
        { id: 'skills', icon: <Wrench size={18} />, label: 'Skills' },
    ]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', minHeight: '100vh', paddingTop: '120px', background: '#f8fafc', overflow: 'hidden' }}
        >
            {/* Left: Editor */}
            <div style={{ flex: '0 0 50%', overflowY: 'auto', padding: '2rem', borderRight: '1px solid #e2e8f0' }}>
                <Link to="/student/choice" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', textDecoration: 'none', marginBottom: '2rem', fontWeight: 700 }}>
                    <ArrowLeft size={18} /> Back
                </Link>

                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Resume Builder Demo</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Fill in your information and see it update in real-time on the right side. This is a demo - click Save to store and continue building in the real editor.</p>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.6rem 1rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid #4f46e5' : 'none',
                                color: activeTab === tab.id ? '#4f46e5' : '#6b7280',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Personal Info Tab */}
                {activeTab === 'personal' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>First Name</label>
                            <input
                                value={personal.firstName}
                                onChange={e => setPersonal({ ...personal, firstName: e.target.value })}
                                placeholder="John"
                                style={{ width: '100%', padding: '0.8rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.4rem', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Last Name</label>
                            <input
                                value={personal.lastName}
                                onChange={e => setPersonal({ ...personal, lastName: e.target.value })}
                                placeholder="Doe"
                                style={{ width: '100%', padding: '0.8rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.4rem', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Professional Title</label>
                            <input
                                value={personal.title}
                                onChange={e => setPersonal({ ...personal, title: e.target.value })}
                                placeholder="Software Engineer"
                                style={{ width: '100%', padding: '0.8rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.4rem', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Email</label>
                            <input
                                value={personal.email}
                                onChange={e => setPersonal({ ...personal, email: e.target.value })}
                                placeholder="john@example.com"
                                style={{ width: '100%', padding: '0.8rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.4rem', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Phone</label>
                            <input
                                value={personal.phone}
                                onChange={e => setPersonal({ ...personal, phone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                                style={{ width: '100%', padding: '0.8rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.4rem', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Location</label>
                            <input
                                value={personal.location}
                                onChange={e => setPersonal({ ...personal, location: e.target.value })}
                                placeholder="San Francisco, CA"
                                style={{ width: '100%', padding: '0.8rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.4rem', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Professional Summary</label>
                            <textarea
                                value={personal.summary}
                                onChange={e => setPersonal({ ...personal, summary: e.target.value })}
                                placeholder="Brief overview of your professional background and key achievements..."
                                style={{ width: '100%', padding: '0.8rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '0.4rem', fontSize: '0.9rem', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                            />
                        </div>
                    </div>
                )}

                {/* Experience Tab */}
                {activeTab === 'experience' && (
                    <div>
                        {experienceList.map((exp, idx) => (
                            <div key={exp.id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <input
                                        placeholder="Job Title"
                                        value={exp.role}
                                        onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        placeholder="Company"
                                        value={exp.company}
                                        onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <input
                                    placeholder="Location"
                                    value={exp.location}
                                    onChange={e => updateExperience(exp.id, 'location', e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <input
                                        placeholder="Start Date (MM/YYYY)"
                                        value={exp.startDate}
                                        onChange={e => updateExperience(exp.id, 'startDate', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        placeholder="End Date (MM/YYYY)"
                                        value={exp.endDate}
                                        onChange={e => updateExperience(exp.id, 'endDate', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <textarea
                                    placeholder="Job description and achievements..."
                                    value={exp.description}
                                    onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', minHeight: '60px', fontFamily: 'inherit', marginBottom: '1rem', fontSize: '0.9rem', resize: 'vertical' }}
                                />
                                <button
                                    onClick={() => removeExperience(exp.id)}
                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                                >
                                    Remove Experience
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addExperience}
                            style={{ color: '#4f46e5', background: 'none', border: '2px dashed #4f46e5', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            + Add Experience
                        </button>
                    </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                    <div>
                        {educationList.map((edu) => (
                            <div key={edu.id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <input
                                        placeholder="School/University"
                                        value={edu.school}
                                        onChange={e => updateEducation(edu.id, 'school', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        placeholder="Degree"
                                        value={edu.degree}
                                        onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <input
                                    placeholder="Location"
                                    value={edu.location}
                                    onChange={e => updateEducation(edu.id, 'location', e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <input
                                        placeholder="Start Date"
                                        value={edu.startDate}
                                        onChange={e => updateEducation(edu.id, 'startDate', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        placeholder="End Date"
                                        value={edu.endDate}
                                        onChange={e => updateEducation(edu.id, 'endDate', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        placeholder="GPA"
                                        value={edu.gpa}
                                        onChange={e => updateEducation(edu.id, 'gpa', e.target.value)}
                                        style={{ padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <button
                                    onClick={() => removeEducation(edu.id)}
                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                                >
                                    Remove Education
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addEducation}
                            style={{ color: '#4f46e5', background: 'none', border: '2px dashed #4f46e5', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            + Add Education
                        </button>
                    </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            {skillsList.map((skill) => (
                                <div key={skill.id} style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <input
                                        placeholder="Skill Name"
                                        value={skill.name}
                                        onChange={e => updateSkill(skill.id, 'name', e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.9rem' }}
                                    />
                                    <button
                                        onClick={() => removeSkill(skill.id)}
                                        style={{ width: '100%', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addSkill}
                            style={{ color: '#4f46e5', background: 'none', border: '2px dashed #4f46e5', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            + Add Skill
                        </button>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e2e8f0' }}>
                    <button
                        onClick={handleSaveToStore}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 900,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Save & Continue in Full Editor
                    </button>
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        style={{
                            padding: '1rem 2rem',
                            background: '#e5e7eb',
                            color: '#1f2937',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 900,
                            cursor: 'pointer'
                        }}
                    >
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>
                </div>
            </div>

            {/* Right: Live Preview */}
            {showPreview && (
                <div style={{
                    flex: '0 0 50%',
                    overflowY: 'auto',
                    background: '#e5e7eb',
                    padding: '2rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center'
                }}>
                    <div style={{ background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                        <DemoResumeRenderer data={{ personalInfo: personal, experience: experienceList, education: educationList, skills: skillsList }} />
                    </div>
                </div>
            )}
        </motion.div>
    )
}
