import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase, GraduationCap, User, Star, Award, Code, Monitor } from 'lucide-react';

export const ImageSeriesLayout = ({ data, templateId, customization }) => {
    const { personalInfo, experience, skills, education, projects, certifications } = data;
    const themeColor = customization.themeColor || '#f6b000';

    // 1. IMAGE BAXTER
    if (templateId === 'image-baxter') {
        const yellow = themeColor;
        const dark = '#2b2b2b';
        const lightGray = '#f0f0f0';

        return (
            <div className="image-baxter-container" style={{ backgroundColor: '#ffffff', color: '#333', fontFamily: '"Heebo", "Open Sans", sans-serif' }}>
                {/* Left Sidebar */}
                <div className="image-baxter-sidebar" style={{ background: dark, color: '#fff' }}>
                    {/* Yellow slanted top */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '240px', background: yellow, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)', zIndex: 1 }}></div>
                    
                    <div className="image-baxter-sidebar-padding" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Profile Icon */}
                        <div className="image-baxter-profile-photo" style={{ marginBottom: '2rem' }}>
                            <User size={80} color={dark} />
                        </div>
                    </div>

                    <div style={{ padding: '0 2.5rem 3rem 2.5rem' }}>
                        {/* Contact Me */}
                        <div className="image-baxter-sidebar-section">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
                                <div style={{ backgroundColor: '#fff', borderRadius: '50%', padding: '4px', display: 'flex' }}><User size={14} color={dark} /></div> CONTACT ME
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                                {personalInfo.phone && <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Phone size={14} color={yellow}/> {personalInfo.phone}</div>}
                                {personalInfo.email && <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Mail size={14} color={yellow}/> {personalInfo.email}</div>}
                                {personalInfo.linkedin && <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Linkedin size={14} color={yellow}/> {personalInfo.linkedin}</div>}
                                {personalInfo.location && <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><MapPin size={14} color={yellow}/> {personalInfo.location}</div>}
                            </div>
                        </div>

                        {/* Education */}
                        {education.length > 0 && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
                                    <div style={{ backgroundColor: '#fff', borderRadius: '50%', padding: '4px', display: 'flex' }}><GraduationCap size={14} color={dark} /></div> EDUCATION
                                </h3>
                                {education.map((edu, i) => (
                                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '3px' }}>{edu.degree}</h4>
                                        <p style={{ color: yellow, fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>{edu.school}</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{edu.startDate} - {edu.endDate}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Content */}
                <div className="image-baxter-content">
                    {/* Header */}
                    <div className="image-baxter-header" style={{ backgroundColor: lightGray }}>
                        <h1>
                            {personalInfo.firstName?.toUpperCase()} <span style={{ color: yellow }}>{personalInfo.lastName?.toUpperCase()}</span>
                        </h1>
                        <p>
                            {personalInfo.title}
                        </p>
                    </div>

                    <div className="image-baxter-content-padding">
                        {/* Profile/About */}
                        {personalInfo.summary && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h3 className="image-baxter-section-h3" style={{ color: dark, marginBottom: '1rem' }}>
                                    <div style={{ backgroundColor: yellow, borderRadius: '50%', padding: '6px', display: 'flex' }}><User size={16} color={dark} /></div> ABOUT ME
                                </h3>
                                <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: '#555' }}>
                                    {personalInfo.summary}
                                </p>
                            </div>
                        )}

                        {/* Experience */}
                        {experience.length > 0 && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h3 className="image-baxter-section-h3" style={{ color: dark, marginBottom: '2rem' }}>
                                    <div style={{ backgroundColor: yellow, borderRadius: '50%', padding: '6px', display: 'flex' }}><Briefcase size={16} color={dark} /></div> JOB EXPERIENCE
                                </h3>
                                <div className="image-baxter-experience-timeline">
                                    {experience.map((exp, i) => (
                                        <div key={i} style={{ marginBottom: '2rem', position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '-1.5rem', marginLeft: '-5px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: yellow }}></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: dark, textTransform: 'uppercase' }}>{exp.role}</h4>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>{exp.startDate} - {exp.endDate}</span>
                                            </div>
                                            <p style={{ fontStyle: 'italic', color: '#777', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem' }}>{exp.company}</p>
                                            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#555' }}>{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {skills.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 className="image-baxter-section-h3" style={{ color: dark, marginBottom: '1.5rem' }}>
                                    <div style={{ backgroundColor: yellow, borderRadius: '50%', padding: '6px', display: 'flex' }}><Star size={16} color={dark} /></div> SKILLS
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {skills.map((skill, i) => (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: dark, textTransform: 'uppercase' }}>{skill.name}</span>
                                            <div style={{ width: '100%', height: '6px', backgroundColor: '#eee', borderRadius: '3px' }}>
                                                <div style={{ width: '85%', height: '100%', backgroundColor: yellow, borderRadius: '3px' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 2. IMAGE WATSON
    if (templateId === 'image-watson') {
        const primary = '#1e293b';
        const accent = '#6366f1';
        return (
            <div style={{ background: '#fff', minHeight: '1120px', padding: '0', color: primary }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', height: '1120px' }}>
                    <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,41,59,0.9), transparent)' }} />
                        <User size={200} color="white" style={{ position: 'relative', zIndex: 1, opacity: 0.8 }} />
                        <div style={{ position: 'absolute', bottom: '10%', left: '10%', right: '10%' }}>
                            <h1 style={{ color: '#fff', fontSize: '4rem', fontWeight: 900, marginBottom: '0.5rem' }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
                            <p style={{ color: accent, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '4px' }}>{personalInfo.title?.toUpperCase()}</p>
                        </div>
                    </div>
                    <div style={{ padding: '5rem 4rem', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>The Mission</h2>
                            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#475569' }}>{personalInfo.summary}</p>
                        </div>
                        <div style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: '0.5rem', marginBottom: '2.5rem' }}>Tenure</h2>
                            {experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontWeight: 800, fontSize: '1.2rem' }}>{exp.role}</h4>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.5 }}>{exp.startDate}</span>
                                    </div>
                                    <p style={{ fontWeight: 700, color: accent, fontSize: '0.95rem' }}>{exp.company}</p>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.8rem' }}>{exp.description}</p>
                                </div>
                            ))}
                        </div>
                        {education.length > 0 && (
                            <div style={{ marginBottom: '4rem' }}>
                                <h2 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: '0.5rem', marginBottom: '2.5rem' }}>Credentials</h2>
                                {education.map((edu, i) => (
                                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{edu.degree}</h4>
                                        <p style={{ fontWeight: 700, color: '#444' }}>{edu.school}</p>
                                        <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>{edu.endDate}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: '0.5rem', marginBottom: '2rem' }}>Intelligence</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                {skills.map((s, i) => <span key={i} style={{ background: `${accent}10`, color: accent, padding: '0.5rem 1rem', borderRadius: '4px', fontStyle: 'italic', fontWeight: 700, fontSize: '0.85rem' }}>{s.name}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. IMAGE ROBERTSON
    if (templateId === 'image-robertson') {
        const primary = '#0f172a';
        const accent = '#ef4444';
        return (
            <div style={{ background: primary, color: '#fff', minHeight: '1120px', padding: '0' }}>
                <div style={{ height: '400px', width: '100%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,23,42,0.9), transparent)' }} />
                    <User size={200} color="white" style={{ position: 'absolute', left: '20%', opacity: 0.5, zIndex: 1 }} />
                    <div style={{ position: 'absolute', top: '50%', left: '10%', transform: 'translateY(-50%)', zIndex: 2 }}>
                        <h1 style={{ fontSize: '5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{personalInfo.firstName}</h1>
                        <h1 style={{ fontSize: '5rem', fontWeight: 900, margin: 0, color: accent }}>{personalInfo.lastName}</h1>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700, opacity: 0.7, marginTop: '1rem' }}>/ {personalInfo.title?.toUpperCase()}</p>
                    </div>
                </div>
                <div style={{ padding: '6rem 10%', display: 'grid', gridTemplateColumns: 'minmax(250px, 25%) 1fr', gap: '6rem' }}>
                    <div>
                        <div style={{ marginBottom: '4rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem', borderLeft: `4px solid ${accent}`, paddingLeft: '1.5rem' }}>CONTACT</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: 0.7 }}>
                                <div style={{ display: 'flex', gap: '1rem' }}><Mail size={16} /> {personalInfo.email}</div>
                                <div style={{ display: 'flex', gap: '1rem' }}><Phone size={16} /> {personalInfo.phone}</div>
                                <div style={{ display: 'flex', gap: '1rem' }}><MapPin size={16} /> {personalInfo.location}</div>
                            </div>
                        </div>
                        {education.length > 0 && (
                            <div style={{ marginBottom: '4rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem', borderLeft: `4px solid ${accent}`, paddingLeft: '1.5rem' }}>ACADEMIA</h3>
                                {education.map((edu, i) => (
                                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 900, color: accent }}>{edu.degree}</p>
                                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>{edu.school}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem', borderLeft: `4px solid ${accent}`, paddingLeft: '1.5rem' }}>SKILLS</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {skills.map((s, i) => (
                                    <div key={i}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>{s.name}</div>
                                        <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)' }}>
                                            <div style={{ height: '100%', width: '90%', background: accent }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <section style={{ marginBottom: '6rem' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2.5rem', opacity: 0.1 }}>01. SYNOPSIS</h2>
                            <p style={{ fontSize: '1.2rem', lineHeight: 2, opacity: 0.8 }}>{personalInfo.summary}</p>
                        </section>
                        <section>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '4rem', opacity: 0.1 }}>02. CHRONICLE</h2>
                            {experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '4rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ fontSize: '1.6rem', fontWeight: 900, color: accent }}>{exp.role}</h4>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.4 }}>{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <p style={{ fontWeight: 800, opacity: 0.6, fontSize: '1.1rem', margin: '0.5rem 0 1.5rem' }}>{exp.company}</p>
                                    <p style={{ lineHeight: 1.8, opacity: 0.6 }}>{exp.description}</p>
                                </div>
                            ))}
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    // 4. IMAGE WALDO
    if (templateId === 'image-waldo') {
        const dark = '#1a1c1e';
        const brand = '#f59e0b';
        return (
            <div style={{ background: '#fff', minHeight: '1120px', padding: '0', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 35%) 1fr', minHeight: '1120px' }}>
                    <div style={{ background: dark, color: '#fff', padding: '5rem 3rem' }}>
                        <div style={{ width: '220px', height: '220px', borderRadius: '50%', overflow: 'hidden', border: `8px solid ${brand}`, margin: '0 auto 4rem', boxShadow: `0 0 50px rgba(0,0,0,0.5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a2d3a' }}>
                            <User size={120} color={brand} />
                        </div>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', color: brand, marginBottom: '2.5rem', textAlign: 'center' }}>Contact Me</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '0.5rem' }}><Mail size={20} color={brand} style={{ margin: '0 auto' }} /></div>
                                <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{personalInfo.email}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '0.5rem' }}><Phone size={20} color={brand} style={{ margin: '0 auto' }} /></div>
                                <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{personalInfo.phone}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '0.5rem' }}><MapPin size={20} color={brand} style={{ margin: '0 auto' }} /></div>
                                <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{personalInfo.location}</p>
                            </div>
                        </div>
                        {education.length > 0 && (
                            <div style={{ marginTop: '5rem' }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', color: brand, marginBottom: '2.5rem', textAlign: 'center' }}>Education</h3>
                                {education.map((edu, i) => (
                                    <div key={i} style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                        <p style={{ fontWeight: 800, color: brand }}>{edu.degree}</p>
                                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>{edu.school}</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.4 }}>{edu.endDate}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '6rem 5rem' }}>
                        <div style={{ marginBottom: '8rem' }}>
                            <h1 style={{ fontSize: '4.5rem', fontWeight: 900, color: dark, lineHeight: 0.9, letterSpacing: '-2px' }}>{personalInfo.firstName}<br /><span style={{ color: brand }}>{personalInfo.lastName}</span></h1>
                            <p style={{ fontSize: '1.5rem', fontWeight: 500, color: '#64748b', marginTop: '1.5rem', borderLeft: `6px solid ${brand}`, paddingLeft: '1.5rem' }}>{personalInfo.title?.toUpperCase()}</p>
                        </div>
                        <section style={{ marginBottom: '6rem' }}>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: dark, marginBottom: '2rem' }}>Executive Profile</h3>
                            <p style={{ fontSize: '1.1rem', lineHeight: 1.9, color: '#475569' }}>{personalInfo.summary}</p>
                        </section>
                        <section>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: dark, marginBottom: '3rem' }}>Experience</h3>
                            {experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '4rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: dark }}>{exp.role}</h4>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: brand }}>{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <p style={{ fontWeight: 700, color: '#64748b', fontSize: '1.05rem', marginBottom: '1.5rem' }}>{exp.company}</p>
                                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#64748b' }}>{exp.description}</p>
                                </div>
                            ))}
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    // 5. IMAGE RICHARDS (From ResumeRenderer)
    if (templateId === 'image-richards') {
        const yellow = themeColor;
        const dark = '#2a2b30';
        return (
            <div style={{ display: 'flex', minHeight: '1120px', backgroundColor: '#ffffff', color: '#333', fontFamily: '"Montserrat", sans-serif' }}>
                <div style={{ width: '30%', background: dark, color: '#fff', padding: '3rem 2rem' }}>
                    <div style={{ paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#eaeaea', overflow: 'hidden', margin: '0 auto', border: '5px solid #4a4a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={60} color={dark} />
                        </div>
                    </div>
                
                    <div style={{ marginTop: '2.5rem' }}>
                        {education.length > 0 && (
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem', color: yellow }}>EDUCATION</h3>
                                {education.map((edu, i) => (
                                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>{edu.degree}</h4>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '2px' }}>{edu.school}</p>
                                        <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>{edu.startDate} - {edu.endDate}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem', color: yellow }}>CONTACT</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
                                {personalInfo.phone && <div style={{ display: 'flex', gap: '10px' }}><Phone size={14} color={yellow}/> {personalInfo.phone}</div>}
                                {personalInfo.email && <div style={{ display: 'flex', gap: '10px' }}><Mail size={14} color={yellow}/> {personalInfo.email}</div>}
                                {personalInfo.location && <div style={{ display: 'flex', gap: '10px' }}><MapPin size={14} color={yellow}/> {personalInfo.location}</div>}
                                {personalInfo.linkedin && <div style={{ display: 'flex', gap: '10px' }}><Linkedin size={14} color={yellow}/> {personalInfo.linkedin}</div>}
                            </div>
                        </div>

                        {skills.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem', color: yellow }}>SKILLS</h3>
                                {skills.map((skill, i) => (
                                    <div key={i} style={{ marginBottom: '0.8rem' }}>
                                        <div style={{ fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase' }}>{skill.name}</div>
                                        <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                            <div style={{ width: '85%', height: '100%', backgroundColor: yellow }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ width: '70%', padding: '3rem' }}>
                    <div style={{ backgroundColor: yellow, padding: '3rem 2rem', marginBottom: '3rem' }}>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>{personalInfo.firstName}</h1>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 300, textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>{personalInfo.lastName}</h1>
                        <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '5px', textTransform: 'uppercase', color: dark }}>{personalInfo.title}</p>
                    </div>

                    {personalInfo.summary && (
                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'inline-block' }}>ABOUT ME</h3>
                            <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: '#555' }}>{personalInfo.summary}</p>
                        </div>
                    )}

                    {experience.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #eee', paddingBottom: '0.5rem', marginBottom: '2rem', display: 'inline-block' }}>WORK EXPERIENCE</h3>
                            {experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: dark, textTransform: 'uppercase' }}>{exp.role}</h4>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '0.3rem 0 0.8rem 0' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>{exp.company}</span>
                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: yellow }}></span>
                                        <span style={{ fontSize: '0.85rem', color: '#777' }}>{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#666' }}>{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Template architecture not found for this series.</div>;
};
