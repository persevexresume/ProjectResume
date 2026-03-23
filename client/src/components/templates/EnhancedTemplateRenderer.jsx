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
  const finalAccent = themeColor || accentCol;
  const finalPrimary = primaryCol;
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
    <div style={{ width: '794px', background: bg, color: '#333', fontFamily: fonts.body, position: 'relative', overflow: 'visible' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '220px', background: finalPrimary, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '220px', background: finalAccent, clipPath: 'polygon(0 0, 100% 0, 0 70%)', opacity: 0.9 }} />
      
      <div style={{ position: 'relative', padding: '2.5rem 3rem', color: '#fff' }}>
        <h1 style={{ fontSize: '3.2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: finalAccent, marginTop: '0.2rem' }}>{personalInfo.title}</div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>
           {personalInfo.email && <span>{personalInfo.email}</span>}
           {personalInfo.phone && <span>{personalInfo.phone}</span>}
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
        display: 'flex', 
        flexDirection: onRight ? 'row-reverse' : 'row', 
        background: bg, 
        color: '#333', 
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
    <div style={{ width: '794px', background: bg, color: '#e0e0e0', fontFamily: 'monospace', padding: '3rem' }}>
        <div style={{ borderTop: `4px solid ${finalAccent}`, paddingTop: '1rem', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Terminal color={finalAccent} size={32} style={{ flexShrink: 0 }} />
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{personalInfo.firstName}_{personalInfo.lastName}</h1>
            </div>
            <div style={{ color: finalAccent, fontSize: '1.1rem', marginTop: '0.5rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>&gt; {personalInfo.title}</div>
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
                    <div style={{ fontWeight: 800, color: '#fff' }}>{exp.role} @ {getExperienceCompany(exp)}</div>
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
                        <div style={{ fontWeight: 800, color: '#fff' }}>{proj.name}</div>
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
  const renderMagazineMode = () => (
    <div style={{ width: '794px', background: bg, color: '#111', fontFamily: fonts.heading, padding: '4rem' }}>
        <div style={{ borderLeft: `8px solid ${finalAccent}`, paddingLeft: '2rem', marginBottom: '4rem' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 950, lineHeight: 0.9, marginBottom: '0.5rem' }}>{personalInfo.firstName}<br />{personalInfo.lastName}</h1>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: finalAccent, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{personalInfo.title}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <section>
                <p style={{ fontSize: '1.1rem', fontStyle: 'italic', lineHeight: 1.8, opacity: 0.9 }}>"{resolvedSummary}"</p>
                </section>
                <section>
                    <SectionLabel title="Career Path" style={{ borderBottomWidth: '3px', borderBottomColor: '#111' }} />
                    {experience.map((exp, idx) => (
                  <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
                    ))}
                </section>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {(personalInfo.email || personalInfo.phone || personalInfo.location) && (
                <section>
                    <SectionLabel title="Reach" style={{ borderBottomWidth: '3px', borderBottomColor: '#111' }} />
                    <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.8 }}>
                        {personalInfo.email && <div>{personalInfo.email}</div>}
                        {personalInfo.phone && <div>{personalInfo.phone}</div>}
                        {personalInfo.location && <div>{personalInfo.location}</div>}
                    </div>
                </section>
            )}
            {skills.length > 0 && (
                <section>
                    <SectionLabel title="Expertise" style={{ borderBottomWidth: '3px', borderBottomColor: '#111' }} />
                    {skills.map((s, idx) => (
                    <div key={idx} style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>• {getSkillName(s)}</div>
                    ))}
                </section>
            )}
            {projects && projects.length > 0 && (
                <section>
                    <SectionLabel title="Showcase" style={{ borderBottomWidth: '3px', borderBottomColor: '#111' }} />
                    {projects.map((proj, idx) => (
                        <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
                    ))}
                </section>
            )}
            </div>
        </div>
    </div>
  );

  // 5. CARD GRID (t19, studio style)
  const renderCardGrid = () => (
    <div style={{ width: '794px', background: bg, padding: '3rem', fontFamily: fonts.body }}>
        <div style={{ background: finalPrimary, color: '#fff', padding: '3rem', borderRadius: '24px', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.8, marginTop: '0.5rem' }}>{personalInfo.title}</p>
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
    <div style={{ width: '794px', background: bg, color: (template.id || '').includes('dark') || bg === '#0d1b2a' || bg === '#111' ? '#fff' : '#111', padding: '96px', fontFamily: fonts.heading }}>
        <div style={{ textAlign: 'center', borderBottom: `2px solid ${finalAccent}`, paddingBottom: '2rem', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: finalAccent, margin: '0.5rem 0' }}>{personalInfo.title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join('  |  ')}
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <section>
                <SectionLabel title="Executive Profile" style={{ borderBottomColor: '#111' }} />
            <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{resolvedSummary}</p>
            </section>
            {experience.length > 0 && (
                <section>
                    <SectionLabel title="Experience" style={{ borderBottomColor: '#111' }} />
                    {experience.map((exp, idx) => (
                  <Entry key={idx} title={exp.role} subtitle={getExperienceCompany(exp)} date={getExperienceDate(exp)} description={exp.description} />
                    ))}
                </section>
            )}
            {education.length > 0 && (
                <section>
                    <SectionLabel title="Education" style={{ borderBottomColor: '#111' }} />
                    {education.map((edu, idx) => (
                  <Entry key={idx} title={edu.degree} subtitle={getEducationSchool(edu)} date={getEducationYear(edu)} description={edu.description} />
                    ))}
                </section>
            )}
            {projects && projects.length > 0 && (
                <section>
                    <SectionLabel title="Projects" style={{ borderBottomColor: '#111' }} />
                    {projects.map((proj, idx) => (
                        <Entry key={idx} title={proj.name} subtitle={proj.role} date={getExperienceDate(proj)} description={proj.description} />
                    ))}
                </section>
            )}
            {certifications && certifications.length > 0 && (
                <section>
                    <SectionLabel title="Certifications" style={{ borderBottomColor: '#111' }} />
                    {certifications.map((cert, idx) => (
                        <Entry key={idx} title={cert.name} subtitle={cert.issuer} date={cert.issueDate} description={cert.credentialId} />
                    ))}
                </section>
            )}
        </div>
    </div>
  );

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

  // DEFAULT FALLBACK (Minimalist/Standard)
  return (
    <div style={{ width: '794px', padding: '96px', background: bg, color: '#333', fontFamily: fonts.body }}>
       <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: finalPrimary, margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{personalInfo.firstName} {personalInfo.lastName}</h1>
       <div style={{ fontSize: '1.1rem', fontWeight: 600, color: finalAccent, borderBottom: `1px solid ${finalAccent}`, paddingBottom: '0.5rem', marginBottom: '2rem' }}>{personalInfo.title}</div>
       
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
