import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, AlertTriangle, Loader2, Plus, Trash2, Upload, Save, CheckCircle2, X } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../supabase'
import { getDbUserId, getDbUserIdCandidates } from '../lib/userIdentity'
import { useToast } from '../context/ToastContext'
import * as resumeParser from '../lib/resumeParser'
import { withApiBase } from '../lib/apiBase'
import { saveMasterProfileBackup, loadMasterProfileBackup } from '../lib/masterProfileBackup'

const emptyEducation = () => ({ degree: '', institution: '', location: '', startYear: '', endYear: '', gpa: '' })
const emptyWork = () => ({ company: '', role: '', location: '', startDate: '', endDate: '', bullets: [] })
const emptyProject = () => ({ projectName: '', description: '', techStack: '', githubLink: '', liveLink: '' })
const emptyCertification = () => ({ name: '', issuer: '', date: '', link: '' })

const parseSkillInput = (value) => value
  .split(/[\n,]/)
  .map((item) => item.trim())
  .filter(Boolean)

const parseBullets = (value) => value
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean)

const extractProfileFromProfilesRow = (data, userEmail = '') => {
  if (!data) return null

  if (data.master_profile) {
    return typeof data.master_profile === 'string'
      ? JSON.parse(data.master_profile)
      : data.master_profile
  }

  if (data.resume_data) {
    const parsed = typeof data.resume_data === 'string'
      ? JSON.parse(data.resume_data)
      : data.resume_data
    return resumeParser.createMasterProfileFromParsed(parsed)
  }

  return resumeParser.createMasterProfileFromParsed({
    personalInfo: {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: data.email || userEmail || '',
      phone: data.phone || '',
      location: [data.city, data.country].filter(Boolean).join(', '),
      linkedin: data.linkedin || '',
      github: data.github || '',
      website: data.website || '',
      summary: data.summary || ''
    },
    experience: Array.isArray(data.experience_data) ? data.experience_data : [],
    education: Array.isArray(data.education_data) ? data.education_data : [],
    skills: Array.isArray(data.skills_data) ? data.skills_data : [],
    projects: Array.isArray(data.projects_data) ? data.projects_data : [],
    certifications: Array.isArray(data.certifications_data) ? data.certifications_data : []
  })
}

const profileCards = [
  { id: 'personal', title: 'Personal Details', description: 'Start with your identity and contact details.' },
  { id: 'summary', title: 'Summary', description: 'Write your professional summary in 3-5 lines.' },
  { id: 'education', title: 'Education', description: 'Add your degrees and academic timeline.' },
  { id: 'work', title: 'Work Experience', description: 'Add your roles and impact bullets.' },
  { id: 'projects', title: 'Projects', description: 'Highlight practical work with links.' },
  { id: 'skills', title: 'Skills', description: 'Categorize your technical strengths.' },
  { id: 'certifications', title: 'Certifications', description: 'Add certifications relevant to your target roles.' },
  { id: 'achievements', title: 'Achievements', description: 'Optional final step for extra highlights.' }
]

export default function MasterProfile() {
  const { success: toastSuccess, error: toastError } = useToast()
  const navigate = useNavigate()
  const { user, masterProfile, setMasterProfile, applyMasterProfile } = useStore()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parseStatus, setParseStatus] = useState('idle')
  const [profile, setProfile] = useState(() => resumeParser.createEmptyMasterProfile())
  const [skillDraft, setSkillDraft] = useState({ languages: '', frameworks: '', tools: '', databases: '', cloud: '', other: '' })
  const [achievementDraft, setAchievementDraft] = useState('')
  const [activeCard, setActiveCard] = useState(0)
  const fileInputRef = useRef(null)
  const cardContainerRef = useRef(null)

  const reviewCount = useMemo(() => Object.keys(profile?.needsReview || {}).length, [profile])
  const totalCards = profileCards.length
  const activeCardMeta = profileCards[activeCard]

  useEffect(() => {
    const initial = masterProfile
      ? resumeParser.normalizeMasterProfile(masterProfile)
      : resumeParser.createEmptyMasterProfile()
    setProfile(initial)
  }, [masterProfile])

  const collectUserIdCandidates = useMemo(() => async () => {
    const candidates = new Set()
    const addCandidate = (value) => {
      const token = String(value || '').trim()
      if (token) candidates.add(token)
    }

    addCandidate(getDbUserId(user))
    getDbUserIdCandidates(user).forEach(addCandidate)
    addCandidate(user?.studentId)
    addCandidate(user?.uid)
    addCandidate(user?.id)
    addCandidate(user?.user_id)

    const email = String(user?.email || '').trim()
    if (email) {
      try {
        const { data } = await supabase.from('students').select('id').eq('email', email).maybeSingle()
        if (data?.id) addCandidate(data.id)
      } catch (err) { console.debug('Email candidate lookup failed', err) }
    }
    return [...candidates]
  }, [user])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const userIdCandidates = await collectUserIdCandidates()
      if (!userIdCandidates.length) return

      setLoading(true)
      try {
        for (const candidateId of userIdCandidates) {
          try {
            const apiResponse = await fetch(withApiBase(`/api/master-profile/${encodeURIComponent(candidateId)}`))
            if (!apiResponse.ok) continue
            const payload = await apiResponse.json()
            if (payload?.profile) {
              const normalizedProfile = resumeParser.normalizeMasterProfile(payload.profile)
              if (resumeParser.calculateMasterProfileCompleteness(normalizedProfile) > 0) {
                setProfile(normalizedProfile)
                setMasterProfile(normalizedProfile)
                applyMasterProfile(normalizedProfile)
                saveMasterProfileBackup(user, normalizedProfile)
                return
              }
            }
          } catch (apiError) { console.debug('API lookup failed', apiError) }
        }

        for (const candidateId of userIdCandidates) {
          const { data, error } = await supabase.from('profiles').select('*').eq('user_id', candidateId).maybeSingle()
          if (!error && data) {
            const profileFromDb = extractProfileFromProfilesRow(data, user?.email || '')
            const normalizedProfile = resumeParser.normalizeMasterProfile(profileFromDb)
            setProfile(normalizedProfile)
            setMasterProfile(normalizedProfile)
            applyMasterProfile(normalizedProfile)
            saveMasterProfileBackup(user, normalizedProfile)
            return
          }
        }

        const backupProfile = loadMasterProfileBackup(user)
        if (backupProfile) {
          const normalizedBackup = resumeParser.normalizeMasterProfile(backupProfile)
          setProfile(normalizedBackup)
          setMasterProfile(normalizedBackup)
          applyMasterProfile(normalizedBackup)
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, setMasterProfile, applyMasterProfile, collectUserIdCandidates])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('autoUpload') === '1' || params.get('fromUpload') === '1') {
      const timer = setTimeout(() => {
        if (fileInputRef.current) fileInputRef.current.click()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const hasValue = (value) => {
    if (Array.isArray(value)) return value.length > 0
    return String(value || '').trim().length > 0
  }

  const setProfileAndReview = (nextProfile, path, value) => {
    const nextNeedsReview = { ...(nextProfile?.needsReview || {}) }

    if (path) {
      if (hasValue(value)) {
        delete nextNeedsReview[path]
      } else {
        nextNeedsReview[path] = true
      }
    }

    setProfile({ ...nextProfile, needsReview: nextNeedsReview })
  }

  const isReview = (path) => Boolean(profile?.needsReview?.[path])
  const isRowReview = (prefix) => Object.keys(profile?.needsReview || {}).some((key) => key.startsWith(prefix))

  const inputClass = (path) => [
    'w-full rounded-xl border px-4 py-3 text-sm outline-none transition',
    isReview(path) ? 'border-amber-400 bg-amber-50 focus:border-amber-500' : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
  ].join(' ')

  const textareaClass = (path) => [
    'w-full rounded-xl border px-4 py-3 text-sm outline-none transition resize-y',
    isReview(path) ? 'border-amber-400 bg-amber-50 focus:border-amber-500' : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
  ].join(' ')

  const updatePersonal = (field, value) => {
    const next = { ...profile, personal: { ...profile.personal, [field]: value } }
    setProfileAndReview(next, `personal.${field}`, value)
  }

  const updateSummary = (value) => setProfileAndReview({ ...profile, summary: value }, 'summary', value)

  const updateEducation = (index, field, value) => {
    const nextEducation = [...profile.education]
    nextEducation[index] = { ...nextEducation[index], [field]: value }
    setProfileAndReview({ ...profile, education: nextEducation }, `education.${index}.${field}`, value)
  }

  const updateWork = (index, field, value) => {
    const nextWork = [...profile.workExperience]
    nextWork[index] = { ...nextWork[index], [field]: value }
    setProfileAndReview({ ...profile, workExperience: nextWork }, `workExperience.${index}.${field}`, value)
  }

  const updateWorkBullets = (index, rawText) => {
    const nextWork = [...profile.workExperience]
    const bullets = parseBullets(rawText)
    nextWork[index] = { ...nextWork[index], bullets }
    setProfileAndReview({ ...profile, workExperience: nextWork }, `workExperience.${index}.bullets`, bullets)
  }

  const updateProject = (index, field, value) => {
    const nextProjects = [...profile.projects]
    nextProjects[index] = { ...nextProjects[index], [field]: value }
    setProfileAndReview({ ...profile, projects: nextProjects }, `projects.${index}.${field}`, value)
  }

  const updateCertification = (index, field, value) => {
    const nextCerts = [...profile.certifications]
    nextCerts[index] = { ...nextCerts[index], [field]: value }
    setProfileAndReview({ ...profile, certifications: nextCerts }, `certifications.${index}.${field}`, value)
  }

  const addSkillCategory = (category) => {
    const entries = parseSkillInput(skillDraft[category])
    if (!entries.length) return
    const merged = [...new Set([...(profile.skills[category] || []), ...entries])]
    const next = { ...profile, skills: { ...profile.skills, [category]: merged } }
    setSkillDraft((prev) => ({ ...prev, [category]: '' }))
    setProfileAndReview(next, 'skills', merged)
  }

  const removeSkillCategoryItem = (category, index) => {
    const nextItems = (profile.skills[category] || []).filter((_, i) => i !== index)
    const next = { ...profile, skills: { ...profile.skills, [category]: nextItems } }
    setProfileAndReview(next, 'skills', nextItems)
  }

  const addAchievement = () => {
    const value = achievementDraft.trim()
    if (!value) return
    const next = { ...profile, achievements: [...profile.achievements, value] }
    setAchievementDraft('')
    setProfileAndReview(next, null, value)
  }

  const removeAchievement = (index) => {
    const next = { ...profile, achievements: profile.achievements.filter((_, i) => i !== index) }
    setProfileAndReview(next, null, '')
  }

  const handleReupload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setParseStatus('parsing')
      const rawText = await resumeParser.extractResumeText(file)
      if (!rawText || rawText.length < 50) throw new Error('Could not read enough text from file.')

      let aiParsed = null
      try {
        const formData = new FormData()
        formData.append('resume', file)
        const dbUserId = getDbUserId(user)
        if (dbUserId) formData.append('userId', dbUserId)

        const response = await fetch(withApiBase('/api/parse-resume'), { method: 'POST', body: formData })
        if (response.ok) {
          const payload = await response.json()
          aiParsed = payload?.profile || payload?.data || null
        }
      } catch (err) { console.warn('AI parser fallback', err) }

      const localParsed = resumeParser.parseResumeText(rawText)
      const mergedParsed = aiParsed
        ? resumeParser.mergeParsedResume(localParsed, resumeParser.masterProfileToResumeData(aiParsed))
        : localParsed
      const nextProfile = aiParsed
        ? resumeParser.normalizeMasterProfile(aiParsed)
        : resumeParser.createMasterProfileFromParsed(mergedParsed)

      setProfile(nextProfile)
      setMasterProfile(nextProfile)
      applyMasterProfile(nextProfile)
      saveMasterProfileBackup(user, nextProfile)
      setParseStatus('success')
      toastSuccess('Parsed data loaded successfully.')
    } catch (error) {
      setParseStatus('error')
      toastError(error?.message || 'Failed to parse resume.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setParseStatus('idle'), 1500)
    }
  }

  const saveProfile = async () => {
    if (!user) {
      toastError('Please sign in first.')
      return false
    }

    const userIdCandidates = await collectUserIdCandidates()
    if (!userIdCandidates.length) {
      toastError('Unable to identify your account.')
      return false
    }

    const normalized = resumeParser.normalizeMasterProfile(profile)
    setSaving(true)

    try {
      let savedToDb = false
      
      for (const candidateUserId of userIdCandidates) {
        // Fallback Supabase Save (We try this to ensure we don't leak 404s if API is down)
        const { error } = await supabase
          .from('master_profiles')
          .upsert({
            user_id: candidateUserId,
            profile_data: normalized,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (!error) {
          savedToDb = true
          break
        }
        
        // Secondary fallback
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ master_profile: normalized, updated_at: new Date().toISOString() })
          .eq('user_id', candidateUserId)
          
        if (!profileError) {
          savedToDb = true
          break
        }
      }

      // Sync backend API silently
      fetch(withApiBase('/api/master-profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdCandidates[0], userEmail: user?.email || '', profile: normalized })
      }).catch(() => {})

      if (!savedToDb) {
        throw new Error('Could not persist to database.')
      }

      setMasterProfile(normalized)
      applyMasterProfile(normalized)
      saveMasterProfileBackup(user, normalized)
      toastSuccess('Master Profile saved successfully.')
      return true
    } catch (error) {
      console.error('Failed to save profile', error)
      const normalizedLocal = resumeParser.normalizeMasterProfile(profile)
      setMasterProfile(normalizedLocal)
      applyMasterProfile(normalizedLocal)
      saveMasterProfileBackup(user, normalizedLocal)
      toastSuccess('Master Profile saved locally on this device.')
      return true
    } finally {
      setSaving(false)
    }
  }

  const goToNextCard = () => {
    if (activeCard < totalCards - 1) {
      setActiveCard(prev => prev + 1)
      cardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const goToPreviousCard = () => {
    if (activeCard > 0) {
      setActiveCard(prev => prev - 1)
      cardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSaveAndContinue = async () => {
    await saveProfile()
    navigate('/student/choice')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="font-semibold tracking-wide">Loading Master Profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20 font-sans">
      {/* Top Banner & Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/student" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleReupload} accept=".pdf,.docx,.txt" className="hidden" />
            <button
              type="button"
              disabled={parseStatus !== 'idle'}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {parseStatus === 'parsing' ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              <span className="hidden sm:inline">Upload Resume</span>
            </button>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20" ref={cardContainerRef}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest">
            Step 1 of 3
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">Build your Master Profile</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">This acts as your central identity. We'll use this to auto-fill your resumes.</p>
        </div>

        {/* Wizard Card Container */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out" 
              style={{ width: `${((activeCard + 1) / totalCards) * 100}%` }}
            />
          </div>

          <div className="p-6 md:p-10 pt-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-blue-600 font-black text-xs uppercase tracking-widest mb-1 block">
                  Card {activeCard + 1} of {totalCards}
                </span>
                <h2 className="text-2xl font-black text-slate-900">{activeCardMeta.title}</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">{activeCardMeta.description}</p>
              </div>
              
              {reviewCount > 0 && (
                <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                  <AlertTriangle size={14} /> {reviewCount} items to review
                </div>
              )}
            </div>

            {/* Active Card Content */}
            <div className="min-h-[300px]">
              {activeCard === 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <input className={inputClass('personal.fullName')} value={profile.personal.fullName} onChange={(e) => updatePersonal('fullName', e.target.value)} placeholder="Full Name" />
                  <input className={inputClass('personal.email')} value={profile.personal.email} onChange={(e) => updatePersonal('email', e.target.value)} placeholder="Email" />
                  <input className={inputClass('personal.phone')} value={profile.personal.phone} onChange={(e) => updatePersonal('phone', e.target.value)} placeholder="Phone" />
                  <input className={inputClass('personal.location')} value={profile.personal.location} onChange={(e) => updatePersonal('location', e.target.value)} placeholder="Location" />
                  <input className={inputClass('personal.linkedInUrl')} value={profile.personal.linkedInUrl} onChange={(e) => updatePersonal('linkedInUrl', e.target.value)} placeholder="LinkedIn URL" />
                  <input className={inputClass('personal.githubUrl')} value={profile.personal.githubUrl} onChange={(e) => updatePersonal('githubUrl', e.target.value)} placeholder="GitHub URL" />
                  <input className={inputClass('personal.portfolioUrl')} value={profile.personal.portfolioUrl} onChange={(e) => updatePersonal('portfolioUrl', e.target.value)} placeholder="Portfolio URL (Optional)" />
                </div>
              )}

              {activeCard === 1 && (
                <div className="space-y-2">
                  <textarea className={textareaClass('summary')} rows={6} value={profile.summary} onChange={(e) => updateSummary(e.target.value)} placeholder="I am a software engineer with 3+ years of experience specializing in..." />
                  <p className="text-xs text-slate-400 font-medium px-2">Keep this concise. This summary acts as an elevator pitch for your resumes.</p>
                </div>
              )}

              {activeCard === 2 && (
                <div className="space-y-4">
                  {profile.education.map((edu, index) => (
                    <div key={`edu-${index}`} className={`rounded-2xl border p-5 ${isRowReview(`education.${index}.`) ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">Institution {index + 1}</h4>
                        <button type="button" onClick={() => setProfile(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }))} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className={inputClass(`education.${index}.degree`)} value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} placeholder="Degree (e.g. B.S. Computer Science)" />
                        <input className={inputClass(`education.${index}.institution`)} value={edu.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} placeholder="Institution Name" />
                        <input className={inputClass(`education.${index}.location`)} value={edu.location} onChange={(e) => updateEducation(index, 'location', e.target.value)} placeholder="Location" />
                        <input className={inputClass(`education.${index}.gpa`)} value={edu.gpa} onChange={(e) => updateEducation(index, 'gpa', e.target.value)} placeholder="GPA (Optional)" />
                        <input className={inputClass(`education.${index}.startYear`)} value={edu.startYear} onChange={(e) => updateEducation(index, 'startYear', e.target.value)} placeholder="Start Year" />
                        <input className={inputClass(`education.${index}.endYear`)} value={edu.endYear} onChange={(e) => updateEducation(index, 'endYear', e.target.value)} placeholder="End Year" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setProfile(prev => ({ ...prev, education: [...prev.education, emptyEducation()] }))} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                    <Plus size={18} /> Add Education
                  </button>
                </div>
              )}

              {activeCard === 3 && (
                <div className="space-y-4">
                  {profile.workExperience.map((item, index) => (
                    <div key={`work-${index}`} className={`rounded-2xl border p-5 ${isRowReview(`workExperience.${index}.`) ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">Role {index + 1}</h4>
                        <button type="button" onClick={() => setProfile(prev => ({ ...prev, workExperience: prev.workExperience.filter((_, i) => i !== index) }))} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 mb-3">
                        <input className={inputClass(`workExperience.${index}.company`)} value={item.company} onChange={(e) => updateWork(index, 'company', e.target.value)} placeholder="Company Name" />
                        <input className={inputClass(`workExperience.${index}.role`)} value={item.role} onChange={(e) => updateWork(index, 'role', e.target.value)} placeholder="Job Title" />
                        <input className={inputClass(`workExperience.${index}.location`)} value={item.location} onChange={(e) => updateWork(index, 'location', e.target.value)} placeholder="Location" />
                        <div className="flex gap-2">
                          <input className={inputClass(`workExperience.${index}.startDate`)} value={item.startDate} onChange={(e) => updateWork(index, 'startDate', e.target.value)} placeholder="Start Date" />
                          <input className={inputClass(`workExperience.${index}.endDate`)} value={item.endDate} onChange={(e) => updateWork(index, 'endDate', e.target.value)} placeholder="End Date" />
                        </div>
                      </div>
                      <textarea className={textareaClass(`workExperience.${index}.bullets`)} rows={5} value={(item.bullets || []).join('\n')} onChange={(e) => updateWorkBullets(index, e.target.value)} placeholder="Describe your achievements (one per line)..." />
                    </div>
                  ))}
                  <button type="button" onClick={() => setProfile(prev => ({ ...prev, workExperience: [...prev.workExperience, emptyWork()] }))} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                    <Plus size={18} /> Add Work Experience
                  </button>
                </div>
              )}

              {activeCard === 4 && (
                <div className="space-y-4">
                  {profile.projects.map((item, index) => (
                    <div key={`project-${index}`} className={`rounded-2xl border p-5 ${isRowReview(`projects.${index}.`) ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">Project {index + 1}</h4>
                        <button type="button" onClick={() => setProfile(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }))} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 mb-3">
                        <input className={inputClass(`projects.${index}.projectName`)} value={item.projectName} onChange={(e) => updateProject(index, 'projectName', e.target.value)} placeholder="Project Name" />
                        <input className={inputClass(`projects.${index}.techStack`)} value={item.techStack} onChange={(e) => updateProject(index, 'techStack', e.target.value)} placeholder="Tech Stack (e.g. React, Node.js)" />
                        <input className={inputClass(`projects.${index}.githubLink`)} value={item.githubLink} onChange={(e) => updateProject(index, 'githubLink', e.target.value)} placeholder="GitHub URL" />
                        <input className={inputClass(`projects.${index}.liveLink`)} value={item.liveLink} onChange={(e) => updateProject(index, 'liveLink', e.target.value)} placeholder="Live Demo URL" />
                      </div>
                      <textarea className={textareaClass(`projects.${index}.description`)} rows={3} value={item.description} onChange={(e) => updateProject(index, 'description', e.target.value)} placeholder="Short description of the project and your contributions..." />
                    </div>
                  ))}
                  <button type="button" onClick={() => setProfile(prev => ({ ...prev, projects: [...prev.projects, emptyProject()] }))} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                    <Plus size={18} /> Add Project
                  </button>
                </div>
              )}

              {activeCard === 5 && (
                <div className="grid gap-5 md:grid-cols-2">
                  {['languages', 'frameworks', 'tools', 'databases', 'cloud', 'other'].map((category) => (
                    <div key={category} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <h3 className="mb-3 text-sm font-black capitalize text-slate-700">{category}</h3>
                      <div className="mb-3 flex gap-2">
                        <input
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                          value={skillDraft[category]}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkillCategory(category) } }}
                          onChange={(e) => setSkillDraft(prev => ({ ...prev, [category]: e.target.value }))}
                          placeholder="Type skill and press Enter"
                        />
                        <button type="button" onClick={() => addSkillCategory(category)} className="rounded-lg bg-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-300 transition-colors">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(profile.skills[category] || []).map((item, index) => (
                          <span key={`${category}-${index}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">
                            {item}
                            <button type="button" onClick={() => removeSkillCategoryItem(category, index)} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeCard === 6 && (
                <div className="space-y-4">
                  {profile.certifications.map((item, index) => (
                    <div key={`cert-${index}`} className={`rounded-2xl border p-5 ${isRowReview(`certifications.${index}.`) ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">Certification {index + 1}</h4>
                        <button type="button" onClick={() => setProfile(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }))} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className={inputClass(`certifications.${index}.name`)} value={item.name} onChange={(e) => updateCertification(index, 'name', e.target.value)} placeholder="Certification Name" />
                        <input className={inputClass(`certifications.${index}.issuer`)} value={item.issuer} onChange={(e) => updateCertification(index, 'issuer', e.target.value)} placeholder="Issuing Organization" />
                        <input className={inputClass(`certifications.${index}.date`)} value={item.date} onChange={(e) => updateCertification(index, 'date', e.target.value)} placeholder="Issue Date" />
                        <input className={inputClass(`certifications.${index}.link`)} value={item.link} onChange={(e) => updateCertification(index, 'link', e.target.value)} placeholder="Credential URL" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setProfile(prev => ({ ...prev, certifications: [...prev.certifications, emptyCertification()] }))} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                    <Plus size={18} /> Add Certification
                  </button>
                </div>
              )}

              {activeCard === 7 && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-2">
                    <input 
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500" 
                      value={achievementDraft} 
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAchievement() } }}
                      onChange={(e) => setAchievementDraft(e.target.value)} 
                      placeholder="e.g. Won 1st place in Hackathon 2024..." 
                    />
                    <button type="button" onClick={addAchievement} className="rounded-xl bg-slate-900 px-6 text-sm font-bold text-white hover:bg-slate-800 transition-colors">Add</button>
                  </div>
                  
                  {profile.achievements.length > 0 ? (
                    <ul className="space-y-2">
                      {profile.achievements.map((item, index) => (
                        <li key={`ach-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                          <span className="flex-1">{item}</span>
                          <button type="button" onClick={() => removeAchievement(index)} className="text-slate-400 hover:text-rose-500 ml-4"><Trash2 size={16} /></button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">
                      No extra achievements added. You can skip this if you want!
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Wizard Footer Controls */}
          <div className="bg-slate-50 border-t border-slate-100 p-6 md:px-10 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousCard}
              disabled={activeCard === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeCard === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 bg-slate-100'}`}
            >
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Previous</span>
            </button>

            {activeCard < totalCards - 1 ? (
              <button
                type="button"
                onClick={goToNextCard}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all"
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all disabled:opacity-70"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Complete & Build Resume
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
