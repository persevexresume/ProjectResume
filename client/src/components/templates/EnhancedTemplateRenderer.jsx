import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase, GraduationCap, Award, User, Terminal, Code, Hexagon } from 'lucide-react';

export default function EnhancedTemplateRenderer({ template, resumeData, themeColor }) {
  if (!template || !resumeData) return null;

  const rawPersonalInfo = resumeData.personalInfo || {};
  const personalInfo = {
    ...rawPersonalInfo,
    firstName: rawPersonalInfo.firstName || rawPersonalInfo.first_name || '',
    lastName: rawPersonalInfo.lastName || rawPersonalInfo.last_name || '',
    title: rawPersonalInfo.title || '',
    email: rawPersonalInfo.email || '',
    phone: rawPersonalInfo.phone || '',
    location: rawPersonalInfo.location || [rawPersonalInfo.city, rawPersonalInfo.country].filter(Boolean).join(', '),
    website: rawPersonalInfo.website || '',
    profilePhoto: rawPersonalInfo.profilePhoto || ''
  };

  const summary = resumeData.summary || personalInfo.summary || '';
  const experience = Array.isArray(resumeData.experience) ? resumeData.experience.map((exp) => ({
    ...exp,
    role: exp?.role || exp?.position || '',
    company: exp?.company || exp?.organization || '',
    startDate: exp?.startDate || exp?.start || '',
    endDate: exp?.endDate || exp?.end || '',
    desc: exp?.description || exp?.desc || ''
  })) : [];
  const education = Array.isArray(resumeData.education) ? resumeData.education.map((edu) => ({
    ...edu,
    degree: edu?.degree || edu?.course || '',
    institution: edu?.institution || edu?.school || '',
    year: edu?.year || [edu?.startDate, edu?.endDate].filter(Boolean).join(' - ')
  })) : [];
  const skills = Array.isArray(resumeData.skills) ? resumeData.skills : [];

  const { bg, primary: primaryCol, accent: accentCol } = template.colors || { bg: '#fff', primary: '#1a1a2e', accent: '#3b82f6' };
  const fonts = template.fonts || { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' };
  const finalAccent = themeColor || accentCol;
  const finalPrimary = primaryCol;

  // Helper: Section Label Component
  const SectionLabel = ({ title, icon: Icon, style = {} }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: `1px solid ${finalAccent}33`, paddingBottom: '0.4rem', ...style }}>
      {Icon && <Icon size={16} color={finalAccent} />}
      <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: style.color || finalAccent, margin: 0 }}>
        {title}
      </h3>
    </div>
  );

  // Helper: Contrast Text
  const getContrastText = (hexcolor) => {
    if (!hexcolor || hexcolor === 'transparent') return '#1e293b';
    const hex = hexcolor.replace('#', '');
    if (hex.length === 3) {
      const r = parseInt(hex.substr(0, 1).repeat(2), 16);
      const g = parseInt(hex.substr(1, 1).repeat(2), 16);
      const b = parseInt(hex.substr(2, 1).repeat(2), 16);
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return (yiq >= 128) ? '#1e293b' : '#ffffff';
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#1e293b' : '#ffffff';
  };

  // Helper: Entry Component
  const Entry = ({ title, subtitle, date, description, style = {} }) => (
    <div style={{ marginBottom: '1.2rem', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 750, color: style.color || finalPrimary, margin: 0 }}>{title}</h4>
        {date && <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, color: 'inherit' }}>{date}</span>}
      </div>
      {subtitle && <div style={{ fontSize: '0.85rem', fontWeight: 600, color: style.subtitleColor || finalAccent, marginTop: '0.1rem' }}>{subtitle}</div>}
      {description && <p style={{ fontSize: '0.85rem', margin: '0.4rem 0 0 0', opacity: 0.8, lineHeight: 1.5, color: 'inherit' }}>{description}</p>}
    </div>
  );

  // ================= LAYOUT VARIATIONS =================

  // 1. DIAGONAL HERO (t01, t20)
  const renderDiagonalHero = () => {
    const headerContrast = getContrastText(finalPrimary);
    const bodyContrast = getContrastText(bg);
    
    return (
      <div style={{ width: '816px', minHeight: '1056px', background: bg, color: bodyContrast, fontFamily: fonts.body, position: 'relative', overflow: 'hidden' }}>
        <svg width="100%" height="240" viewBox="0 0 816 240" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
            <path d="M0 0 H816 V240 L0 168 Z" fill={finalPrimary} />
        </svg>
        <svg width="120" height="240" viewBox="0 0 120 240" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.9 }}>
            <path d="M0 0 H120 L0 168 Z" fill={finalAccent} />
        </svg>
        
        <div style={{ position: 'relative', padding: '2.5rem 3rem', color: headerContrast, display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {personalInfo.profilePhoto && (
              <div style={{ width: '120px', height: '120px', borderRadius: '24px', overflow: 'hidden', border: `4px solid ${headerContrast}33`, flexShrink: 0, background: '#fff' }}>
                  <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
          )}
          <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '3.2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em', color: headerContrast }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: finalAccent, marginTop: '0.2rem' }}>{personalInfo.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '1rem', fontSize: '0.8rem' }}>
                 {personalInfo.email && <span style={{ color: headerContrast, fontWeight: 700 }}> {personalInfo.email}</span>}
                 {personalInfo.phone && <span style={{ color: headerContrast, fontWeight: 700 }}> {personalInfo.phone}</span>}
                 {personalInfo.location && <span style={{ color: headerContrast, fontWeight: 700 }}> {personalInfo.location}</span>}
                 {personalInfo.website && <span style={{ color: headerContrast, fontWeight: 700 }}> {personalInfo.website}</span>}
              </div>
          </div>
        </div>

        <div style={{ padding: '3rem', marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
          <section>
            <SectionLabel title="Professional Summary" style={{ color: bodyContrast }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, opacity: 0.85 }}>{summary}</p>
          </section>
          <section>
            <SectionLabel title="Experience" style={{ color: bodyContrast }} />
            {experience.map((exp, idx) => (
              <Entry key={idx} title={exp.role} subtitle={exp.company} date={`${exp.startDate} - ${exp.endDate}`} style={{ color: bodyContrast }} />
            ))}
          </section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
            <section>
              <SectionLabel title="Education" style={{ color: bodyContrast }} />
              {education.map((edu, idx) => (
                <Entry key={idx} title={edu.degree} subtitle={edu.institution} date={edu.year} style={{ color: bodyContrast }} />
              ))}
            </section>
            <section>
              <SectionLabel title="Skills" style={{ color: bodyContrast }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {skills.map((s, idx) => (
                  <span key={idx} style={{ padding: '0.4rem 0.8rem', background: `${finalAccent}15`, color: bodyContrast === '#ffffff' ? '#fff' : finalPrimary, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {typeof s === 'string' ? s : s.name}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  // 2. SIDEBAR PANEL (t02, t05, t08, t14, t25, sidebar style)
  const renderSidebarPanel = (onRight = false) => {
    const sidebarContrast = getContrastText(finalPrimary);
    const bodyContrast = getContrastText(bg);
    
    return (
      <div style={{ 
          width: '816px', 
          minHeight: '1056px', 
          display: 'flex', 
          flexDirection: onRight ? 'row-reverse' : 'row', 
          background: bg, 
          color: bodyContrast, 
          fontFamily: fonts.body 
      }}>
        <div style={{ width: '30%', background: finalPrimary, color: sidebarContrast, padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `3px solid ${finalAccent}55` }}>
            {personalInfo.profilePhoto ? (
              <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={60} color={finalAccent} />
            )}
          </div>
          <section>
            <SectionLabel title="Contact" style={{ color: sidebarContrast, borderBottomColor: `${sidebarContrast}33` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem', opacity: 0.9, color: sidebarContrast }}>
              {personalInfo.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: sidebarContrast }}><Mail size={14} /> {personalInfo.email}</div>}
              {personalInfo.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: sidebarContrast }}><Phone size={14} /> {personalInfo.phone}</div>}
              {personalInfo.location && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: sidebarContrast }}><MapPin size={14} /> {personalInfo.location}</div>}
              {personalInfo.website && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: sidebarContrast }}><Globe size={14} /> {personalInfo.website}</div>}
            </div>
          </section>
          <section>
            <SectionLabel title="Skills" style={{ color: sidebarContrast, borderBottomColor: `${sidebarContrast}33` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {skills.map((s, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: '0.75rem', marginBottom: '0.3rem', fontWeight: 600, color: sidebarContrast }}>{typeof s === 'string' ? s : s.name}</div>
                  <div style={{ width: '100%', height: '4px', background: `${sidebarContrast}33`, borderRadius: '2px' }}>
                    <div style={{ width: '85%', height: '100%', background: finalAccent, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div style={{ width: '70%', padding: '4rem 3rem', color: bodyContrast }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: finalPrimary, margin: 0 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: finalAccent, marginTop: '0.2rem' }}>{personalInfo.title}</h2>
          
          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', color: bodyContrast }}>
            <section>
              <SectionLabel title="Professional Summary" style={{ color: bodyContrast }} />
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.8, color: bodyContrast }}>{summary}</p>
            </section>
            <section>
              <SectionLabel title="Experience" icon={Briefcase} style={{ color: bodyContrast }} />
              {experience.map((exp, idx) => (
                <Entry key={idx} title={exp.role} subtitle={exp.company} date={`${exp.startDate} - ${exp.endDate}`} style={{ color: bodyContrast }} />
              ))}
            </section>
            <section>
              <SectionLabel title="Education" icon={GraduationCap} style={{ color: bodyContrast }} />
              {education.map((edu, idx) => (
                <Entry key={idx} title={edu.degree} subtitle={edu.institution} date={edu.year} style={{ color: bodyContrast }} />
              ))}
            </section>
          </div>
        </div>
      </div>
    );
  };

  // 3. TECH / NEON MODE (t06, t22, dev style)
  const renderTechMode = () => (
    <div style={{ width: '816px', minHeight: '1056px', background: bg, color: bg === '#0a0a0f' || bg === '#0a1628' ? '#e0e0e0' : finalPrimary, fontFamily: 'monospace', padding: '3rem' }}>
        <div style={{ borderTop: `4px solid ${finalAccent}`, paddingTop: '1.5rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <Terminal color={finalAccent} size={32} />
                <div style={{ flex: 1 }}>
                   <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>{personalInfo.firstName}_{personalInfo.lastName}</h1>
                   <div style={{ color: finalAccent, fontSize: '1.1rem', marginTop: '0.2rem' }}>&gt; {personalInfo.title}</div>
                   <div style={{ fontSize: '0.85rem', marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', opacity: 0.8 }}>
                       {personalInfo.email && <div>📧 {personalInfo.email}</div>}
                       {personalInfo.phone && <div>📱 {personalInfo.phone}</div>}
                       {personalInfo.location && <div>📍 {personalInfo.location}</div>}
                       {personalInfo.website && <div>🌐 {personalInfo.website}</div>}
                   </div>
                </div>
            </div>
            {personalInfo.profilePhoto && (
                <div style={{ width: '90px', height: '90px', border: `2px solid ${finalAccent}`, padding: '4px', flexShrink: 0, background: '#fff' }}>
                    <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
            <section style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '0.5rem' }}>// SUMMARY</div>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', lineHeight: 1.6, color: 'inherit' }}>{summary}</p>
            </section>

            <section>
                <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '1.5rem' }}>// EXPERIENCE</div>
                {experience.map((exp, idx) => (
                    <div key={idx} style={{ marginBottom: '2rem', paddingLeft: '1rem', borderLeft: `2px solid ${finalAccent}33`, color: 'inherit' }}>
                        <div style={{ fontWeight: 800, color: 'inherit' }}>{exp.role} @ {exp.company}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6, color: 'inherit' }}>[{exp.startDate} - {exp.endDate}]</div>
                    </div>
                ))}
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                <section>
                    <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '1.5rem' }}>// TECH_STACK</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {skills.map((s, idx) => (
                            <div key={idx} style={{ fontSize: '0.85rem', opacity: 0.8, color: 'inherit' }}>- {typeof s === 'string' ? s : s.name}</div>
                        ))}
                    </div>
                </section>
                <section>
                    <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '1.5rem' }}>// EDUCATION</div>
                    {education.map((edu, idx) => (
                        <div key={idx} style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'inherit' }}>
                            <div style={{ fontWeight: 800, color: 'inherit' }}>{edu.degree}</div>
                            <div style={{ opacity: 0.7, color: 'inherit' }}>{edu.institution}</div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    </div>
  );

  // 4. MAGAZINE / EDITORIAL (t07, t30, news style)
  const renderMagazineMode = () => {
    const contrast = getContrastText(bg);
    return (
      <div style={{ width: '816px', minHeight: '1056px', background: bg, color: contrast, fontFamily: fonts.heading, padding: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', borderBottom: `8px solid ${finalAccent}`, paddingBottom: '2rem' }}>
              <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '4.5rem', fontWeight: 950, lineHeight: 0.85, marginBottom: '1rem', letterSpacing: '-0.05em', color: contrast }}>{personalInfo.firstName}<br />{personalInfo.lastName}</h1>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: finalAccent, textTransform: 'uppercase', letterSpacing: '0.25em' }}>{personalInfo.title}</div>
              </div>
              {personalInfo.profilePhoto && (
                  <div style={{ width: '180px', height: '220px', overflow: 'hidden', border: `1px solid ${contrast}33`, padding: '10px', background: '#fff' }}>
                      <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
              )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                  <section>
                      <p style={{ fontSize: '1.1rem', fontStyle: 'italic', lineHeight: 1.8, opacity: 0.9 }}>"{summary}"</p>
                  </section>
                  <section>
                      <SectionLabel title="Career Path" style={{ borderBottomWidth: '3px', borderBottomColor: contrast, color: contrast }} />
                      {experience.map((exp, idx) => (
                          <Entry key={idx} title={exp.role} subtitle={exp.company} date={`${exp.startDate} - ${exp.endDate}`} style={{ color: contrast }} />
                      ))}
                  </section>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                  <section>
                      <SectionLabel title="Reach" style={{ borderBottomWidth: '3px', borderBottomColor: contrast, color: contrast }} />
                      <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.8 }}>
                          {personalInfo.email && <div>{personalInfo.email}</div>}
                          {personalInfo.phone && <div>{personalInfo.phone}</div>}
                          {personalInfo.location && <div>{personalInfo.location}</div>}
                          {personalInfo.website && <div>{personalInfo.website}</div>}
                      </div>
                  </section>
                  <section>
                      <SectionLabel title="Expertise" style={{ borderBottomWidth: '3px', borderBottomColor: contrast, color: contrast }} />
                      {skills.map((s, idx) => (
                          <div key={idx} style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>• {typeof s === 'string' ? s : s.name}</div>
                      ))}
                  </section>
              </div>
          </div>
      </div>
    );
  };

  // 5. CARD GRID (t19, studio style)
  const renderCardGrid = () => (
    <div style={{ width: '816px', minHeight: '1056px', background: bg, padding: '3rem', fontFamily: fonts.body }}>
        <div style={{ background: finalPrimary, color: '#fff', padding: '2.5rem', borderRadius: '24px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {personalInfo.profilePhoto && (
                <div style={{ width: '100px', height: '100px', borderRadius: '20px', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.2)', background: '#fff' }}>
                    <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
            <div>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, marginTop: '0.2rem', fontWeight: 600 }}>{personalInfo.title}</p>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', color: '#0a0a0a' }}>
                <SectionLabel title="Summary" />
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#0a0a0a' }}>{summary}</p>
            </div>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', color: '#0a0a0a' }}>
                <SectionLabel title="Contact" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {personalInfo.email && <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: '#0a0a0a' }}>{personalInfo.email}</div>}
                    {personalInfo.phone && <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: '#0a0a0a' }}>{personalInfo.phone}</div>}
                    {personalInfo.location && <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: '#0a0a0a' }}>{personalInfo.location}</div>}
                    {personalInfo.website && <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: '#0a0a0a' }}>{personalInfo.website}</div>}
                </div>
            </div>
            <div style={{ gridColumn: 'span 2', background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', color: '#0a0a0a' }}>
                <SectionLabel title="Experience" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {experience.slice(0, 4).map((exp, idx) => (
                        <Entry key={idx} title={exp.role} subtitle={exp.company} date={`${exp.startDate} - ${exp.endDate}`} />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  // 6. EXECUTIVE / FORMAL (t11, t13, t23, corp, ib, legal, prof)
  const renderExecutiveMode = () => (
    <div style={{ width: '816px', minHeight: '1056px', background: bg, color: (template.id || '').includes('dark') || bg === '#0d1b2a' || bg === '#111' ? '#fff' : '#111', padding: '96px', fontFamily: fonts.heading }}>
        <div style={{ textAlign: 'center', borderBottom: `2px solid ${finalAccent}`, paddingBottom: '2rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {personalInfo.profilePhoto && (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${finalAccent}`, background: '#fff' }}>
                    <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
            <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: (template.id || '').includes('dark') || bg === '#0d1b2a' || bg === '#111' ? '#fff' : '#111' }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: finalAccent, margin: '0.5rem 0' }}>{personalInfo.title}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.7, color: (template.id || '').includes('dark') || bg === '#0d1b2a' || bg === '#111' ? '#fff' : '#111' }}>
                    {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website].filter(Boolean).join('  |  ')}
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <section>
                <SectionLabel title="Executive Profile" style={{ borderBottomColor: '#111' }} />
                <p style={{ fontSize: '1rem', lineHeight: 1.6, color: (template.id || '').includes('dark') || bg === '#0d1b2a' || bg === '#111' ? '#fff' : '#111' }}>{summary}</p>
            </section>
            <section>
                <SectionLabel title="Experience" style={{ borderBottomColor: '#111' }} />
                {experience.map((exp, idx) => (
                    <Entry key={idx} title={exp.role} subtitle={exp.company} date={`${exp.startDate} - ${exp.endDate}`} />
                ))}
            </section>
            <section>
                <SectionLabel title="Education" style={{ borderBottomColor: '#111' }} />
                {education.map((edu, idx) => (
                    <Entry key={idx} title={edu.degree} subtitle={edu.institution} date={edu.year} />
                ))}
            </section>
        </div>
    </div>
  );

  // 7. SWISS GRID (b13)
  const renderSwissGrid = () => {
    const contrast = getContrastText(bg);
    const borderColor = contrast === '#ffffff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.8)';
    
    return (
      <div style={{ width: '816px', minHeight: '1056px', background: bg, color: contrast, fontFamily: fonts.heading, padding: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
              <div>
                  <h1 style={{ fontSize: '3.5rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', lineHeight: 0.9, color: contrast }}>{personalInfo.firstName}<br />{personalInfo.lastName}</h1>
                  <div style={{ fontSize: '0.9rem', color: finalAccent, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '10px' }}>{personalInfo.title}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', opacity: 0.7, lineHeight: 1.8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                  {personalInfo.profilePhoto && (
                      <div style={{ width: '80px', height: '80px', border: `2px solid ${borderColor}`, background: '#fff', overflow: 'hidden' }}>
                          <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                  )}
                  <div>
                    {personalInfo.email && <>{personalInfo.email}<br /></>}
                    {personalInfo.phone && <>{personalInfo.phone}<br /></>}
                    {personalInfo.location && <>{personalInfo.location}<br /></>}
                    {personalInfo.website && <>{personalInfo.website}</> }
                  </div>
              </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '40px', borderTop: `2px solid ${borderColor}`, borderLeft: `2px solid ${borderColor}` }}>
              <div style={{ gridColumn: 'span 4', padding: '1.5rem', borderRight: `2px solid ${borderColor}`, borderBottom: `2px solid ${borderColor}` }}>
                   <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.5, fontWeight: 600, marginBottom: '0.5rem' }}>Professional Summary</div>
                   <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{summary}</p>
              </div>
              {experience.map((exp, idx) => (
                   <div key={idx} style={{ gridColumn: 'span 2', padding: '1.5rem', borderRight: `2px solid ${borderColor}`, borderBottom: `2px solid ${borderColor}` }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.5, fontWeight: 600, marginBottom: '0.5rem' }}>Experience</div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{exp.role}</h4>
                        <div style={{ fontSize: '0.8rem', color: finalAccent, fontWeight: 700 }}>{exp.company}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem' }}>{exp.startDate} - {exp.endDate}</div>
                   </div>
              ))}
              <div style={{ gridColumn: 'span 4', padding: '1.5rem', borderRight: `2px solid ${borderColor}`, borderBottom: `2px solid ${borderColor}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {skills.slice(0, 8).map((s, idx) => (
                      <div key={idx}>
                           <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.5, fontWeight: 600, marginBottom: '0.2rem' }}>Skill</div>
                           <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{typeof s === 'string' ? s : s.name}</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    );
  };

  // 8. TIMELINE LAYOUT (b29, t15)
  const renderTimelineLayout = () => {
    const contrast = getContrastText(bg);
    return (
      <div style={{ width: '816px', minHeight: '1056px', background: bg, color: contrast, fontFamily: fonts.body, padding: '4rem' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
              <div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 950, margin: 0, color: finalPrimary }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: finalAccent, marginTop: '0.3rem' }}>{personalInfo.title}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  {personalInfo.profilePhoto && (
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${finalAccent}`, background: '#fff', flexShrink: 0 }}>
                          <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                  )}
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', opacity: 0.7 }}>
                      {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website].filter(Boolean).join(' · ')}
                  </div>
              </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '3rem' }}>
              <aside>
                  <section style={{ marginBottom: '3rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', borderBottom: `2px solid ${finalAccent}`, paddingBottom: '0.5rem', color: contrast }}>Key Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {skills.map((s, idx) => (
                              <span key={idx} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 0.8rem', background: contrast === '#ffffff' ? 'rgba(255,255,255,0.1)' : '#f1f5f9', borderRadius: '4px', color: contrast }}>{typeof s === 'string' ? s : s.name}</span>
                          ))}
                      </div>
                  </section>
                  <section>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', borderBottom: `2px solid ${finalAccent}`, paddingBottom: '0.5rem', color: contrast }}>Connect</div>
                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: contrast }}>
                          {personalInfo.email && <div>{personalInfo.email}</div>}
                          {personalInfo.phone && <div>{personalInfo.phone}</div>}
                          {personalInfo.location && <div>{personalInfo.location}</div>}
                          {personalInfo.website && <div>{personalInfo.website}</div>}
                      </div>
                  </section>
              </aside>
              <main>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem', borderBottom: `2px solid ${finalAccent}`, paddingBottom: '0.5rem', color: contrast }}>Professional Path</div>
                  <div style={{ borderLeft: `2px solid ${contrast === '#ffffff' ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}`, paddingLeft: '2rem', marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                      {experience.map((exp, idx) => (
                          <div key={idx} style={{ position: 'relative', color: contrast }}>
                              <div style={{ position: 'absolute', left: '-2.45rem', top: '0.4rem', width: '12px', height: '12px', background: finalAccent, borderRadius: '50%' }} />
                              <div style={{ fontSize: '0.8rem', fontWeight: 750, color: finalAccent }}>{exp.startDate} - {exp.endDate}</div>
                              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.3rem 0', color: contrast === '#ffffff' ? '#fff' : finalPrimary }}>{exp.role}</h4>
                              <div style={{ fontWeight: 600, opacity: 0.8 }}>{exp.company}</div>
                              <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.8rem', lineHeight: 1.6 }}>{exp.desc || summary.slice(0, 150) + "..."}</p>
                          </div>
                      ))}
                  </div>
              </main>
          </div>
      </div>
    );
  };

  // 9. MOSAIC / TILE LAYOUT (b20, b26)
  const renderMosaicLayout = () => {
    const headerTitleColor = getContrastText(finalPrimary);
    const skillsContrast = getContrastText(finalAccent);
    const contrast = getContrastText(bg);

    return (
      <div style={{ width: '816px', minHeight: '1056px', background: bg, padding: '40px', fontFamily: fonts.heading, color: contrast }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'auto 1fr auto', gap: '15px', height: '976px' }}>
              <div style={{ background: finalPrimary, color: headerTitleColor, padding: '3rem', borderRadius: '16px', display: 'flex', itemsCenter: 'center', gap: '2rem' }}>
                  {personalInfo.profilePhoto && (
                      <div style={{ width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', border: `3px solid ${finalAccent}66`, background: '#fff', flexShrink: 0 }}>
                          <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                  )}
                  <div style={{ flex: 1 }}>
                      <h1 style={{ fontSize: '3.5rem', fontWeight: 950, margin: 0, color: headerTitleColor }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
                      <p style={{ fontSize: '1.2rem', fontWeight: 600, color: finalAccent, marginTop: '0.5rem' }}>{personalInfo.title}</p>
                  </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#0a0a0a' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: finalAccent, marginBottom: '1rem' }}>Reach out</div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#0a0a0a' }}>
                      {personalInfo.email && <div>{personalInfo.email}</div>}
                      {personalInfo.phone && <div>{personalInfo.phone}</div>}
                      {personalInfo.location && <div>{personalInfo.location}</div>}
                      {personalInfo.website && <div>{personalInfo.website}</div>}
                  </div>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div style={{ gridColumn: 'span 2', background: '#fff', padding: '2.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#0a0a0a' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: finalAccent, marginBottom: '1.5rem' }}>Experience</div>
                      {experience.slice(0, 2).map((exp, idx) => (
                          <div key={idx} style={{ marginBottom: '2rem', color: '#0a0a0a' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0a0a0a' }}>{exp.role}</div>
                              <div style={{ fontSize: '0.8rem', color: finalAccent, fontWeight: 700 }}>{exp.company}</div>
                              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem', color: '#0a0a0a' }}>{exp.desc || summary.slice(0, 100) + "..."}</p>
                          </div>
                      ))}
                  </div>
                  <div style={{ background: finalAccent, color: skillsContrast, padding: '2.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: skillsContrast, opacity: 0.95, marginBottom: '1.5rem' }}>Skills</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                           {skills.slice(0, 6).map((s, idx) => (
                               <div key={idx} style={{ fontSize: '0.9rem', fontWeight: 700, color: skillsContrast }}>{typeof s === 'string' ? s : s.name}</div>
                           ))}
                      </div>
                  </div>
              </div>
              <div style={{ gridColumn: 'span 2', background: '#f1f5f9', padding: '2rem', borderRadius: '16px', display: 'flex', gap: '3rem', alignItems: 'center', color: '#0a0a0a' }}>
                   <div style={{ flex: 1, color: '#0a0a0a' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: finalAccent, marginBottom: '0.5rem' }}>Education</div>
                        {education.map((edu, idx) => (
                            <div key={idx} style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0a0a0a' }}>{edu.degree} · <span style={{ fontWeight: 500, opacity: 0.7, color: '#0a0a0a' }}>{edu.institution}</span></div>
                        ))}
                   </div>
                   <div style={{ flex: 1, fontSize: '0.85rem', borderLeft: '1px solid #cbd5e1', paddingLeft: '3rem', color: '#0a0a0a' }}>
                        <span style={{ fontWeight: 800, color: finalAccent }}>Summary:</span> <span style={{ color: '#0a0a0a' }}>{summary.slice(0, 200)}...</span>
                   </div>
              </div>
          </div>
      </div>
    );
  };

  // ============= DISPATCHER =============
  const layoutStyle = template.style || 'default';
  const tid = template.id || '';

  // 1. Primary Styles from b01-b50
  if (layoutStyle === 'diagonal') return renderDiagonalHero();
  if (layoutStyle === 'sidebar') return renderSidebarPanel();
  if (layoutStyle === 'tech') return renderTechMode();
  if (layoutStyle === 'magazine') return renderMagazineMode();
  if (layoutStyle === 'b13') return renderSwissGrid();
  if (layoutStyle === 'timeline') return renderTimelineLayout();
  if (layoutStyle === 'mosaic') return renderMosaicLayout();
  if (layoutStyle === 'executive') return renderExecutiveMode();

  // 2. Legacy Fallbacks for t-series
  if (['t01', 't03', 't10', 't16', 't20', 't21', 't24'].includes(tid)) return renderDiagonalHero();
  if (['t02', 't05', 't08', 't12', 't14', 't25'].includes(tid)) return renderSidebarPanel();
  if (['t06', 't17', 't22'].includes(tid)) return renderTechMode();
  if (['t07', 't30', 'news'].includes(tid)) return renderMagazineMode();
  if (['t09', 't19', 'studio'].includes(tid)) return renderCardGrid();
  if (['t11', 't13', 't23'].includes(tid)) return renderExecutiveMode();

  // DEFAULT
  return renderExecutiveMode();
}
