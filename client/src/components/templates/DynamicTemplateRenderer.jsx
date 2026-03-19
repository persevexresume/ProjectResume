import React, { useMemo } from 'react'
import { resumeTemplates } from '../../data/templates'

// Template rendering configurations for each style
const templateStyles = {
  'modern': {
    containerClass: 'bg-white',
    headerClass: 'border-l-4 border-indigo-600',
    sectionClass: 'border-t border-slate-200'
  },
  'classic': {
    containerClass: 'bg-white',
    headerClass: 'border-b-2 border-slate-900 text-center',
    sectionClass: 'border-t border-slate-300'
  },
  'creative': {
    containerClass: 'bg-white',
    headerClass: 'bg-gradient-to-r p-4 text-white',
    sectionClass: 'mb-6'
  },
  'minimal': {
    containerClass: 'bg-white',
    headerClass: '',
    sectionClass: 'border-t border-slate-100'
  },
  'executive': {
    containerClass: 'bg-white',
    headerClass: 'bg-slate-900 text-white p-8 text-center',
    sectionClass: 'p-6 border-b border-slate-200'
  }
}

const DynamicTemplateRenderer = ({ 
  template, 
  resumeData, 
  editable = false,
  onFieldChange = () => {} 
}) => {
  const templateDef = useMemo(() => {
    return resumeTemplates.find(t => t.id === (template?.id || 'neo-minimal'))
  }, [template?.id])

  if (!templateDef || !resumeData) {
    return <div className="p-8 text-center text-slate-500">No template data</div>
  }

  const {
    personalInfo = {},
    summary = '',
    experience = [],
    education = [],
    skills = [],
  } = resumeData

  const templateClass = templateDef.category
  const styles = templateStyles[templateClass] || templateStyles.modern
  const primaryColor = templateDef.colors[0]
  const bgColor = templateDef.colors[1]
  const accentColor = templateDef.colors[2]

  // Modern Template
  if (templateDef.id.includes('neo-minimal') || templateDef.id.includes('modern')) {
    return (
      <div 
        className={`w-full h-full ${styles.containerClass} p-8 font-sans`}
        style={{ fontFamily: templateDef.fonts.body, color: '#1f2937' }}
      >
        {/* Header with Left Accent Bar */}
        <div className="border-l-4 mb-8 pl-6" style={{ borderColor: primaryColor }}>
          <h1 
            className="text-3xl font-black mb-1"
            style={{ color: primaryColor, fontFamily: templateDef.fonts.heading }}
          >
            {personalInfo.firstName || 'First'} {personalInfo.lastName || 'Last'}
          </h1>
          <p className="text-lg font-semibold text-slate-600">
            {personalInfo.title || 'Professional Title'}
          </p>
          <div className="flex gap-4 mt-3 text-sm text-slate-600">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>|</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>|</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-6 pb-6 border-b border-slate-200">
            <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-lg font-black mb-4 pb-2 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor, fontFamily: templateDef.fonts.heading }}
            >
              Experience
            </h2>
            {experience.map((job, i) => (
              <div key={i} className="mb-4 pl-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900">{job.position}</h3>
                  <span className="text-sm text-slate-500">{job.startDate} - {job.endDate}</span>
                </div>
                <p className="text-slate-600 font-semibold">{job.company}</p>
                {job.description && <p className="text-sm text-slate-700 mt-2">{job.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-lg font-black mb-4 pb-2 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor, fontFamily: templateDef.fonts.heading }}
            >
              Education
            </h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-3">
                <div className="font-bold text-slate-900">{edu.degree} in {edu.field}</div>
                <div className="text-slate-600">{edu.school}</div>
                <div className="text-sm text-slate-500">Graduated: {edu.graduationDate}</div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 
              className="text-lg font-black mb-4 pb-2 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor, fontFamily: templateDef.fonts.heading }}
            >
              Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded text-sm font-semibold text-white"
                  style={{ background: accentColor }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Classic Template
  if (templateDef.id.includes('classic') || templateDef.id.includes('harvard') || templateDef.id.includes('corporate')) {
    return (
      <div 
        className="w-full h-full bg-white p-12 font-serif"
        style={{ fontFamily: templateDef.fonts.body, color: '#1a1a1a' }}
      >
        {/* Centered Header */}
        <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: templateDef.fonts.heading }}>
            {personalInfo.firstName || 'FIRST'} {personalInfo.lastName || 'LAST'}
          </h1>
          <p className="text-sm font-semibold">{personalInfo.title || 'PROFESSIONAL TITLE'}</p>
          <div className="text-xs mt-3 space-x-2">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>| {personalInfo.phone}</span>}
            {personalInfo.location && <span>| {personalInfo.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-6 text-justify text-sm">
            <p>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-black uppercase tracking-wide border-b border-slate-300 pb-2 mb-3">
              Professional Experience
            </h2>
            {experience.map((job, i) => (
              <div key={i} className="mb-4 text-sm">
                <div className="font-bold">{job.position}</div>
                <div className="italic">{job.company}</div>
                <div className="text-xs text-slate-600">{job.startDate} - {job.endDate}</div>
                {job.description && <p className="mt-1">{job.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-black uppercase tracking-wide border-b border-slate-300 pb-2 mb-3">
              Education
            </h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-3 text-sm">
                <div className="font-bold">{edu.degree} in {edu.field}</div>
                <div>{edu.school}</div>
                <div className="text-xs text-slate-600">{edu.graduationDate}</div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide border-b border-slate-300 pb-2 mb-3">
              Skills
            </h2>
            <p className="text-sm">{skills.join(' • ')}</p>
          </div>
        )}
      </div>
    )
  }

  // Minimal Template
  if (templateDef.id.includes('minimal') || templateDef.id.includes('white') || templateDef.id.includes('whitespace')) {
    return (
      <div 
        className="w-full h-full bg-white p-10 font-sans" 
        style={{ fontFamily: templateDef.fonts.body, color: '#000' }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: templateDef.fonts.heading }}>
            {personalInfo.firstName} {personalInfo.lastName}
          </h1>
          <div className="h-0.5 w-16 bg-black mb-4"></div>
          <p className="text-sm mb-3">{personalInfo.title}</p>
          <div className="text-xs space-x-3">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-8 text-sm leading-relaxed">
            <p>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4 pb-2 border-b border-gray-300">Experience</h2>
            <div className="space-y-4">
              {experience.map((job, i) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between">
                    <div className="font-bold">{job.position}</div>
                    <div className="text-xs text-gray-500">{job.startDate} – {job.endDate}</div>
                  </div>
                  <div className="text-gray-600">{job.company}</div>
                  {job.description && <p className="mt-1 text-gray-700">{job.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4 pb-2 border-b border-gray-300">Education</h2>
            <div className="space-y-3">
              {education.map((edu, i) => (
                <div key={i} className="text-sm">
                  <div className="font-bold">{edu.degree}</div>
                  <div className="text-gray-600">{edu.school}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest mb-4 pb-2 border-b border-gray-300">Skills</h2>
            <p className="text-sm">{skills.join(', ')}</p>
          </div>
        )}
      </div>
    )
  }

  // Fallback: Default clean template
  return (
    <div 
      className="w-full h-full p-8 font-sans"
      style={{ 
        fontFamily: templateDef.fonts.body, 
        background: bgColor,
        color: '#000'
      }}
    >
      <div style={{ borderLeft: `6px solid ${primaryColor}`, paddingLeft: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>{personalInfo.title}</p>
        <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
          {personalInfo.email} {personalInfo.phone && `| ${personalInfo.phone}`} {personalInfo.location && `| ${personalInfo.location}`}
        </div>
      </div>

      {summary && (
        <div style={{ marginBottom: '20px', fontSize: '13px', lineHeight: '1.6' }}>
          {summary}
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: `1px solid ${primaryColor}`, paddingBottom: '5px', marginBottom: '10px' }}>
            Experience
          </h2>
          {experience.map((job, i) => (
            <div key={i} style={{ marginBottom: '10px', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>{job.position}</div>
              <div style={{ color: '#666' }}>{job.company}</div>
              <div style={{ fontSize: '11px', color: '#999' }}>{job.startDate} - {job.endDate}</div>
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: `1px solid ${primaryColor}`, paddingBottom: '5px', marginBottom: '10px' }}>
            Education
          </h2>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10px', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>{edu.degree}</div>
              <div style={{ color: '#666' }}>{edu.school}</div>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: `1px solid ${primaryColor}`, paddingBottom: '5px', marginBottom: '10px' }}>
            Skills
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {skills.map((skill, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 8px',
                  background: accentColor,
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicTemplateRenderer
