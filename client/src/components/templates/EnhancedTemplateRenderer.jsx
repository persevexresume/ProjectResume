import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase, GraduationCap, Award, User, Terminal, Code, Hexagon } from 'lucide-react';

export default function EnhancedTemplateRenderer({ template, resumeData, themeColor }) {
  if (!template || !resumeData) return null;

  const {
    personalInfo = {},
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = []
  } = resumeData;

  const { bg, primary: primaryCol, accent: accentCol } = template.colors || { bg: '#fff', primary: '#1a1a2e', accent: '#3b82f6' };
  const fonts = template.fonts || { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' };
  
  const isDark = (color) => {
    if (!color || color === 'transparent') return false;
    const hex = color.replace('#', '').replace(/^#/, '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const finalAccent = themeColor || accentCol;
  const isDarkBg = isDark(bg);
  const finalPrimary = (isDarkBg && (primaryCol === bg || isDark(primaryCol) === isDarkBg)) ? '#fff' : primaryCol;
  const baseTextColor = isDarkBg ? 'rgba(255,255,255,0.85)' : '#333';
  // Helper: given any background color, return white or dark text for maximum contrast
  const contrastText = (bgColor) => isDark(bgColor) ? '#fff' : '#111';
  const contrastTextSoft = (bgColor) => isDark(bgColor) ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)';
  const resolvedSummary = summary || personalInfo?.summary || '';

  const getSkillName = (skill) => (typeof skill === 'string' ? skill : (skill?.name || ''));
  const getEducationSchool = (edu) => edu?.institution || edu?.school || edu?.college || '';
  const getEducationYear = (edu) => edu?.year || edu?.endDate || edu?.graduationDate || '';
  const getExperienceCompany = (exp) => exp?.company || exp?.organization || '';
  const getExperienceDate = (exp) => {
    if (exp?.date) return exp.date;
    const start = exp?.startDate || '';
    const end = exp?.endDate || '';
    return [start, end].filter(Boolean).join(' - ');
  };

  // Helper: Section Label Component
  const SectionLabel = ({ title, icon: Icon, style = {} }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: `1px solid ${finalAccent}33`, paddingBottom: '0.4rem', ...style }}>
      {Icon && <Icon size={16} color={finalAccent} />}
      <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: finalAccent, margin: 0 }}>
        {title}
      </h3>
    </div>
  );

  // Helper: Entry Component
  const Entry = ({ title, subtitle, date, description, style = {} }) => (
    <div style={{ marginBottom: '1.2rem', ...style, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 750, color: finalPrimary, margin: 0, flex: '1 1 300px' }}>{title}</h4>
        {date && <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, flexShrink: 0 }}>{date}</span>}
      </div>
      {subtitle && <div style={{ fontSize: '0.85rem', fontWeight: 600, color: finalAccent, marginTop: '0.1rem' }}>{subtitle}</div>}
      {description && <p style={{ fontSize: '0.85rem', margin: '0.4rem 0 0 0', opacity: 0.8, lineHeight: 1.5 }}>{description}</p>}
    </div>
  );

  // ================= LAYOUT VARIATIONS =================

  // 1. DIAGONAL HERO (t01, t20)
  const renderDiagonalHero = () => (
    <div style={{ width: '794px', minHeight: '1123px', background: bg, color: baseTextColor, fontFamily: fonts.body, position: 'relative', overflow: 'visible' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '220px', background: finalPrimary, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '220px', background: finalAccent, clipPath: 'polygon(0 0, 100% 0, 0 70%)', opacity: 0.9 }} />
      
      <div style={{ position: 'relative', padding: '2.5rem 3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.2)', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.1)' }}>
          {personalInfo.profilePhoto ? (
            <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={60} color={finalAccent} />
            </div>
          )}
        </div>
        <div>
          <h1 style={{ fontSize: '3.2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em', overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: 1 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: finalAccent, marginTop: '0.2rem' }}>{personalInfo.title}</div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>
             {personalInfo.email && <span>{personalInfo.email}</span>}
             {personalInfo.phone && <span>{personalInfo.phone}</span>}
          </div>
        </div>
      </div>

      <div style={{ padding: '3rem', marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
        {resolvedSummary && (
          <section>
            <SectionLabel title="Professional Summary" />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, opacity: 0.85 }}>{resolvedSummary}</p>
          </section>
        )}
        {experience.length > 0 && (
          <section>
            <SectionLabel title="Experience" />
            {experience.map((exp, idx) => (
              <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
            ))}
          </section>
        )}
        {education.length > 0 && (
          <section>
            <SectionLabel title="Education" />
            {education.map((edu, idx) => (
              <Entry key={idx} title={edu.degree} subtitle={getEducationSchool(edu)} date={getEducationYear(edu)} description={edu.description} />
            ))}
          </section>
        )}
        {projects && projects.length > 0 && (
          <section>
            <SectionLabel title="Projects" />
            {projects.map((proj, idx) => (
              <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
            ))}
          </section>
        )}
        {certifications && certifications.length > 0 && (
          <section>
            <SectionLabel title="Certifications" />
            {certifications.map((cert, idx) => (
              <Entry key={idx} title={cert.name} subtitle={cert.issuer} date={cert.issueDate} description={cert.credentialId} />
            ))}
          </section>
        )}
        {skills.length > 0 && (
          <section>
            <SectionLabel title="Skills" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {skills.map((s, idx) => (
                <span key={idx} style={{ padding: '0.4rem 0.8rem', background: `${finalAccent}15`, color: finalPrimary, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {getSkillName(s)}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  // 2. SIDEBAR PANEL (t02, t05, t08, t14, t25, sidebar style)
  const renderSidebarPanel = (onRight = false) => (
    <div style={{ 
        width: '794px', 
        minHeight: '1123px',
        display: 'flex', 
        flexDirection: onRight ? 'row-reverse' : 'row', 
        background: bg, 
        color: baseTextColor, 
        fontFamily: fonts.body 
    }}>
      <div style={{ width: '30%', background: finalPrimary, color: '#fff', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `${finalAccent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {personalInfo.profilePhoto ? (
            <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={50} color={finalAccent} />
          )}
        </div>
        {(personalInfo.email || personalInfo.phone || personalInfo.location) && (
          <section>
            <SectionLabel title="Contact" style={{ color: '#fff', borderBottomColor: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem', opacity: 0.9 }}>
              {personalInfo.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {personalInfo.email}</div>}
              {personalInfo.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {personalInfo.phone}</div>}
              {personalInfo.location && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> {personalInfo.location}</div>}
            </div>
          </section>
        )}
        {skills.length > 0 && (
          <section>
            <SectionLabel title="Skills" style={{ color: '#fff', borderBottomColor: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {skills.map((s, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: '0.75rem', marginBottom: '0.3rem', fontWeight: 600 }}>{getSkillName(s)}</div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ width: '85%', height: '100%', background: finalAccent, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <div style={{ width: '70%', padding: '4rem 3rem' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: finalPrimary, margin: 0, lineHeight: 1.12, letterSpacing: '-0.02em', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: finalAccent, margin: '0.45rem 0 0 0', lineHeight: 1.3, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{personalInfo.title}</h2>
        
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {resolvedSummary && (
            <section>
              <SectionLabel title="Professional Summary" />
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.8 }}>{resolvedSummary}</p>
            </section>
          )}
          {experience.length > 0 && (
            <section>
              <SectionLabel title="Experience" icon={Briefcase} />
              {experience.map((exp, idx) => (
                <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
              ))}
            </section>
          )}
          {education.length > 0 && (
            <section>
              <SectionLabel title="Education" icon={GraduationCap} />
              {education.map((edu, idx) => (
                <Entry key={idx} title={edu.degree} subtitle={getEducationSchool(edu)} date={getEducationYear(edu)} description={edu.description} />
              ))}
            </section>
          )}
          {projects && projects.length > 0 && (
            <section>
              <SectionLabel title="Projects" icon={Code} />
              {projects.map((proj, idx) => (
                <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
              ))}
            </section>
          )}
          {certifications && certifications.length > 0 && (
            <section>
              <SectionLabel title="Certifications" icon={Award} />
              {certifications.map((cert, idx) => (
                <Entry key={idx} title={cert.name} subtitle={cert.issuer} date={cert.issueDate} description={cert.credentialId} />
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );

  // 3. TECH / NEON MODE (t06, t22, dev style)
  const renderTechMode = () => (
    <div style={{ width: '794px', minHeight: '1123px', background: bg, color: baseTextColor, fontFamily: 'monospace', padding: '3rem' }}>
        <div style={{ borderTop: `4px solid ${finalAccent}`, paddingTop: '1.5rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '8px', border: `2px solid ${finalAccent}`, overflow: 'hidden', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                    {personalInfo.profilePhoto ? (
                        <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.5) contrast(1.2)' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Terminal size={50} color={finalAccent} />
                        </div>
                    )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Terminal color={finalAccent} size={28} style={{ flexShrink: 0 }} />
                      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{personalInfo.firstName}_{personalInfo.lastName}</h1>
                  </div>
                  <div style={{ color: finalAccent, fontSize: '1.1rem', marginTop: '0.5rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>&gt; {personalInfo.title}</div>
                </div>
            </div>
            {(personalInfo.email || personalInfo.phone) && (
              <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.6 }}>
                {personalInfo.email && <div>{personalInfo.email}</div>}
                {personalInfo.phone && <div>{personalInfo.phone}</div>}
              </div>
            )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
            <section style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '0.5rem' }}>// SUMMARY</div>
              <p style={{ opacity: 0.8, fontSize: '0.9rem', lineHeight: 1.6 }}>{resolvedSummary}</p>
            </section>

            <section>
                <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '1.5rem' }}>// EXPERIENCE</div>
                {experience.map((exp, idx) => (
                    <div key={idx} style={{ marginBottom: '2rem', paddingLeft: '1rem', borderLeft: `2px solid ${finalAccent}33`, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    <div style={{ fontWeight: 800, color: isDarkBg ? '#fff' : finalPrimary }}>{exp.role} @ {getExperienceCompany(exp)}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>[{getExperienceDate(exp)}]</div>
                    {exp?.description && <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.45rem', lineHeight: 1.6 }}>{exp.description}</div>}
                    </div>
                ))}
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            {skills.length > 0 && (
                <section>
                    <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '1.5rem' }}>// TECH_STACK</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {skills.map((s, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', opacity: 0.8 }}>- {getSkillName(s)}</div>
                        ))}
                    </div>
                </section>
            )}
            {education.length > 0 && (
                <section>
                    <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '1.5rem' }}>// EDUCATION</div>
                    {education.map((edu, idx) => (
                        <div key={idx} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 800 }}>{edu.degree}</div>
                        <div style={{ opacity: 0.7 }}>{getEducationSchool(edu)}</div>
                        </div>
                    ))}
                </section>
            )}
            {certifications && certifications.length > 0 && (
                <section>
                    <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '1.5rem' }}>// CERTIFICATIONS</div>
                    {certifications.map((cert, idx) => (
                        <div key={idx} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 800 }}>{cert.name}</div>
                            <div style={{ opacity: 0.7 }}>{cert.issuer}</div>
                        </div>
                    ))}
                </section>
            )}
        </div>
        {projects && projects.length > 0 && (
            <section style={{ marginTop: '3rem' }}>
                <div style={{ color: finalAccent, fontWeight: 800, marginBottom: '1.5rem' }}>// PROJECTS</div>
                {projects.map((proj, idx) => (
                    <div key={idx} style={{ marginBottom: '2rem', paddingLeft: '1rem', borderLeft: `2px solid ${finalAccent}33` }}>
                        <div style={{ fontWeight: 800, color: isDarkBg ? '#fff' : finalPrimary }}>{proj.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>[{getExperienceDate(proj)}]</div>
                        {proj.description && <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.45rem', lineHeight: 1.6 }}>{proj.description}</div>}
                    </div>
                ))}
            </section>
        )}
        </div>
    </div>
  );

  // 4. MAGAZINE / EDITORIAL (t07, t30, news style)
  const renderMagazineMode = () => {
    const magText = contrastText(bg);
    const magBorderColor = isDarkBg ? 'rgba(255,255,255,0.3)' : '#111';
    return (
    <div style={{ width: '794px', minHeight: '1123px', background: bg, color: magText, fontFamily: fonts.heading, padding: '4rem' }}>
        <div style={{ borderLeft: `8px solid ${finalAccent}`, paddingLeft: '2rem', marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '4.5rem', fontWeight: 950, lineHeight: 0.85, marginBottom: '0.5rem', letterSpacing: '-0.05em' }}>{personalInfo.firstName}<br />{personalInfo.lastName}</h1>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: finalAccent, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{personalInfo.title}</div>
            </div>
            <div style={{ width: '180px', height: '180px', borderRadius: '12px', overflow: 'hidden', boxShadow: '20px 20px 0px ' + finalAccent + '22' }}>
               {personalInfo.profilePhoto ? (
                 <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={80} color={finalAccent} /></div>
               )}
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <section>
                <p style={{ fontSize: '1.1rem', fontStyle: 'italic', lineHeight: 1.8, opacity: 0.9 }}>"{resolvedSummary}"</p>
                </section>
                <section>
                    <SectionLabel title="Career Path" style={{ borderBottomWidth: '3px', borderBottomColor: magBorderColor }} />
                    {experience.map((exp, idx) => (
                  <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
                    ))}
                </section>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {(personalInfo.email || personalInfo.phone || personalInfo.location) && (
                <section>
                    <SectionLabel title="Reach" style={{ borderBottomWidth: '3px', borderBottomColor: magBorderColor }} />
                    <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.8 }}>
                        {personalInfo.email && <div>{personalInfo.email}</div>}
                        {personalInfo.phone && <div>{personalInfo.phone}</div>}
                        {personalInfo.location && <div>{personalInfo.location}</div>}
                    </div>
                </section>
            )}
            {skills.length > 0 && (
                <section>
                    <SectionLabel title="Expertise" style={{ borderBottomWidth: '3px', borderBottomColor: magBorderColor }} />
                    {skills.map((s, idx) => (
                    <div key={idx} style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>• {getSkillName(s)}</div>
                    ))}
                </section>
            )}
            {projects && projects.length > 0 && (
                <section>
                    <SectionLabel title="Showcase" style={{ borderBottomWidth: '3px', borderBottomColor: magBorderColor }} />
                    {projects.map((proj, idx) => (
                        <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
                    ))}
                </section>
            )}
            </div>
        </div>
    </div>
  );};

  // 5. CARD GRID (t19, studio style)
  const renderCardGrid = () => (
    <div style={{ width: '794px', minHeight: '1123px', background: bg, padding: '3rem', fontFamily: fonts.body }}>
        <div style={{ background: finalPrimary, color: '#fff', padding: '3rem', borderRadius: '24px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.8, marginTop: '0.5rem' }}>{personalInfo.title}</p>
            </div>
            <div style={{ width: '120px', height: '120px', borderRadius: '20px', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.1)' }}>
               {personalInfo.profilePhoto ? <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={60} color={finalAccent} />}
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                <SectionLabel title="Summary" />
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{resolvedSummary}</p>
            </div>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                <SectionLabel title="Contact" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>{personalInfo.email}</div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>{personalInfo.phone}</div>
                </div>
            </div>
            {experience.length > 0 && (
                <div style={{ gridColumn: 'span 2', background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                    <SectionLabel title="Experience" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {experience.map((exp, idx) => (
                      <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
                        ))}
                    </div>
                </div>
            )}
            {projects && projects.length > 0 && (
                <div style={{ gridColumn: 'span 2', background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                    <SectionLabel title="Projects" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {projects.map((proj, idx) => (
                            <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  // 6. EXECUTIVE / FORMAL (t11, t13, t23, corp, ib, legal, prof)
  const renderExecutiveMode = () => (
    <div style={{ width: '794px', minHeight: '1123px', background: bg, color: baseTextColor, padding: '96px', fontFamily: fonts.heading }}>
        <div style={{ textAlign: 'center', borderBottom: `2px solid ${finalAccent}`, paddingBottom: '3rem', marginBottom: '3rem' }}>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', margin: '0 auto 1.5rem', border: `2px solid ${finalAccent}`, padding: '4px' }}>
               <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                  {personalInfo.profilePhoto ? <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={50} color={finalAccent} /></div>}
               </div>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: finalAccent, margin: '0.5rem 0' }}>{personalInfo.title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join('  |  ')}
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <section>
                <SectionLabel title="Executive Profile" style={{ borderBottomColor: baseTextColor }} />
            <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{resolvedSummary}</p>
            </section>
            {experience.length > 0 && (
                <section>
                    <SectionLabel title="Experience" style={{ borderBottomColor: baseTextColor }} />
                    {experience.map((exp, idx) => (
                  <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
                    ))}
                </section>
            )}
            {education.length > 0 && (
                <section>
                    <SectionLabel title="Education" style={{ borderBottomColor: baseTextColor }} />
                    {education.map((edu, idx) => (
                  <Entry key={idx} title={edu.degree} subtitle={getEducationSchool(edu)} date={getEducationYear(edu)} description={edu.description} />
                    ))}
                </section>
            )}
            {projects && projects.length > 0 && (
                <section>
                    <SectionLabel title="Projects" style={{ borderBottomColor: baseTextColor }} />
                    {projects.map((proj, idx) => (
                        <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
                    ))}
                </section>
            )}
            {certifications && certifications.length > 0 && (
                <section>
                    <SectionLabel title="Certifications" style={{ borderBottomColor: baseTextColor }} />
                    {certifications.map((cert, idx) => (
                        <Entry key={idx} title={cert.name} subtitle={cert.issuer} date={cert.issueDate} description={cert.credentialId} />
                    ))}
                </section>
            )}
        </div>
    </div>
  );

  // 7. MODERN SPLIT (nt01, nt03, nt05, nt10, nt12, nt18)
  const renderModernSplit = () => {
    const isRightSidebar = ['nt03', 'nt18'].includes(tid);
    return (
      <div style={{ width: '794px', minHeight: '1123px', background: bg, color: baseTextColor, display: 'flex', flexDirection: isRightSidebar ? 'row-reverse' : 'row', fontFamily: fonts.body }}>
        <div style={{ width: '30%', background: `${finalAccent}08`, borderRight: isRightSidebar ? 'none' : `1px solid ${finalAccent}15`, borderLeft: isRightSidebar ? `1px solid ${finalAccent}15` : 'none', padding: '3rem 2rem' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: finalAccent, marginBottom: '2.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {personalInfo.profilePhoto ? <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={60} color="#fff" />}
          </div>
          <SectionLabel title="Contact" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
            {personalInfo.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} color={finalAccent} /> {personalInfo.email}</div>}
            {personalInfo.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} color={finalAccent} /> {personalInfo.phone}</div>}
            {personalInfo.location && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} color={finalAccent} /> {personalInfo.location}</div>}
          </div>
          <div style={{ marginTop: '3rem' }}>
            <SectionLabel title="Expertise" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {skills.map((s, idx) => (
                <div key={idx} style={{ fontSize: '0.8rem', fontWeight: 700, color: finalPrimary }}>• {getSkillName(s)}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ width: '70%', padding: '4rem 3.5rem' }}>
          <div style={{ borderBottom: `4px solid ${finalAccent}`, paddingBottom: '1.5rem', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 950, color: finalPrimary, margin: 0, lineHeight: 1 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: finalAccent, marginTop: '0.5rem' }}>{personalInfo.title}</div>
          </div>
          {resolvedSummary && (
            <section style={{ marginBottom: '3rem' }}>
              <p style={{ fontSize: '1rem', lineHeight: 1.7, opacity: 0.8, fontWeight: 500 }}>{resolvedSummary}</p>
            </section>
          )}
          {experience.length > 0 && (
            <section style={{ marginBottom: '3rem' }}>
              <SectionLabel title="Work Experience" />
              {experience.map((exp, idx) => (
                <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
              ))}
            </section>
          )}
          {education.length > 0 && (
            <section>
              <SectionLabel title="Education" />
              {education.map((edu, idx) => (
                <Entry key={idx} title={edu.degree} subtitle={getEducationSchool(edu)} date={getEducationYear(edu)} description={edu.description} />
              ))}
            </section>
          )}
          {projects && projects.length > 0 && (
            <section style={{ marginTop: '2rem' }}>
              <SectionLabel title="Projects" />
              {projects.map((proj, idx) => (
                <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
              ))}
            </section>
          )}
          {certifications && certifications.length > 0 && (
            <section style={{ marginTop: '2rem' }}>
              <SectionLabel title="Certifications" />
              {certifications.map((cert, idx) => (
                <Entry key={idx} title={cert.name} subtitle={cert.issuer} date={cert.issueDate} description={cert.credentialId} />
              ))}
            </section>
          )}
        </div>
        {tid === 'nt01' && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '12px', background: finalAccent }} />}
      </div>
    );
  };

  // 8. TOP ACCENT (nt02, nt12, nt19)
  const renderTopAccent = () => {
    const headerBg = finalPrimary;
    const headerText = contrastText(headerBg);
    const headerAccent = isDark(headerBg) ? (finalAccent === headerBg || isDark(finalAccent) ? 'rgba(255,255,255,0.8)' : finalAccent) : (finalAccent === headerBg ? 'rgba(0,0,0,0.6)' : finalAccent);
    return (
    <div style={{ width: '794px', minHeight: '1123px', background: bg, color: baseTextColor, fontFamily: fonts.body }}>
      <div style={{ height: '180px', background: headerBg, display: 'flex', alignItems: 'center', padding: '0 4rem', gap: '3rem', position: 'relative' }}>
         <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: `6px solid ${isDark(headerBg) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}`, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
           {personalInfo.profilePhoto ? <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: finalAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={70} color={contrastText(finalAccent)} /></div>}
         </div>
         <div style={{ color: headerText }}>
           <h1 style={{ fontSize: '2.8rem', fontWeight: 950, margin: 0, color: headerText }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
           <div style={{ fontSize: '1.2rem', fontWeight: 600, color: headerAccent, marginTop: '0.2rem' }}>{personalInfo.title}</div>
         </div>
         <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '8px', background: finalAccent }} />
      </div>
      <div style={{ padding: '4rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {resolvedSummary && (
            <section>
              <SectionLabel title="About Me" />
              <p style={{ fontSize: '1rem', lineHeight: 1.7, opacity: 0.8 }}>{resolvedSummary}</p>
            </section>
          )}
          {experience.length > 0 && (
            <section>
              <SectionLabel title="Work Journey" />
              {experience.map((exp, idx) => (
                <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
              ))}
            </section>
          )}
          {projects && projects.length > 0 && (
            <section>
              <SectionLabel title="Projects" />
              {projects.map((proj, idx) => (
                <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
              ))}
            </section>
          )}
          {certifications && certifications.length > 0 && (
            <section>
              <SectionLabel title="Certifications" />
              {certifications.map((cert, idx) => (
                <Entry key={idx} title={cert.name} subtitle={cert.issuer} date={cert.issueDate} description={cert.credentialId} />
              ))}
            </section>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
           <section>
             <SectionLabel title="Contact Info" />
             <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {personalInfo.email && <div style={{ fontWeight: 700 }}><div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase' }}>Email</div>{personalInfo.email}</div>}
               {personalInfo.phone && <div style={{ fontWeight: 700 }}><div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase' }}>Phone</div>{personalInfo.phone}</div>}
             </div>
           </section>
           {skills.length > 0 && (
             <section>
               <SectionLabel title="Core Skills" />
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                 {skills.map((s, idx) => (
                   <span key={idx} style={{ padding: '0.4rem 0.8rem', background: finalPrimary, color: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{getSkillName(s)}</span>
                 ))}
               </div>
             </section>
           )}
           {education.length > 0 && (
            <section>
              <SectionLabel title="Education" />
              {education.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{edu.degree}</div>
                  <div style={{ fontSize: '0.8rem', color: finalAccent, fontWeight: 600 }}>{getEducationSchool(edu)}</div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );}

  // 9. ELEGANT (nt04, nt14, nt16)
  const renderElegant = () => (
    <div style={{ width: '794px', minHeight: '1123px', background: bg, color: baseTextColor, fontFamily: fonts.heading, padding: '5rem' }}>
       <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
         <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: `1px solid ${finalAccent}`, padding: '8px', margin: '0 auto 2rem' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', filter: 'grayscale(0.1)' }}>
               {personalInfo.profilePhoto ? <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={70} color={finalAccent} strokeWidth={1} />}
            </div>
         </div>
         <h1 style={{ fontSize: '3.5rem', fontWeight: 300, fontStyle: 'italic', margin: 0 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
         <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.4em', textTransform: 'uppercase', color: finalAccent, marginTop: '1rem' }}>{personalInfo.title}</div>
         <div style={{ width: '60px', height: '2px', background: finalAccent, margin: '2rem auto' }} />
         <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>{[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' • ')}</div>
       </div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
         {resolvedSummary && <p style={{ fontSize: '1.1rem', textAlign: 'center', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto', fontStyle: 'italic' }}>{resolvedSummary}</p>}
         <section>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <SectionLabel title="Experience" style={{ justifyContent: 'center', borderBottom: 'none' }} />
            </div>
            {experience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: finalPrimary }}>{exp.role}</div>
                <div style={{ fontSize: '0.9rem', color: finalAccent, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{getExperienceCompany(exp)}  |  {getExperienceDate(exp)}</div>
                <p style={{ fontSize: '0.95rem', opacity: 0.7, maxWidth: '600px', margin: '0.5rem auto 0' }}>{exp.description}</p>
              </div>
            ))}
         </section>
         {projects && projects.length > 0 && (
           <section>
             <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
               <SectionLabel title="Projects" style={{ justifyContent: 'center', borderBottom: 'none' }} />
             </div>
             {projects.map((proj, idx) => (
               <div key={idx} style={{ marginBottom: '1.8rem', textAlign: 'center' }}>
                 <div style={{ fontWeight: 800, fontSize: '1.05rem', color: finalPrimary }}>{proj.name}</div>
                 {proj.description && <p style={{ fontSize: '0.92rem', opacity: 0.72, maxWidth: '620px', margin: '0.5rem auto 0' }}>{proj.description}</p>}
               </div>
             ))}
           </section>
         )}
         {certifications && certifications.length > 0 && (
           <section>
             <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
               <SectionLabel title="Certifications" style={{ justifyContent: 'center', borderBottom: 'none' }} />
             </div>
             {certifications.map((cert, idx) => (
               <div key={idx} style={{ marginBottom: '1.2rem', textAlign: 'center' }}>
                 <div style={{ fontWeight: 800, fontSize: '1rem', color: finalPrimary }}>{cert.name}</div>
                 <div style={{ fontSize: '0.88rem', opacity: 0.72 }}>{[cert.issuer, cert.issueDate].filter(Boolean).join(' | ')}</div>
               </div>
             ))}
           </section>
         )}
       </div>
    </div>
  );

  // 10. GEOMETRIC (nt17, nt20, nt09)
  const renderGeometric = () => {
    const geomSidebarText = contrastText(finalPrimary);
    const geomSidebarSoft = contrastTextSoft(finalPrimary);
    return (
    <div style={{ width: '794px', minHeight: '1123px', background: bg, color: baseTextColor, display: 'flex', fontFamily: fonts.body }}>
       <div style={{ width: '35%', background: finalPrimary, color: geomSidebarText, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: finalAccent, opacity: 0.2 }} />
          <div style={{ position: 'absolute', bottom: '100px', right: '-30px', width: '100px', height: '300px', transform: 'rotate(45deg)', background: finalAccent, opacity: 0.1 }} />
          
          <div style={{ padding: '4rem 2.5rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '3rem' }}>
             <div style={{ width: '100%', aspectRatio: '1', borderRadius: '20px', background: `${bg}22`, overflow: 'hidden', border: `3px solid ${finalAccent}` }}>
                {personalInfo.profilePhoto ? <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={80} color={finalAccent} /></div>}
             </div>
             <section>
               <SectionLabel title="Contact" style={{ color: geomSidebarText, borderBottomColor: isDark(finalPrimary) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.85rem', color: geomSidebarText }}>
                 <div><div style={{ color: finalAccent, fontWeight: 900, fontSize: '0.7rem' }}>EMAIL</div>{personalInfo.email}</div>
                 <div><div style={{ color: finalAccent, fontWeight: 900, fontSize: '0.7rem' }}>PHONE</div>{personalInfo.phone}</div>
               </div>
             </section>
             <section>
               <SectionLabel title="Expertise" style={{ color: geomSidebarText, borderBottomColor: isDark(finalPrimary) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }} />
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                 {skills.map((s, idx) => (
                   <span key={idx} style={{ padding: '0.35rem 0.7rem', background: isDark(finalPrimary) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: geomSidebarText, borderRadius: '6px', fontSize: '0.75rem' }}>{getSkillName(s)}</span>
                 ))}
               </div>
             </section>
          </div>
       </div>
       <div style={{ width: '65%', padding: '4rem', display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 950, color: finalPrimary, margin: 0, lineHeight: 0.9 }}>{personalInfo.firstName}<br /><span style={{ color: finalAccent }}>{personalInfo.lastName}</span></h1>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1rem', letterSpacing: '0.1em' }}>{personalInfo.title}</div>
          </div>
          {resolvedSummary && <p style={{ fontSize: '1rem', lineHeight: 1.7, background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${finalAccent}` }}>{resolvedSummary}</p>}
          <section>
             <SectionLabel title="Professional Path" />
             {experience.map((exp, idx) => (
               <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
             ))}
          </section>
          {education.length > 0 && (
            <section>
              <SectionLabel title="Education" />
              {education.map((edu, idx) => (
                <Entry key={idx} title={edu.degree} subtitle={getEducationSchool(edu)} date={getEducationYear(edu)} description={edu.description} />
              ))}
            </section>
          )}
          {projects && projects.length > 0 && (
            <section>
              <SectionLabel title="Projects" />
              {projects.map((proj, idx) => (
                <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
              ))}
            </section>
          )}
          {certifications && certifications.length > 0 && (
            <section>
              <SectionLabel title="Certifications" />
              {certifications.map((cert, idx) => (
                <Entry key={idx} title={cert.name} subtitle={cert.issuer} date={cert.issueDate} description={cert.credentialId} />
              ))}
            </section>
          )}
       </div>
    </div>
  );}

  // ============= DISPATCHER =============
  const layoutStyle = template.style || 'default';
  const tid = template.id || '';

  // Specific layout exceptions or groups
  // DIAGONAL / HERO styles
  if (['t01', 't03', 't10', 't16', 't20', 't21', 't24', 'bso', 'rose', 'pastel', 'b01', 'b10', 'b17', 'b24', 'b25', 'b27', 'b29', 'b30', 'b33', 'b35', 'b38', 'b40', 'b43', 'b46', 'b49', 'b50'].includes(layoutStyle) || 
      ['t01', 't03', 't10', 't16', 't20', 't21', 't24', 't37', 't56', 't65', 't72', 't79', 't80', 't82', 't84', 't85', 't88', 't90', 't93', 't95', 't98', 't101', 't104', 't105', 'rt02', 'rt11'].includes(tid)) return renderDiagonalHero();

  // SIDEBAR / PANEL styles
  if (['t02', 't05', 't08', 't12', 't14', 't25', 'sidebar', 'split', 'sage', 'nordic', 'coastal', 'hr', 'bio', 'b02', 'b03', 'b05', 'b08', 'b16', 'b19', 'b22', 'b26', 'b34', 'b36', 'b41', 'b45', 'b48'].includes(layoutStyle) || 
      ['t02', 't05', 't08', 't12', 't14', 't25', 't31', 't39', 't46', 't50', 't52', 't53', 't57', 't58', 't60', 't63', 't71', 't74', 't77', 't81', 't89', 't91', 't96', 't100', 't103', 'rt01', 'rt03', 'rt07', 'rt12'].includes(tid)) return renderSidebarPanel();

  // TECH / DARK / MODERN styles
  if (['t06', 't17', 't22', 'dev', 'startup', 'indigo', 'arch', 'ats', 'b04', 'b07'].includes(layoutStyle) || 
      ['t06', 't17', 't22', 't29', 't33', 't41', 't42', 't40', 't15', 't59', 't62', 'rt05', 'rt08', 'rt14'].includes(tid)) return renderTechMode();

  // MAGAZINE / EDITORIAL styles
  if (['t07', 't30', 'news', 'warm', 'director', 'free', 'b14'].includes(layoutStyle) || 
      ['t07', 't30', 't26', 't44', 't45', 't69'].includes(tid)) return renderMagazineMode();

  // CARD / GRID styles
  if (['t09', 't19', 'studio', 'video', 'b06', 'b12', 'b15'].includes(layoutStyle) || 
      ['t19', 't51', 't48', 't09', 't61', 't67', 't70', 'rt10'].includes(tid)) return renderCardGrid();

  // EXECUTIVE / CLASSIC styles
  if (['t11', 't13', 't23', 'corp', 'ib', 'legal', 'prof', 'eu', 'academic', 'polar', 'mono', 'b09', 'b11', 'b13', 'b18', 'b20', 'b21', 'b23', 'b28', 'b31', 'b32', 'b37', 'b39', 'b42', 'b44', 'b47'].includes(layoutStyle) || 
      ['t11', 't13', 't23', 't38', 't47', 't32', 't49', 't55', 't43', 't36', 't27', 't35', 't64', 't66', 't68', 't73', 't75', 't76', 't78', 't83', 't86', 't87', 't92', 't94', 't97', 't99', 't102', 'rt04', 'rt06', 'rt09', 'rt13'].includes(tid)) return renderExecutiveMode();

  // MODERN SPLIT (nt01, nt03, nt05, nt10, nt12, nt18, nt13)
  if (['nt01', 'nt03', 'nt05', 'nt10', 'nt12', 'nt18', 'nt13', 'nt15'].includes(tid)) return renderModernSplit();

  // TOP ACCENT (nt02, nt11, nt19)
  if (['nt02', 'nt11', 'nt19', 'nt08', 'nt06'].includes(tid)) return renderTopAccent();

  // ELEGANT (nt04, nt14, nt16, nt08)
  if (['nt04', 'nt14', 'nt16'].includes(tid)) return renderElegant();

  // GEOMETRIC (nt17, nt20, nt09, nt07)
  if (['nt17', 'nt20', 'nt09', 'nt07'].includes(tid)) return renderGeometric();

  // DEFAULT FALLBACK (Minimalist/Standard)
  return (
    <div style={{ width: '794px', minHeight: '1123px', padding: '96px', background: bg, color: baseTextColor, fontFamily: fonts.body }}>
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', marginBottom: '2.5rem', borderBottom: `2px solid ${finalAccent}`, paddingBottom: '2.5rem' }}>
           <div style={{ width: '110px', height: '110px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd', flexShrink: 0, background: '#f8fafc' }}>
              {personalInfo.profilePhoto ? <img src={personalInfo.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={60} color="#cbd5e1" /></div>}
           </div>
           <div>
             <h1 style={{ fontSize: '2.8rem', fontWeight: 950, color: finalPrimary, margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: 1 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
             <div style={{ fontSize: '1.2rem', fontWeight: 600, color: finalAccent, marginTop: '0.5rem' }}>{personalInfo.title}</div>
             <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.8rem' }}>
                {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join('  |  ')}
             </div>
           </div>
        </div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <section>
           <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{resolvedSummary}</p>
          </section>
          {experience.length > 0 && (
              <section>
                 <SectionLabel title="Experience" />
                 {experience.map((exp, idx) => (
                 <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
                 ))}
              </section>
          )}
          {education.length > 0 && (
              <section>
                 <SectionLabel title="Education" />
                 {education.map((edu, idx) => (
                 <Entry key={idx} title={edu.degree} subtitle={getEducationSchool(edu)} date={getEducationYear(edu)} description={edu.description} />
                 ))}
              </section>
          )}
          {projects && projects.length > 0 && (
               <section>
                  <SectionLabel title="Projects" />
                  {projects.map((proj, idx) => (
                  <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
                  ))}
               </section>
           )}
           {certifications && certifications.length > 0 && (
               <section>
                  <SectionLabel title="Certifications" />
                  {certifications.map((cert, idx) => (
                  <Entry key={idx} title={cert.name} subtitle={cert.issuer} date={cert.issueDate} description={cert.credentialId} />
                  ))}
               </section>
           )}
       </div>
    </div>
  );
}
