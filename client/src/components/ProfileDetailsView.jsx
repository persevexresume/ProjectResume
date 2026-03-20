import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowLeft, Save, Loader } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabase';
import { getDbUserId } from '../lib/userIdentity';

export default function ProfileDetailsView({
    profileData,
    source = 'manual', // 'upload' or 'manual'
    user,
    onBack,
    onSave
}) {
    const { success: toastSuccess, error: toastError } = useToast();
    const [showDetails, setShowDetails] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState(profileData);

    const handleSave = async () => {
        setSaving(true);
        try {
            const dbUserId = getDbUserId(user);
            if (!dbUserId) {
                toastError('User ID not found');
                return;
            }

            // Prepare payload for master_profiles (has all fields including profile_photo)
            const masterPayload = {
                user_id: dbUserId,
                first_name: editData.personalInfo.firstName,
                last_name: editData.personalInfo.lastName,
                title: editData.personalInfo.title,
                email: editData.personalInfo.email,
                phone: editData.personalInfo.phone,
                location: editData.personalInfo.location,
                country: editData.personalInfo.country,
                summary: editData.personalInfo.summary,
                profile_photo: editData.personalInfo.profilePhoto,
                experience_data: editData.experience,
                education_data: editData.education,
                skills_data: editData.skills,
                source: source,
                created_at: new Date().toISOString()
            };

            // Try master_profiles first (preferred table)
            const { error: masterError } = await supabase
                .from('master_profiles')
                .upsert(masterPayload, { onConflict: 'user_id' });

            if (!masterError) {
                toastSuccess(`Profile saved successfully!`);
                if (onSave) onSave(editData);
                return;
            }

            // Fallback: profiles table (without profile_photo column)
            const profilePayload = {
                user_id: dbUserId,
                first_name: editData.personalInfo.firstName,
                last_name: editData.personalInfo.lastName,
                title: editData.personalInfo.title,
                email: editData.personalInfo.email,
                phone: editData.personalInfo.phone,
                city: editData.personalInfo.location,
                country: editData.personalInfo.country,
                summary: editData.personalInfo.summary,
                experience_data: editData.experience,
                education_data: editData.education,
                skills_data: editData.skills,
                source: source,
                created_at: new Date().toISOString()
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(profilePayload, { onConflict: 'user_id' });

            if (!profileError) {
                toastSuccess(`Profile saved successfully!`);
                if (onSave) onSave(editData);
                return;
            }

            throw profileError || masterError;
        } catch (error) {
            toastError(`Error saving profile: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const updateNestedField = (section, field, value) => {
        setEditData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleExperienceChange = (index, field, value) => {
        const newExp = [...editData.experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setEditData(prev => ({ ...prev, experience: newExp }));
    };

    const handleEducationChange = (index, field, value) => {
        const newEdu = [...editData.education];
        newEdu[index] = { ...newEdu[index], [field]: value };
        setEditData(prev => ({ ...prev, education: newEdu }));
    };

    const addExperience = () => {
        setEditData(prev => ({
            ...prev,
            experience: [...prev.experience, {
                jobTitle: '',
                company: '',
                startDate: '',
                endDate: '',
                description: ''
            }]
        }));
    };

    const addEducation = () => {
        setEditData(prev => ({
            ...prev,
            education: [...prev.education, {
                schoolName: '',
                degree: '',
                field: '',
                startDate: '',
                endDate: ''
            }]
        }));
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            padding: '2rem',
            paddingTop: '8rem'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: '1000px', margin: '0 auto' }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2rem'
                }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: '#fff',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 700,
                            color: '#4f46e5'
                        }}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>

                    <div>
                        <span style={{
                            display: 'inline-block',
                            background: source === 'upload' 
                                ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                                : 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            marginRight: '1rem'
                        }}>
                            {source === 'upload' ? '📄 Uploaded Resume' : '✏️ Manual Entry'}
                        </span>
                    </div>
                </div>

                {/* Personal Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '2rem',
                        marginBottom: '2rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                >
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        marginBottom: '1.5rem',
                        color: '#1e293b'
                    }}>
                        Personal Information
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {/* First Name */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                First Name
                            </label>
                            <input
                                type="text"
                                value={editData.personalInfo.firstName}
                                onChange={e => updateNestedField('personalInfo', 'firstName', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={editData.personalInfo.lastName}
                                onChange={e => updateNestedField('personalInfo', 'lastName', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Title */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                Professional Title
                            </label>
                            <input
                                type="text"
                                value={editData.personalInfo.title}
                                onChange={e => updateNestedField('personalInfo', 'title', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={editData.personalInfo.email}
                                onChange={e => updateNestedField('personalInfo', 'email', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={editData.personalInfo.phone}
                                onChange={e => updateNestedField('personalInfo', 'phone', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                City
                            </label>
                            <input
                                type="text"
                                value={editData.personalInfo.location}
                                onChange={e => updateNestedField('personalInfo', 'location', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                Country
                            </label>
                            <input
                                type="text"
                                value={editData.personalInfo.country}
                                onChange={e => updateNestedField('personalInfo', 'country', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#64748b',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase'
                        }}>
                            Professional Summary
                        </label>
                        <textarea
                            value={editData.personalInfo.summary}
                            onChange={e => updateNestedField('personalInfo', 'summary', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontFamily: 'inherit',
                                minHeight: '100px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Skills */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#64748b',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase'
                        }}>
                            Skills (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={editData.skills.join(', ')}
                            onChange={e => setEditData(prev => ({
                                ...prev,
                                skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            }))}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </motion.div>

                {/* Experience Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '2rem',
                        marginBottom: '2rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                >
                    <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: 900,
                        marginBottom: '1.5rem',
                        color: '#1e293b'
                    }}>
                        Experience
                    </h3>

                    {editData.experience.map((exp, idx) => (
                        <div key={idx} style={{
                            background: '#f8fafc',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '1rem'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Job Title"
                                    value={exp.jobTitle}
                                    onChange={e => handleExperienceChange(idx, 'jobTitle', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Company"
                                    value={exp.company}
                                    onChange={e => handleExperienceChange(idx, 'company', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="month"
                                    placeholder="Start Date"
                                    value={exp.startDate}
                                    onChange={e => handleExperienceChange(idx, 'startDate', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="month"
                                    placeholder="End Date"
                                    value={exp.endDate}
                                    onChange={e => handleExperienceChange(idx, 'endDate', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <textarea
                                placeholder="Description"
                                value={exp.description}
                                onChange={e => handleExperienceChange(idx, 'description', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    minHeight: '80px',
                                    marginTop: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    ))}

                    <button
                        onClick={addExperience}
                        style={{
                            background: '#f1f5f9',
                            border: '2px dashed #cbd5e1',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: '#475569'
                        }}
                    >
                        + Add Experience
                    </button>
                </motion.div>

                {/* Education Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '2rem',
                        marginBottom: '2rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                >
                    <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: 900,
                        marginBottom: '1.5rem',
                        color: '#1e293b'
                    }}>
                        Education
                    </h3>

                    {editData.education.map((edu, idx) => (
                        <div key={idx} style={{
                            background: '#f8fafc',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '1rem'
                            }}>
                                <input
                                    type="text"
                                    placeholder="School/University"
                                    value={edu.schoolName}
                                    onChange={e => handleEducationChange(idx, 'schoolName', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Degree"
                                    value={edu.degree}
                                    onChange={e => handleEducationChange(idx, 'degree', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Field of Study"
                                    value={edu.field}
                                    onChange={e => handleEducationChange(idx, 'field', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="month"
                                    placeholder="Start Date"
                                    value={edu.startDate}
                                    onChange={e => handleEducationChange(idx, 'startDate', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <input
                                    type="month"
                                    placeholder="End Date"
                                    value={edu.endDate}
                                    onChange={e => handleEducationChange(idx, 'endDate', e.target.value)}
                                    style={{
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addEducation}
                        style={{
                            background: '#f1f5f9',
                            border: '2px dashed #cbd5e1',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: '#475569'
                        }}
                    >
                        + Add Education
                    </button>
                </motion.div>

                {/* Save Button */}
                <motion.button
                    whileHover={{ y: -2 }}
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        width: '100%',
                        background: saving ? '#cbd5e1' : 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: '#fff',
                        border: 'none',
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}
                >
                    {saving ? (
                        <>
                            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Master Profile
                        </>
                    )}
                </motion.button>
            </motion.div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
