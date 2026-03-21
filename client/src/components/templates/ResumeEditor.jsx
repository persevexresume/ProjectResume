import { useState, useCallback } from 'react'
import { Plus, Trash2, Eye, EyeOff, Download, Share2 } from 'lucide-react'
import useResumeStore from '../../store/useResumeStore'
import { resumeTemplates } from '../../data/templates'
import DynamicTemplateRenderer from './DynamicTemplateRenderer'
import { exportElementToPaginatedPdf } from '../../lib/pdfExport'

export default function ResumeEditor({ templateId = 'neo-minimal' }) {
  const { resume, setResume, updatePersonalInfo, setSummary, addExperience, updateExperience, removeExperience, addEducation, removeEducation, updateEducation, setSkills, toggleSection } = useResumeStore()
  const [activeTab, setActiveTab] = useState('personal')
  const template = resumeTemplates.find(t => t.id === templateId) || resumeTemplates[0]

  // Handle personal info updates
  const handlePersonalInfoChange = useCallback((field, value) => {
    updatePersonalInfo({ [field]: value })
  }, [updatePersonalInfo])

  // Handle export to PDF
  const handleExportPDF = async () => {
    const element = document.getElementById('resume-preview-download')
    if (!element) return

    try {
      await exportElementToPaginatedPdf(element, 'resume.pdf')
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Error exporting PDF')
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Panel: Form */}
      <div className="flex-1 overflow-y-auto bg-white border-r border-slate-200">
        <div className="max-w-md mx-auto p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            {['personal', 'experience', 'education', 'skills'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={resume.personalInfo.firstName}
                  onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={resume.personalInfo.lastName}
                  onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Professional Title</label>
                <input
                  type="text"
                  value={resume.personalInfo.title}
                  onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={resume.personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={resume.personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={resume.personalInfo.location}
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="City, State"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Professional Summary</label>
                <textarea
                  value={resume.summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="Brief overview of your professional background and goals"
                />
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Work Experience</h3>
              {resume.experience.map((job, idx) => (
                <div key={job.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-900">Position {idx + 1}</h4>
                    <button
                      onClick={() => removeExperience(job.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={job.position}
                    onChange={(e) => updateExperience(job.id, { position: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mb-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={job.company}
                    onChange={(e) => updateExperience(job.id, { company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mb-2 text-sm"
                  />
                  <textarea
                    placeholder="Description"
                    value={job.description}
                    onChange={(e) => updateExperience(job.id, { description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mb-2 text-sm h-20"
                  />
                </div>
              ))}
              <button
                onClick={() => addExperience({ position: '', company: '', description: '', startDate: '', endDate: '' })}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700"
              >
                <Plus size={16} /> Add Experience
              </button>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Education</h3>
              {resume.education.map((edu, idx) => (
                <div key={edu.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-900">School {idx + 1}</h4>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mb-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="School"
                    value={edu.school}
                    onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mb-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Field"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mb-2 text-sm"
                  />
                </div>
              ))}
              <button
                onClick={() => addEducation({ degree: '', school: '', field: '', graduationDate: '' })}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700"
              >
                <Plus size={16} /> Add Education
              </button>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {resume.skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => setSkills(resume.skills.filter((_, i) => i !== idx))}
                      className="hover:text-indigo-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="skillInput"
                  placeholder="Add a skill and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      setSkills([...resume.skills, e.target.value.trim()])
                      e.target.value = ''
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div className="flex-1 flex flex-col bg-slate-100">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">{template.name}</h2>
            <p className="text-xs text-slate-600">{template.style} Style</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700"
            >
              <Download size={16} /> PDF
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-8">
          <div
            id="resume-preview"
            className="bg-white mx-auto shadow-lg"
            style={{
              width: '794px',
              maxWidth: '794px',
              minHeight: '1123px',
              aspectRatio: '210 / 297',
              fontSize: `14px`,
              boxSizing: 'border-box',
              overflow: 'visible'
            }}
          >
            <DynamicTemplateRenderer template={{ id: templateId }} resumeData={resume} />
          </div>

          <div
            id="resume-preview-download"
            style={{
              position: 'fixed',
              top: '-10000px',
              left: '-10000px',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: -1,
              width: '794px',
              maxWidth: '794px',
              height: 'auto',
              minHeight: 0,
              aspectRatio: 'auto',
              background: '#ffffff',
              boxSizing: 'border-box',
              overflow: 'visible'
            }}
          >
            <DynamicTemplateRenderer template={{ id: templateId }} resumeData={resume} />
          </div>
        </div>
      </div>
    </div>
  )
}
