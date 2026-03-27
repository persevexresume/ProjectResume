import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, ExternalLink, Award, BookOpen, Briefcase, Code, GraduationCap, User, Star, Monitor } from 'lucide-react';
import { ImageSeriesLayout } from './ImageSeriesLayout';
import useStore from '../../store/useStore';
import { resumeTemplates } from '../../data/templates';

import EnhancedTemplateRenderer from '../templates/EnhancedTemplateRenderer';

/**
 * CORE RENDERING ENGINE
 */
export default function ResumeRenderer({ data, templateId, customization: customProps }) {
    const store = useStore();
    const finalData = data || store.resumeData;
    const finalTemplateId = templateId || store.selectedTemplate;
    const finalCustomization = customProps || store.customization;

    if (!finalData || !finalData.personalInfo) return null;

    // Check if it's one of the new 55 templates
    const newTemplate = resumeTemplates.find(t => t.id === finalTemplateId);
    if (newTemplate) {
        return (
            <EnhancedTemplateRenderer 
                template={newTemplate} 
                resumeData={finalData} 
                themeColor={finalCustomization?.themeColor || newTemplate.colors?.accent || '#3b82f6'} 
            />
        );
    }

    const [category, variantStr] = (finalTemplateId || "").split('-');
    const variant = parseInt(variantStr) || 1;

    const getTemplate = () => {
        if (category === 'image') return <ImageSeriesLayout data={finalData} templateId={finalTemplateId} customization={finalCustomization} />;
        if (category === 'elite') return <EliteLayout data={finalData} templateId={finalTemplateId} customization={finalCustomization} />;
        if (category === 'fp') return <DynamicFreepikLayout data={finalData} templateId={finalTemplateId} customization={finalCustomization} />;

        switch (category) {
            case 'exec': return <ExecutiveLayout data={finalData} variant={variant} customization={finalCustomization} />;
            case 'modern': return <ModernLayout data={finalData} variant={variant} customization={finalCustomization} />;
            case 'func': return <FunctionalLayout data={finalData} variant={variant} customization={finalCustomization} />;
            case 'classic': return <ClassicLayout data={finalData} variant={variant} customization={finalCustomization} />;
            case 'minimal': return <MinimalLayout data={finalData} variant={variant} customization={finalCustomization} />;
            case 'acad': return <AcademicLayout data={finalData} variant={variant} customization={finalCustomization} />;
            case 'start': return <StartupLayout data={finalData} variant={variant} customization={finalCustomization} />;
            case 'creative': return <CreativeLayout data={finalData} variant={variant} customization={finalCustomization} />;
            default: return <ModernLayout data={finalData} variant={variant} customization={finalCustomization} />;
        }
    };

    return (
        <div id="resume-content" style={{
            fontFamily: finalCustomization.font || 'Inter, sans-serif',
            fontSize: finalCustomization.fontSize || '14px',
            color: '#1e293b',
            lineHeight: 1.6,
            width: '794px',
            maxWidth: '794px',
            minHeight: '1123px',
            background: '#fff',
            margin: '0 auto',
            padding: '0',
            boxSizing: 'border-box'
        }}>
            {getTemplate()}
        </div>
    );
}

// -----------------------------------------------------------------------------
// HELPER COMPONENTS
// -----------------------------------------------------------------------------
const Section = ({ title, color, children, variant = 1, textAlign = 'left' }) => {
    const isBordered = variant % 3 === 0;
    return (
        <div style={{ marginBottom: '4rem', textAlign }}>
            <div style={{ 
                borderBottom: isBordered ? `3px solid ${color}` : 'none', 
                paddingBottom: isBordered ? '0.8rem' : '0', 
                marginBottom: '2rem' 
            }}>
                <h2 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.15em', 
                    color: !isBordered ? color : '#0f172a',
                    borderLeft: !isBordered ? `4px solid ${color}` : 'none',
                    paddingLeft: !isBordered ? '1.5rem' : '0'
                }}>
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
};

const SidebarSection = ({ title, color, children }) => (
    <div style={{ marginBottom: '3.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '14px', background: color }}></div> {title}
        </h3>
        {children}
    </div>
);

const ContactItem = ({ icon, text }) => text ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{text}</span>
    </div>
) : null;

// -----------------------------------------------------------------------------
// ELITE SERIES - HIGH FIDELITY DESIGNS
// -----------------------------------------------------------------------------
const EliteLayout = ({ data, templateId, customization }) => {
    const { personalInfo, experience, skills, education, projects, certifications } = data;
    const themeColor = customization.themeColor || '#4f46e5';

    // 1. ELITE BAXTER (Financial Executive)
    if (templateId === 'elite-baxter') {
        const yellow = '#FBBF24';
        const dark = '#0f172a';
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '32% 1fr', minHeight: '1123px' }}>
                <div style={{ background: dark, color: '#fff', padding: '5rem 3rem' }}>
                    <div style={{ width: '120px', height: '120px', background: yellow, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900, marginBottom: '3rem', color: dark }}>
                        {personalInfo.firstName?.charAt(0)}
                    </div>
                    <h1 style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.5rem' }}>{personalInfo.firstName}<br/><span style={{ color: yellow }}>{personalInfo.lastName}</span></h1>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '3px', color: '#94a3b8', marginBottom: '5rem' }}>{personalInfo.title?.toUpperCase()}</p>
                    <SidebarSection title="CONNECT" color={yellow}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.85rem', overflowWrap: 'break-word' }}>
                            <ContactItem icon={<Mail size={14} color={yellow}/>} text={personalInfo?.email} />
                            <ContactItem icon={<Phone size={14} color={yellow}/>} text={personalInfo?.phone} />
                            <ContactItem icon={<MapPin size={14} color={yellow}/>} text={personalInfo?.location} />
                        </div>
                    </SidebarSection>
                    {education && education.length > 0 && (
                        <SidebarSection title="EDUCATION" color={yellow}>
                            {education.map((edu, i) => (
                                <div key={i} style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontWeight: 800 }}>{edu.degree}</p>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{edu.school}</p>
                                </div>
                            ))}
                        </SidebarSection>
                    )}
                </div>
                <div style={{ padding: '6rem 4rem' }}>
                    {personalInfo.summary && <Section title="PROFILE" color={dark}><p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#475569' }}>{personalInfo.summary}</p></Section>}
                    {experience && experience.length > 0 && (
                        <Section title="EXPERIENCE" color={dark}>
                            {experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '3.5rem', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontSize: '1.3rem', fontWeight: 900, flex: '1 1 300px', overflowWrap: 'break-word' }}>{exp.role}</h4>
                                        <span style={{ fontWeight: 700, color: yellow, background: dark, padding: '0.2rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', flexShrink: 0 }}>{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <p style={{ fontWeight: 800, color: '#64748b', marginBottom: '1.2rem' }}>{exp.company}</p>
                                    <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.8 }}>{exp.description}</p>
                                </div>
                            ))}
                        </Section>
                    )}
                </div>
            </div>
        );
    }

    // 2. ELITE WATSON (Elegant Academic)
    if (templateId === 'elite-watson') {
        return (
            <div style={{ padding: '6rem 12%', minHeight: '1123px', fontFamily: '"Playfair Display", serif' }}>
                <header style={{ textAlign: 'center', marginBottom: '6rem' }}>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: 400, margin: 0, letterSpacing: '-0.02em' }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
                    <div style={{ height: '1px', width: '100px', background: '#e2e8f0', margin: '2rem auto' }}></div>
                    <p style={{ fontSize: '1.2rem', fontStyle: 'italic', color: '#64748b' }}>{personalInfo.title}</p>
                </header>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', marginBottom: '6rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <ContactItem icon={<Mail size={16} />} text={personalInfo.email} />
                        <ContactItem icon={<Globe size={16} />} text={personalInfo.website} />
                    </div>
                    <div>
                        <ContactItem icon={<Phone size={16} />} text={personalInfo.phone} />
                        <ContactItem icon={<MapPin size={16} />} text={personalInfo.location} />
                    </div>
                </div>
                {personalInfo.summary && <Section title="Biography" color="#0f172a"><p style={{ fontSize: '1.15rem', lineHeight: 2 }}>{personalInfo.summary}</p></Section>}
                {experience && experience.length > 0 && (
                    <Section title="Tenure" color="#0f172a">
                        {experience.map((exp, i) => (
                            <div key={i} style={{ marginBottom: '4rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{exp.role}</h4>
                                    <span style={{ fontStyle: 'italic' }}>{exp.startDate} – {exp.endDate}</span>
                                </div>
                                <p style={{ fontWeight: 700, opacity: 0.6, margin: '0.5rem 0 1.5rem' }}>{exp.company}</p>
                                <p style={{ lineHeight: 1.8, fontSize: '1.05rem', color: '#334155' }}>{exp.description}</p>
                            </div>
                        ))}
                    </Section>
                )}
            </div>
        );
    }

    // 3. ELITE ROBERTSON (Tech Visionary)
    if (templateId === 'elite-robertson') {
        const neon = '#10b981';
        return (
            <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '1123px', display: 'grid', gridTemplateColumns: '350px 1fr' }}>
                <div style={{ borderRight: '1px solid #1f2937', padding: '5rem 3rem' }}>
                    <div style={{ marginBottom: '5rem' }}>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: neon, margin: 0 }}>{personalInfo.firstName?.charAt(0)}</h1>
                        <p style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '1rem' }}>{personalInfo.firstName} {personalInfo.lastName}</p>
                    </div>
                    <SidebarSection title="CHANNELS" color={neon}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>
                            <div>{personalInfo.email}</div>
                            <div>{personalInfo.phone}</div>
                         </div>
                    </SidebarSection>
                    <SidebarSection title="STACK" color={neon}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {skills.map((s, i) => <div key={i} style={{ fontSize: '0.8rem', color: neon }}>{s.name}</div>)}
                        </div>
                    </SidebarSection>
                    {education.length > 0 && (
                        <SidebarSection title="ACADEMIA" color={neon}>
                            {education.map((edu, i) => (
                                <div key={i} style={{ marginBottom: '1rem', borderLeft: `2px solid ${neon}`, paddingLeft: '1rem' }}>
                                    <p style={{ fontWeight: 900, fontSize: '0.85rem' }}>{edu.degree}</p>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>{edu.school}</p>
                                </div>
                            ))}
                        </SidebarSection>
                    )}
                </div>
                <div style={{ padding: '6rem 5rem' }}>
                    <section style={{ marginBottom: '8rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 900, color: neon, letterSpacing: '4px', marginBottom: '2rem' }}>INITIALIZATION</h2>
                        <p style={{ fontSize: '1.4rem', fontWeight: 300, lineHeight: 1.8 }}>{personalInfo.summary}</p>
                    </section>
                    {experience && experience.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: '1rem', fontWeight: 900, color: neon, letterSpacing: '4px', marginBottom: '4rem' }}>EXECUTION LOG</h2>
                            {experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <h4 style={{ fontSize: '1.8rem', fontWeight: 900, flex: '1 1 300px', color: neon, overflowWrap: 'break-word' }}>{exp.role}</h4>
                                        <span style={{ fontSize: '0.9rem', opacity: 0.4, flexShrink: 0 }}>{exp.startDate} // {exp.endDate}</span>
                                    </div>
                                    <p style={{ color: neon, fontWeight: 700, margin: '0.5rem 0 2rem' }}>{exp.company}</p>
                                    <p style={{ fontSize: '1.1rem', opacity: 0.6, lineHeight: 1.7 }}>{exp.description}</p>
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        );
    }

    // 4. ELITE WALDO (Signature Branding)
    if (templateId === 'elite-waldo') {
        const brand = '#2563eb';
        return (
            <div style={{ padding: '8rem 15%', minHeight: '1123px', textAlign: 'center' }}>
                <header style={{ marginBottom: '8rem' }}>
                    <h1 style={{ fontSize: '5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', lineHeight: 0.9 }}>{personalInfo.firstName}<br/>{personalInfo.lastName}</h1>
                    <p style={{ fontSize: '1.5rem', fontWeight: 500, color: '#64748b', marginTop: '2rem' }}>{personalInfo.title}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '3rem', fontSize: '0.9rem', fontWeight: 700, opacity: 0.5 }}>
                        <span>{personalInfo.email}</span>
                        <span>{personalInfo.phone}</span>
                        <span>{personalInfo.location}</span>
                    </div>
                </header>
                <div style={{ textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '6rem' }}>
                    <div>
                        <Section title="Philosophy" color={brand}><p style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>{personalInfo.summary}</p></Section>
                        {education.length > 0 && (
                            <Section title="Academic Path" color={brand}>
                                {education.map((edu, i) => (
                                    <div key={i} style={{ marginBottom: '2rem' }}>
                                        <h4 style={{ fontWeight: 800 }}>{edu.degree}</h4>
                                        <p style={{ opacity: 0.6 }}>{edu.school} // {edu.endDate}</p>
                                    </div>
                                ))}
                            </Section>
                        )}
                    </div>
                    <div>
                        {experience && experience.length > 0 && (
                            <Section title="The Chronicle" color={brand}>
                                {experience.map((exp, i) => (
                                    <div key={i} style={{ marginBottom: '4rem' }}>
                                        <h4 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{exp.role}</h4>
                                        <p style={{ fontWeight: 700, background: brand, color: '#fff', display: 'inline-block', padding: '0.2rem 0.8rem', margin: '0.5rem 0 1.5rem' }}>{exp.company}</p>
                                        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#475569' }}>{exp.description}</p>
                                    </div>
                                ))}
                            </Section>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 5. ELITE MARIANA (Geometric Tech)
    if (templateId === 'elite-mariana') {
        const primary = '#1e3a8a';
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', minHeight: '1123px' }}>
                <div style={{ background: primary, color: '#fff', padding: '6rem 3rem', clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem' }}>{personalInfo.firstName}</h1>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 300, marginBottom: '4rem' }}>{personalInfo.lastName}</h1>
                    <SidebarSection title="INFRASTRUCTURE" color="#60a5fa">
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {skills.map((s, i) => <div key={i} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>{s.name}</div>)}
                        </div>
                    </SidebarSection>
                    {education.length > 0 && (
                        <SidebarSection title="CERTIFICATION" color="#60a5fa">
                            {education.map((edu, i) => <div key={i} style={{ marginBottom: '1.5rem', opacity: 0.8 }}><strong>{edu.degree}</strong><br/>{edu.school}</div>)}
                        </SidebarSection>
                    )}
                </div>
                <div style={{ padding: '8rem 6rem 8rem 2rem' }}>
                    <Section title="Executive Summary" color={primary}><p style={{ fontSize: '1.2rem', lineHeight: 1.9, color: '#334155' }}>{personalInfo.summary}</p></Section>
                    {experience && experience.length > 0 && (
                        <Section title="Professional Ledger" color={primary}>
                            {experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '4rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '1.5rem', fontWeight: 900, color: primary }}>{exp.role}</h4>
                                        <span style={{ fontWeight: 700, opacity: 0.4 }}>{exp.startDate} — {exp.endDate}</span>
                                    </div>
                                    <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>{exp.company}</p>
                                    <p style={{ color: '#64748b', lineHeight: 1.8 }}>{exp.description}</p>
                                </div>
                            ))}
                        </Section>
                    )}
                </div>
            </div>
        );
    }

    // 6. ELITE SMITH (Swiss Grid)
    if (templateId === 'elite-smith') {
        const accent = '#ef4444';
        return (
            <div style={{ padding: '6rem', minHeight: '1123px', background: '#f5f5f5', color: '#1a1a1a' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                    <div style={{ gridColumn: 'span 8', borderBottom: '4px solid #1a1a1a', paddingBottom: '4rem' }}>
                        <h1 style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.8 }}>{personalInfo.firstName}<br/>{personalInfo.lastName}</h1>
                    </div>
                    <div style={{ gridColumn: 'span 4', borderBottom: '4px solid #1a1a1a', paddingBottom: '4rem', textAlign: 'right' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: 900 }}>{personalInfo.title?.toUpperCase()}</p>
                        <p style={{ marginTop: '2rem', opacity: 0.6 }}>{personalInfo.email}<br/>{personalInfo.phone}</p>
                    </div>
                    <div style={{ gridColumn: 'span 4', marginTop: '4rem' }}>
                        <SidebarSection title="01 CONTACT" color={accent}>
                            <p>{personalInfo.location}<br/>{personalInfo.linkedin}</p>
                        </SidebarSection>
                        <SidebarSection title="02 CAPABILITIES" color={accent}>
                            <div style={{ display: 'grid', gap: '0.8rem' }}>
                                {skills.map((s, i) => <div key={i} style={{ fontWeight: 900 }}>{s.name.toUpperCase()}</div>)}
                            </div>
                        </SidebarSection>
                        {education.length > 0 && (
                            <SidebarSection title="03 ACADEMY" color={accent}>
                                {education.map((edu, i) => (
                                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                                        <p style={{ fontWeight: 900 }}>{edu.degree.toUpperCase()}</p>
                                        <p style={{ fontSize: '0.85rem' }}>{edu.school}</p>
                                    </div>
                                ))}
                            </SidebarSection>
                        )}
                    </div>
                    <div style={{ gridColumn: 'span 8', marginTop: '4rem' }}>
                        <section style={{ marginBottom: '6rem' }}>
                            <div style={{ fontSize: '4rem', fontWeight: 900, opacity: 0.1 }}>04</div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', borderTop: '2px solid #1a1a1a', paddingTop: '1rem', marginBottom: '2rem' }}>The Profile</h3>
                            <p style={{ fontSize: '1.25rem', lineHeight: 1.8 }}>{personalInfo.summary}</p>
                        </section>
                        {experience && experience.length > 0 && (
                            <section>
                                <div style={{ fontSize: '4rem', fontWeight: 900, opacity: 0.1 }}>05</div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', borderTop: '2px solid #1a1a1a', paddingTop: '1rem', marginBottom: '4rem' }}>Professional Record</h3>
                                {experience.map((exp, i) => (
                                    <div key={i} style={{ marginBottom: '4rem' }}>
                                        <h4 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{exp.role}</h4>
                                        <p style={{ color: accent, fontWeight: 900, margin: '0.5rem 0' }}>{exp.company}</p>
                                        <p style={{ opacity: 0.5, marginBottom: '1.5rem' }}>{exp.startDate} — {exp.endDate}</p>
                                        <p style={{ lineHeight: 1.7, color: '#444' }}>{exp.description}</p>
                                    </div>
                                ))}
                            </section>
                        )}
                    </div>
                </div>
            </div>
        );
    }
};

// -----------------------------------------------------------------------------
// STANDARD LAYOUTS (RECONSTRUCTED)
// -----------------------------------------------------------------------------
const ModernLayout = ({ data, variant, customization }) => {
    const { personalInfo, experience, skills, education, projects, certifications } = data;
    const color = customization.themeColor || '#4f46e5';
    return (
        <div style={{ padding: '4rem' }}>
            <header style={{ marginBottom: '4rem', borderBottom: `4px solid ${color}`, paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color, marginTop: '0.5rem' }}>{personalInfo.title}</p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', opacity: 0.6, fontSize: '0.9rem' }}>
                    <span>{personalInfo.email}</span>
                    <span>{personalInfo.phone}</span>
                    <span>{personalInfo.location}</span>
                </div>
            </header>
            {personalInfo.summary && <Section title="Summary" color={color} variant={variant}><p>{personalInfo.summary}</p></Section>}
            {experience && experience.length > 0 && (
                <Section title="Experience" color={color} variant={variant}>
                    {experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '2.5rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h4 style={{ fontWeight: 800, fontSize: '1.2rem', flex: '1 1 300px' }}>{exp.role}</h4>
                                <span style={{ fontWeight: 700, color, flexShrink: 0 }}>{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <p style={{ fontWeight: 700, opacity: 0.5 }}>{exp.company}</p>
                            <p style={{ marginTop: '0.8rem' }}>{exp.description}</p>
                        </div>
                    ))}
                </Section>
            )}
            {education && education.length > 0 && (
                <Section title="Education" color={color} variant={variant}>
                    {education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontWeight: 800 }}>{edu.degree}</h4>
                            <p>{edu.school} | {edu.endDate}</p>
                        </div>
                    ))}
                </Section>
            )}
            {projects && projects.length > 0 && (
                <Section title="Projects" color={color} variant={variant}>
                    {projects.map((proj, i) => (
                        <div key={i} style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h4 style={{ fontWeight: 800, fontSize: '1.2rem', flex: '1 1 300px' }}>{proj.name}</h4>
                                <span style={{ fontWeight: 700, color, flexShrink: 0 }}>{proj.startDate} - {proj.endDate}</span>
                            </div>
                            <p style={{ fontWeight: 700, opacity: 0.5 }}>{proj.role}</p>
                            <p style={{ marginTop: '0.8rem' }}>{proj.description}</p>
                        </div>
                    ))}
                </Section>
            )}
            {certifications && certifications.length > 0 && (
                <Section title="Certifications" color={color} variant={variant}>
                    {certifications.map((cert, i) => (
                        <div key={i} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{cert.name}</h4>
                            <p style={{ fontWeight: 600, opacity: 0.7 }}>{cert.issuer} | {cert.issueDate}</p>
                        </div>
                    ))}
                </Section>
            )}
        </div>
    );
};

const ExecutiveLayout = ({ data, variant, customization }) => {
    const color = customization.themeColor || '#1e293b';
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
            <div style={{ background: '#f8fafc', padding: '4rem 2rem', borderRight: '1px solid #e2e8f0' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '4rem' }}>{data.personalInfo.firstName}<br/>{data.personalInfo.lastName}</h1>
                {data.skills && data.skills.length > 0 && (
                    <SidebarSection title="SKILLS" color={color}>
                        {data.skills.map((s, i) => <div key={i} style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{s.name || s}</div>)}
                    </SidebarSection>
                )}
            </div>
            <div style={{ padding: '6rem 4rem' }}>
                {data.personalInfo.summary && <Section title="EXECUTIVE PROFILE" color={color}><p>{data.personalInfo.summary}</p></Section>}
                {data.experience && data.experience.length > 0 && (
                    <Section title="EXPERIENCE" color={color}>
                        {data.experience.map((exp, i) => <div key={i} style={{ marginBottom: '2rem' }}><strong>{exp.role}</strong><br/>{exp.company} | {exp.startDate} - {exp.endDate}</div>)}
                    </Section>
                )}
                {data.education && data.education.length > 0 && (
                    <Section title="EDUCATION" color={color}>
                        {data.education.map((edu, i) => <div key={i} style={{ marginBottom: '1rem' }}>{edu.degree} - {edu.school}</div>)}
                    </Section>
                )}
                {data.projects && data.projects.length > 0 && (
                    <Section title="PROJECTS" color={color}>
                        {data.projects.map((proj, i) => <div key={i} style={{ marginBottom: '2rem' }}><strong>{proj.name}</strong><br/>{proj.role} | {proj.startDate} - {proj.endDate}<br/>{proj.description}</div>)}
                    </Section>
                )}
                {data.certifications && data.certifications.length > 0 && (
                    <Section title="CERTIFICATIONS" color={color}>
                        {data.certifications.map((cert, i) => <div key={i} style={{ marginBottom: '1rem' }}><strong>{cert.name}</strong> - {cert.issuer} ({cert.issueDate})</div>)}
                    </Section>
                )}
            </div>
        </div>
    );
};

// Fallbacks for other layouts to be filled in as needed or keep existing simplicity
const StartupLayout = ({ data, variant, customization }) => {
    const color = customization.themeColor || '#10b981';
    return (
        <div style={{ background: '#f8fafc', padding: '4rem', minHeight: '1123px' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
                <div style={{ background: color, color: '#fff', padding: '4rem 3rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>{data.personalInfo.firstName} {data.personalInfo.lastName}</h1>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, opacity: 0.9 }}>{data.personalInfo.title}</p>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
                        <ContactItem icon={<Mail size={14} color="#fff" />} text={data.personalInfo.email} />
                        <ContactItem icon={<Phone size={14} color="#fff" />} text={data.personalInfo.phone} />
                    </div>
                </div>
                <div style={{ padding: '4rem 3rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '4rem' }}>
                    <div>
                        {experience && experience.length > 0 && (
                            <Section title="DEPLOYMENT_HISTORY" color={color}>
                                {experience.map((exp, i) => (
                                    <div key={i} style={{ marginBottom: '3rem', position: 'relative', borderLeft: `2px dashed ${color}40`, paddingLeft: '2rem', marginLeft: '0.5rem' }}>
                                        <div style={{ position: 'absolute', left: '-5px', top: '0', width: '9px', height: '9px', borderRadius: '50%', background: color }}></div>
                                        <h4 style={{ fontWeight: 800, fontSize: '1.2rem' }}>{exp.role}</h4>
                                        <p style={{ fontWeight: 700, color, fontSize: '0.9rem', margin: '0.4rem 0' }}>{exp.company} // {exp.startDate} - {exp.endDate}</p>
                                        <p style={{ fontSize: '0.95rem', color: '#4d7c0f' }}>{exp.description}</p>
                                    </div>
                                ))}
                            </Section>
                        )}
                        {education && education.length > 0 && (
                            <Section title="ACADEMIC_STAGE" color={color}>
                                {education.map((edu, i) => (
                                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontWeight: 800 }}>{edu.degree}</h4>
                                        <p style={{ opacity: 0.6 }}>{edu.school}, {edu.endDate}</p>
                                    </div>
                                ))}
                            </Section>
                        )}
                    </div>
                    {skills && skills.length > 0 && (
                        <div style={{ background: '#f1f5f9', borderRadius: '16px', padding: '2rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' }}>TECH_STACK</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                {skills.map((s, i) => <span key={i} style={{ background: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #e2e8f0' }}>{s.name || s}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CreativeLayout = ({ data, variant, customization }) => {
    const color = customization.themeColor || '#f43f5e';
    return (
        <div style={{ minHeight: '1123px', background: '#fff', color: '#111' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', height: '400px', background: '#fecdd3' }}>
                <div style={{ padding: '5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1 style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 0.8, color: '#fb7185' }}>{data.personalInfo.firstName}</h1>
                    <h1 style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 0.8 }}>{data.personalInfo.lastName}</h1>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2rem', color }}>{data.personalInfo.title?.toUpperCase()}</p>
                </div>
                <div style={{ background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>E: {data.personalInfo.email}</div>
                        <div>P: {data.personalInfo.phone}</div>
                        <div>L: {data.personalInfo.location}</div>
                     </div>
                </div>
            </div>
            <div style={{ padding: '6rem 10%', display: 'grid', gridTemplateColumns: '1fr 200px', gap: '10%' }}>
                <div>
                    {personalInfo.summary && <Section title="The Vision" color={color}><p style={{ fontSize: '1.25rem', fontStyle: 'italic', lineHeight: 1.8 }}>{personalInfo.summary}</p></Section>}
                    {experience && experience.length > 0 && (
                        <Section title="Trajectory" color={color}>
                            {experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '4rem' }}>
                                    <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{exp.role}</h4>
                                    <p style={{ fontWeight: 800, marginBottom: '1rem' }}>{exp.company} // {exp.startDate} - {exp.endDate}</p>
                                    <p style={{ lineHeight: 1.8, opacity: 0.7 }}>{exp.description}</p>
                                </div>
                            ))}
                        </Section>
                    )}
                </div>
                <div>
                    {skills && skills.length > 0 && (
                        <Section title="Arsenals" color={color}>
                            {skills.map((s, i) => <div key={i} style={{ fontWeight: 900, marginBottom: '0.8rem', borderBottom: '1px solid #111' }}>{s.name || s}</div>)}
                        </Section>
                    )}
                    {education && education.length > 0 && (
                        <Section title="Inspiration" color={color}>
                            {education.map((edu, i) => (
                                <div key={i} style={{ marginBottom: '2rem' }}>
                                    <p style={{ fontWeight: 900 }}>{edu.degree}</p>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>{edu.school}</p>
                                </div>
                            ))}
                        </Section>
                    )}
                </div>
            </div>
        </div>
    );
};

const AcademicLayout = ({ data, variant, customization }) => {
    return (
        <div style={{ padding: '8rem', minHeight: '1123px', fontFamily: '"Times New Roman", serif', background: '#fff' }}>
            <div style={{ textAlign: 'center', marginBottom: '6rem', borderBottom: '2px double #000', paddingBottom: '3rem' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: 400, margin: '0 0 1rem 0' }}>{data.personalInfo.firstName} {data.personalInfo.lastName}</h1>
                <p style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>{data.personalInfo.email} • {data.personalInfo.phone} • {data.personalInfo.location}</p>
            </div>
            {education && education.length > 0 && (
                <Section title="Educational Qualifications" color="#000">
                    {education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem' }}>
                                <span>{edu.school}</span>
                                <span>{edu.endDate}</span>
                            </div>
                            <p style={{ fontStyle: 'italic', fontSize: '1.1rem' }}>{edu.degree}</p>
                        </div>
                    ))}
                </Section>
            )}
            {experience && experience.length > 0 && (
                <Section title="Professional Appointments" color="#000">
                    {experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong style={{ fontSize: '1.2rem' }}>{exp.role.toUpperCase()}</strong>
                                <span>{exp.startDate} – {exp.endDate}</span>
                            </div>
                            <p style={{ fontStyle: 'italic', margin: '0.4rem 0 0.8rem' }}>{exp.company}</p>
                            <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>{exp.description}</p>
                        </div>
                    ))}
                </Section>
            )}
        </div>
    );
};

const FunctionalLayout = ({ data, variant, customization }) => {
    const color = customization.themeColor || '#475569';
    return (
        <div style={{ padding: '5rem', minHeight: '1123px', background: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 30%) 1fr', gap: '5rem' }}>
                <aside>
                    <div style={{ background: color, color: '#fff', padding: '3rem 2rem', borderRadius: '16px' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{data.personalInfo.firstName}</h1>
                        <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2rem' }}>{data.personalInfo.lastName}</h1>
                        <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>{data.personalInfo.email}</p>
                        <p style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '0.5rem' }}>{data.personalInfo.phone}</p>
                    </div>
                    <div style={{ marginTop: '4rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '1.5rem', color }}>EXPERT_SKILLS</h3>
                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {data.skills.map((s, i) => <div key={i} style={{ fontWeight: 800, padding: '0.8rem', background: '#f8fafc', borderRadius: '8px' }}>{s.name}</div>)}
                        </div>
                    </div>
                    {data.education && (
                        <div style={{ marginTop: '4rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '1.5rem', color }}>ACADEMIC_LOG</h3>
                            {data.education.map((edu, i) => (
                                <div key={i} style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontWeight: 800 }}>{edu.degree}</p>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>{edu.school}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>
                <main>
                    {data.personalInfo.summary && <Section title="Career Objective" color={color}><p style={{ fontSize: '1.1rem', color: '#64748b' }}>{data.personalInfo.summary}</p></Section>}
                    {data.experience && data.experience.length > 0 && (
                        <Section title="Expertise Highlights" color={color}>
                             {data.experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: '3rem' }}>
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{exp.role}</h4>
                                    <p style={{ fontWeight: 700, opacity: 0.4, marginBottom: '1rem' }}>{exp.company} // {exp.startDate} - {exp.endDate}</p>
                                    <p style={{ borderLeft: `3px solid ${color}`, paddingLeft: '1.5rem', fontStyle: 'italic' }}>{exp.description}</p>
                                </div>
                            ))}
                        </Section>
                    )}
                </main>
            </div>
        </div>
    );
};

const ClassicLayout = ({ data, variant, customization }) => {
    const color = customization.themeColor || '#1a1a1a';
    return (
        <div style={{ padding: '5rem 4rem', minHeight: '1123px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>{data.personalInfo.firstName} {data.personalInfo.lastName}</h1>
                <p style={{ fontSize: '1.1rem', marginTop: '1rem', fontStyle: 'italic' }}>{data.personalInfo.location} | {data.personalInfo.phone} | {data.personalInfo.email}</p>
                <div style={{ borderBottom: '2px solid #000', marginTop: '3rem' }}></div>
            </div>
            {personalInfo.summary && <Section title="PROFESSIONAL PROFILE" color={color} variant={variant} textAlign="center"><p style={{ maxWidth: '800px', margin: '0 auto' }}>{personalInfo.summary}</p></Section>}
            {experience && experience.length > 0 && (
                <Section title="EXPERIENCE" color={color} variant={variant}>
                    {experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '2.5rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem', fontWeight: 800 }}>
                                <span style={{ flex: '1 1 300px' }}>{exp.role.toUpperCase()}</span>
                                <span style={{ flexShrink: 0 }}>{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <p style={{ fontWeight: 700, opacity: 0.7 }}>{exp.company}</p>
                            <p style={{ marginTop: '0.8rem' }}>{exp.description}</p>
                        </div>
                    ))}
                </Section>
            )}
            {education && education.length > 0 && (
                <Section title="EDUCATION" color={color} variant={variant}>
                    {education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}><span>{edu.degree}</span><span>{edu.endDate}</span></div>
                            <p>{edu.school}</p>
                        </div>
                    ))}
                </Section>
            )}
        </div>
    );
};

export const calculateATSScore = (data) => {
    let score = 0;
    if (!data) return 0;
    const { personalInfo, experience, education, skills, projects } = data;
    if (personalInfo?.email) score += 5;
    if (personalInfo?.phone) score += 5;
    if (personalInfo?.linkedin) score += 5;
    if (personalInfo?.location) score += 5;
    if (personalInfo?.summary?.length > 50) score += 10;
    if (experience?.length > 0) score += 15;
    if (experience?.some(exp => exp.description?.length > 100)) score += 15;
    if (education?.length > 0) score += 15;
    if (skills?.length > 5) score += 15; else if (skills?.length > 0) score += 5;
    if (projects?.length > 0) score += 10;
    return Math.min(score, 100);
};

const DynamicFreepikLayout = ({ data, templateId, customization }) => {
    const template = resumeTemplates.find(t => t.id === templateId) || {};
    const primaryColor = customization.themeColor || template.colors?.primary || '#333';
    const secondaryColor = template.colors?.secondary || '#f3f4f6';
    const accentColor = template.colors?.accent || primaryColor;
    const bgColor = template.colors?.background || '#ffffff';
    
    const isTwoColumn = template.layout === 'two-column';
    const headerStyle = template.headerStyle || 'left';

    const renderHeader = () => {
        const headerStyles = {
            centered: { textAlign: 'center', padding: '4rem 2rem', borderBottom: `2px solid ${primaryColor}10` },
            top: { padding: '4rem 2rem', background: primaryColor, color: '#fff' },
            left: { padding: '4rem 2rem', borderLeft: `8px solid ${primaryColor}`, paddingLeft: '3rem' }
        };

        const currentHeaderStyle = headerStyles[headerStyle] || headerStyles.left;

        return (
            <header style={currentHeaderStyle}>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px', margin: 0 }}>
                    {data.personalInfo.firstName} <span style={{ fontWeight: 300 }}>{data.personalInfo.lastName}</span>
                </h1>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: headerStyle === 'centered' ? 'center' : 'flex-start', fontSize: '0.9rem', opacity: 0.8 }}>
                    <span>{data.personalInfo.email}</span>
                    <span>{data.personalInfo.phone}</span>
                    <span>{data.personalInfo.location}</span>
                </div>
            </header>
        );
    };

    const renderSidebar = () => (
        <aside style={{ width: '30%', padding: '3rem 2rem', background: secondaryColor + '20', borderRight: `1px solid ${secondaryColor}` }}>
             <Section title="Expertise" color={primaryColor}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {data.skills.map((s, i) => (
                        <span key={i} style={{ padding: '0.4rem 0.8rem', background: primaryColor, color: '#fff', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 700 }}>
                            {s.name}
                        </span>
                    ))}
                </div>
            </Section>
            {data.education && (
                <Section title="Education" color={primaryColor}>
                    {data.education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{edu.degree}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{edu.school}</div>
                        </div>
                    ))}
                </Section>
            )}
        </aside>
    );

    const renderMain = () => (
        <main style={{ flex: 1, padding: '3rem 4rem' }}>
            <Section title="Profile Overview" color={primaryColor}>
                <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.7 }}>{data.personalInfo.summary}</p>
            </Section>
            <Section title="Professional Journey" color={primaryColor}>
                {data.experience.map((exp, i) => (
                    <div key={i} style={{ marginBottom: '3rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: primaryColor }}>{exp.role}</h4>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.5 }}>{exp.startDate} — {exp.endDate}</span>
                        </div>
                        <div style={{ fontWeight: 700, marginBottom: '1rem', opacity: 0.8 }}>{exp.company}</div>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b' }}>{exp.description}</p>
                    </div>
                ))}
            </Section>
        </main>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '1120px' }}>
            {renderHeader()}
            <div style={{ display: 'flex', flex: 1 }}>
                {isTwoColumn && renderSidebar()}
                {renderMain()}
                {!isTwoColumn && (
                    <aside style={{ width: '250px', padding: '3rem 2rem', background: '#f8fafc' }}>
                         <Section title="Skills" color={primaryColor}>
                            {data.skills.map((s, i) => <div key={i} style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{s.name}</div>)}
                        </Section>
                    </aside>
                )}
            </div>
        </div>
    );
};
