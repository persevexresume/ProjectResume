import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, AlertTriangle, Loader2, Plus, Trash2, Upload, Save } from 'lucide-react'
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

const isRecoverableProfilePersistenceError = (error) => {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('api save failed with status 404') ||
    message.includes("could not find the table 'public.master_profiles'") ||
    message.includes('master_profiles') ||
    message.includes('profiles_user_id_fkey') ||
    message.includes('foreign key constraint')
}

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

export default function MasterProfile() {
  const { success: toastSuccess, error: toastError } = useToast()
  const {
    user,
    masterProfile,
    setMasterProfile,
    applyMasterProfile
  } = useStore()

  const [profileId, setProfileId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parseStatus, setParseStatus] = useState('idle')
  const [profile, setProfile] = useState(() => resumeParser.createEmptyMasterProfile())
  const [skillDraft, setSkillDraft] = useState({ languages: '', frameworks: '', tools: '', databases: '', cloud: '', other: '' })
  const [achievementDraft, setAchievementDraft] = useState('')
  const [showPostSaveHint, setShowPostSaveHint] = useState(false)
  const fileInputRef = useRef(null)

  const completeness = useMemo(() => resumeParser.calculateMasterProfileCompleteness(profile), [profile])
  const reviewCount = useMemo(() => Object.keys(profile?.needsReview || {}).length, [profile])

  useEffect(() => {
    const initial = masterProfile
      ? resumeParser.normalizeMasterProfile(masterProfile)
      : resumeParser.createEmptyMasterProfile()
    setProfile(initial)
  }, [masterProfile])

  const collectUserIdCandidates = async () => {
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
        const { data } = await supabase
          .from('students')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (data?.id) addCandidate(data.id)
      } catch {
        // Ignore candidates lookup failures and continue with available IDs.
      }
    }

    return [...candidates]
  }

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
                setProfileId(payload?.data?.id || null)
                saveMasterProfileBackup(user, normalizedProfile)
                return
              }
            }
          } catch (apiError) {
            console.warn('Master profile API fetch failed for candidate ID:', candidateId, apiError)
          }
        }

        for (const candidateId of userIdCandidates) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', candidateId)
            .maybeSingle()

          if (error) {
            const fullMessage = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
            const relationMissing = error.code === 'PGRST205' || /relation .* does not exist|schema cache|not found|404/i.test(fullMessage)
            const noRows = error.code === 'PGRST116' || /0 rows|no rows/i.test(fullMessage)
            const invalidUuid = /invalid input syntax for type uuid/i.test(fullMessage)

            if (relationMissing || noRows || invalidUuid) {
              continue
            }

            throw error
          }

          if (!data) continue

          setProfileId(data.id || null)
          const profileFromDb = extractProfileFromProfilesRow(data, user?.email || '')
          const normalizedProfile = resumeParser.normalizeMasterProfile(profileFromDb)
          setProfile(normalizedProfile)
          setMasterProfile(normalizedProfile)
          applyMasterProfile(normalizedProfile)
          saveMasterProfileBackup(user, normalizedProfile)
          return
        }

        const backupProfile = loadMasterProfileBackup(user)
        if (backupProfile) {
          const normalizedBackup = resumeParser.normalizeMasterProfile(backupProfile)
          setProfile(normalizedBackup)
          setMasterProfile(normalizedBackup)
          applyMasterProfile(normalizedBackup)
        }
      } catch (error) {
        console.error('Failed to load master profile', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, setMasterProfile, applyMasterProfile])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('autoUpload') === '1' || params.get('fromUpload') === '1') {
      const timer = setTimeout(() => {
        if (fileInputRef.current) fileInputRef.current.click()
      }, 500)
      return () => clearTimeout(timer)
    }

    return undefined
  }, [])

  useEffect(() => {
    if (!showPostSaveHint) return
    const timer = setTimeout(() => setShowPostSaveHint(false), 12000)
    return () => clearTimeout(timer)
  }, [showPostSaveHint])

  const hasValue = (value) => {
    if (Array.isArray(value)) return value.length > 0
    return String(value || '').trim().length > 0
  }

  const setProfileAndReview = (nextProfile, path, value) => {
    const normalized = resumeParser.normalizeMasterProfile(nextProfile)
    const nextNeedsReview = { ...(normalized.needsReview || {}) }

    if (path) {
      if (hasValue(value)) {
        delete nextNeedsReview[path]
      } else {
        nextNeedsReview[path] = true
      }
    }

    setProfile({ ...normalized, needsReview: nextNeedsReview })
  }

  const isReview = (path) => Boolean(profile?.needsReview?.[path])
  const isRowReview = (prefix) => Object.keys(profile?.needsReview || {}).some((key) => key.startsWith(prefix))

  const inputClass = (path) => [
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
    isReview(path) ? 'border-amber-400 bg-amber-50 focus:border-amber-500' : 'border-slate-300 bg-white focus:border-indigo-500'
  ].join(' ')

  const textareaClass = (path) => [
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition resize-y',
    isReview(path) ? 'border-amber-400 bg-amber-50 focus:border-amber-500' : 'border-slate-300 bg-white focus:border-indigo-500'
  ].join(' ')

  const updatePersonal = (field, value) => {
    const next = {
      ...profile,
      personal: {
        ...profile.personal,
        [field]: value
      }
    }
    setProfileAndReview(next, `personal.${field}`, value)
  }

  const updateSummary = (value) => {
    setProfileAndReview({ ...profile, summary: value }, 'summary', value)
  }

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
    const next = {
      ...profile,
      skills: {
        ...profile.skills,
        [category]: merged
      }
    }

    setSkillDraft((prev) => ({ ...prev, [category]: '' }))
    setProfileAndReview(next, 'skills', merged)
  }

  const removeSkillCategoryItem = (category, index) => {
    const nextItems = (profile.skills[category] || []).filter((_, i) => i !== index)
    const next = {
      ...profile,
      skills: {
        ...profile.skills,
        [category]: nextItems
      }
    }
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

  const parseResumeWithAI = async (file) => {
    const formData = new FormData()
    formData.append('resume', file)

    const dbUserId = getDbUserId(user)
    if (dbUserId) {
      formData.append('userId', dbUserId)
    }

    const response = await fetch(withApiBase('/api/parse-resume'), {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'AI parsing is unavailable right now.')
    }

    const payload = await response.json()
    return payload?.profile || payload?.data || {}
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
        aiParsed = await parseResumeWithAI(file)
      } catch (error) {
        console.warn('AI parser unavailable, using local parser only:', error?.message)
      }

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
      toastSuccess('Parsed data loaded. Review yellow fields and save your profile.')
    } catch (error) {
      console.error('Failed to parse uploaded file', error)
      setParseStatus('error')
      toastError(error?.message || 'Failed to parse uploaded resume.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setParseStatus('idle'), 1500)
    }
  }

  const saveProfile = async () => {
    if (!user) {
      toastError('Please sign in first.')
      return
    }

    const userIdCandidates = await collectUserIdCandidates()
    if (!userIdCandidates.length) {
      toastError('Unable to identify your account.')
      return
    }

    const normalized = resumeParser.normalizeMasterProfile(profile)

    setSaving(true)
    try {
      const attemptSaveForCandidate = async (candidateUserId) => {
        let apiErrorMessage = ''
        let fallbackErrorMessage = ''

        try {
          const response = await fetch(withApiBase('/api/master-profile'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: candidateUserId,
              userEmail: user?.email || '',
              profile: normalized
            })
          })

          const payload = await response.json().catch(() => ({}))
          if (!response.ok) {
            apiErrorMessage = payload?.error || `API save failed with status ${response.status}`
            throw new Error(apiErrorMessage)
          }

          if (payload?.fallback === 'local-only') {
            return {
              saved: false,
              localOnly: true,
              error: new Error(payload?.warning || 'Profile save fell back to local-only mode.')
            }
          }

          return {
            saved: true,
            localOnly: false,
            data: payload?.data || null
          }
        } catch (apiError) {
          apiErrorMessage = apiError?.message || apiErrorMessage || 'API save failed'
        }

        let fallbackSaved = false

        const { data, error } = await supabase
          .from('master_profiles')
          .upsert({
            user_id: candidateUserId,
            profile_data: normalized,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
          .select('id')
          .maybeSingle()

        if (!error) {
          fallbackSaved = true
          return {
            saved: true,
            localOnly: false,
            data: data || null
          }
        }

        fallbackErrorMessage = error.message || 'Fallback save failed'

        if (!fallbackSaved) {
          const resumeData = resumeParser.masterProfileToResumeData(normalized)
          const [firstName = '', ...restName] = (normalized.personal.fullName || '').split(/\s+/).filter(Boolean)
          const lastName = restName.join(' ')

          const draftPayload = {
            user_id: candidateUserId,
            first_name: firstName,
            last_name: lastName,
            email: normalized.personal.email || '',
            phone: normalized.personal.phone || '',
            summary: normalized.summary || '',
            website: normalized.personal.portfolioUrl || '',
            linkedin: normalized.personal.linkedInUrl || '',
            github: normalized.personal.githubUrl || '',
            experience_data: resumeData.experience || [],
            education_data: resumeData.education || [],
            skills_data: resumeData.skills || [],
            projects_data: resumeData.projects || [],
            certifications_data: resumeData.certifications || [],
            resume_data: resumeData,
            master_profile: normalized,
            updated_at: new Date().toISOString()
          }

          const adaptivePayload = { ...draftPayload }
          let profileSaveError = null
          let profileSavedData = null

          for (let attempt = 0; attempt < 10; attempt += 1) {
            const result = await supabase
              .from('profiles')
              .upsert(adaptivePayload, { onConflict: 'user_id' })
              .select('id')
              .maybeSingle()

            if (!result.error) {
              profileSavedData = result.data || null
              profileSaveError = null
              break
            }

            profileSaveError = result.error
            const fullMessage = [result.error.message, result.error.details, result.error.hint]
              .filter(Boolean)
              .join(' | ')

            const missingColumnMatch =
              fullMessage.match(/Could not find the '([^']+)' column/i) ||
              fullMessage.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)

            if (missingColumnMatch && adaptivePayload[missingColumnMatch[1]] !== undefined) {
              delete adaptivePayload[missingColumnMatch[1]]
              continue
            }

            break
          }

          if (!profileSaveError) {
            return {
              saved: true,
              localOnly: false,
              data: profileSavedData
            }
          }

          const composedError = new Error(`${apiErrorMessage ? `${apiErrorMessage} | ` : ''}${fallbackErrorMessage ? `${fallbackErrorMessage} | ` : ''}${profileSaveError.message || 'Fallback save failed'}`)
          if (isRecoverableProfilePersistenceError(composedError)) {
            return {
              saved: false,
              localOnly: true,
              error: composedError
            }
          }

          return {
            saved: false,
            localOnly: false,
            error: composedError
          }
        }

        return {
          saved: false,
          localOnly: false,
          error: new Error(apiErrorMessage || fallbackErrorMessage || 'Master profile save failed.')
        }
      }

      let saved = false
      let localOnlyMode = false
      let latestError = null

      for (const candidateUserId of userIdCandidates) {
        const result = await attemptSaveForCandidate(candidateUserId)

        if (result.saved) {
          saved = true
          setProfileId(result?.data?.id || profileId)
          break
        }

        if (result.localOnly) {
          localOnlyMode = true
        }

        if (result.error) {
          latestError = result.error
        }
      }

      if (!saved && !localOnlyMode) {
        throw latestError || new Error('Unable to persist master profile. Please try again.')
      }

      setMasterProfile(normalized)
      applyMasterProfile(normalized)
      saveMasterProfileBackup(user, normalized)
      setShowPostSaveHint(true)
      if (localOnlyMode) {
        toastSuccess('Master Profile saved locally. Templates will auto-fill from this data.')
      } else {
        toastSuccess('Master Profile saved successfully. Templates will auto-fill from this data.')
      }
    } catch (error) {
      console.error('Failed to save profile', error)
      if (isRecoverableProfilePersistenceError(error)) {
        const normalizedLocal = resumeParser.normalizeMasterProfile(profile)
        setMasterProfile(normalizedLocal)
        applyMasterProfile(normalizedLocal)
        saveMasterProfileBackup(user, normalizedLocal)
        setShowPostSaveHint(true)
        toastSuccess('Master Profile saved locally. Templates will auto-fill from this data.')
      } else {
        const normalizedLocal = resumeParser.normalizeMasterProfile(profile)
        setMasterProfile(normalizedLocal)
        applyMasterProfile(normalizedLocal)
        saveMasterProfileBackup(user, normalizedLocal)
        toastError(`${error?.message || 'Failed to save profile'} Saved locally on this device.`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={20} /> Loading Master Profile...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            <Link to="/student/choice" className={`inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 ${showPostSaveHint ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-300'}`}>
              <ArrowLeft size={16} /> Back
            </Link>
            {showPostSaveHint && (
              <div className="absolute -top-9 left-0 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 shadow-sm whitespace-nowrap">
                <ArrowRight size={11} className="animate-pulse" /> Next: Back, then continue to build your resume
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleReupload}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
            <button
              type="button"
              disabled={parseStatus !== 'idle'}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              {parseStatus === 'parsing' ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} 
              {parseStatus === 'parsing' ? 'Parsing...' : 'Upload PDF'}
            </button>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Master Profile
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-bold text-slate-900">Master Profile Editor</h1>
          <p className="mt-1 text-sm text-slate-600">All templates will auto-fill from this profile. Yellow fields need manual review.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Profile Completeness</span>
                <span>{completeness}%</span>
              </div>
              <div className="h-2 w-full rounded bg-slate-200">
                <div className="h-2 rounded bg-emerald-500" style={{ width: `${completeness}%` }} />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              <AlertTriangle size={14} /> {reviewCount} field(s) need review
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Personal</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass('personal.fullName')} value={profile.personal.fullName} onChange={(e) => updatePersonal('fullName', e.target.value)} placeholder="Full Name" />
            <input className={inputClass('personal.email')} value={profile.personal.email} onChange={(e) => updatePersonal('email', e.target.value)} placeholder="Email" />
            <input className={inputClass('personal.phone')} value={profile.personal.phone} onChange={(e) => updatePersonal('phone', e.target.value)} placeholder="Phone" />
            <input className={inputClass('personal.location')} value={profile.personal.location} onChange={(e) => updatePersonal('location', e.target.value)} placeholder="Location" />
            <input className={inputClass('personal.linkedInUrl')} value={profile.personal.linkedInUrl} onChange={(e) => updatePersonal('linkedInUrl', e.target.value)} placeholder="LinkedIn URL" />
            <input className={inputClass('personal.githubUrl')} value={profile.personal.githubUrl} onChange={(e) => updatePersonal('githubUrl', e.target.value)} placeholder="GitHub URL" />
            <input className={inputClass('personal.portfolioUrl')} value={profile.personal.portfolioUrl} onChange={(e) => updatePersonal('portfolioUrl', e.target.value)} placeholder="Portfolio URL" />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Summary / Objective</h2>
          <textarea className={textareaClass('summary')} rows={4} value={profile.summary} onChange={(e) => updateSummary(e.target.value)} placeholder="Professional summary" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Education</h2>
            <button type="button" onClick={() => setProfile((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }))} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><Plus size={14} /> Add</button>
          </div>
          <div className="space-y-3">
            {profile.education.map((edu, index) => (
              <div key={`edu-${index}`} className={`rounded-lg border p-3 ${isRowReview(`education.${index}.`) ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="mb-3 flex justify-end">
                  <button type="button" onClick={() => setProfile((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }))} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><Trash2 size={12} /> Remove</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={inputClass(`education.${index}.degree`)} value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} placeholder="Degree" />
                  <input className={inputClass(`education.${index}.institution`)} value={edu.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} placeholder="Institution" />
                  <input className={inputClass(`education.${index}.location`)} value={edu.location} onChange={(e) => updateEducation(index, 'location', e.target.value)} placeholder="Location" />
                  <input className={inputClass(`education.${index}.startYear`)} value={edu.startYear} onChange={(e) => updateEducation(index, 'startYear', e.target.value)} placeholder="Start Year" />
                  <input className={inputClass(`education.${index}.endYear`)} value={edu.endYear} onChange={(e) => updateEducation(index, 'endYear', e.target.value)} placeholder="End Year" />
                  <input className={inputClass(`education.${index}.gpa`)} value={edu.gpa} onChange={(e) => updateEducation(index, 'gpa', e.target.value)} placeholder="GPA" />
                </div>
              </div>
            ))}
            {profile.education.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No education added yet.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Work Experience</h2>
            <button type="button" onClick={() => setProfile((prev) => ({ ...prev, workExperience: [...prev.workExperience, emptyWork()] }))} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><Plus size={14} /> Add</button>
          </div>
          <div className="space-y-3">
            {profile.workExperience.map((item, index) => (
              <div key={`work-${index}`} className={`rounded-lg border p-3 ${isRowReview(`workExperience.${index}.`) ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="mb-3 flex justify-end">
                  <button type="button" onClick={() => setProfile((prev) => ({ ...prev, workExperience: prev.workExperience.filter((_, i) => i !== index) }))} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><Trash2 size={12} /> Remove</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={inputClass(`workExperience.${index}.company`)} value={item.company} onChange={(e) => updateWork(index, 'company', e.target.value)} placeholder="Company" />
                  <input className={inputClass(`workExperience.${index}.role`)} value={item.role} onChange={(e) => updateWork(index, 'role', e.target.value)} placeholder="Role" />
                  <input className={inputClass(`workExperience.${index}.location`)} value={item.location} onChange={(e) => updateWork(index, 'location', e.target.value)} placeholder="Location" />
                  <input className={inputClass(`workExperience.${index}.startDate`)} value={item.startDate} onChange={(e) => updateWork(index, 'startDate', e.target.value)} placeholder="Start Date" />
                  <input className={inputClass(`workExperience.${index}.endDate`)} value={item.endDate} onChange={(e) => updateWork(index, 'endDate', e.target.value)} placeholder="End Date" />
                </div>
                <div className="mt-3">
                  <textarea className={textareaClass(`workExperience.${index}.bullets`)} rows={4} value={(item.bullets || []).join('\n')} onChange={(e) => updateWorkBullets(index, e.target.value)} placeholder="Bullet points (one per line)" />
                </div>
              </div>
            ))}
            {profile.workExperience.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No work experience added yet.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
            <button type="button" onClick={() => setProfile((prev) => ({ ...prev, projects: [...prev.projects, emptyProject()] }))} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><Plus size={14} /> Add</button>
          </div>
          <div className="space-y-3">
            {profile.projects.map((item, index) => (
              <div key={`project-${index}`} className={`rounded-lg border p-3 ${isRowReview(`projects.${index}.`) ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="mb-3 flex justify-end">
                  <button type="button" onClick={() => setProfile((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }))} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><Trash2 size={12} /> Remove</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={inputClass(`projects.${index}.projectName`)} value={item.projectName} onChange={(e) => updateProject(index, 'projectName', e.target.value)} placeholder="Project Name" />
                  <input className={inputClass(`projects.${index}.techStack`)} value={item.techStack} onChange={(e) => updateProject(index, 'techStack', e.target.value)} placeholder="Tech Stack" />
                  <input className={inputClass(`projects.${index}.githubLink`)} value={item.githubLink} onChange={(e) => updateProject(index, 'githubLink', e.target.value)} placeholder="GitHub Link" />
                  <input className={inputClass(`projects.${index}.liveLink`)} value={item.liveLink} onChange={(e) => updateProject(index, 'liveLink', e.target.value)} placeholder="Live Link" />
                </div>
                <div className="mt-3">
                  <textarea className={textareaClass(`projects.${index}.description`)} rows={3} value={item.description} onChange={(e) => updateProject(index, 'description', e.target.value)} placeholder="Project Description" />
                </div>
              </div>
            ))}
            {profile.projects.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No projects added yet.</p>}
          </div>
        </section>

        <section className={`rounded-xl border p-5 ${isReview('skills') ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200 bg-white'}`}>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Skills (Categorized)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {['languages', 'frameworks', 'tools', 'databases', 'cloud', 'other'].map((category) => (
              <div key={category} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h3 className="mb-2 text-sm font-semibold capitalize text-slate-800">{category}</h3>
                <div className="mb-2 flex gap-2">
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    value={skillDraft[category]}
                    onChange={(e) => setSkillDraft((prev) => ({ ...prev, [category]: e.target.value }))}
                    placeholder="Type skill(s), comma separated"
                  />
                  <button type="button" onClick={() => addSkillCategory(category)} className="rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills[category] || []).map((item, index) => (
                    <span key={`${category}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-300">
                      {item}
                      <button type="button" onClick={() => removeSkillCategoryItem(category, index)} className="text-rose-600">x</button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Certifications</h2>
            <button type="button" onClick={() => setProfile((prev) => ({ ...prev, certifications: [...prev.certifications, emptyCertification()] }))} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><Plus size={14} /> Add</button>
          </div>
          <div className="space-y-3">
            {profile.certifications.map((item, index) => (
              <div key={`cert-${index}`} className={`rounded-lg border p-3 ${isRowReview(`certifications.${index}.`) ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="mb-3 flex justify-end">
                  <button type="button" onClick={() => setProfile((prev) => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }))} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><Trash2 size={12} /> Remove</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={inputClass(`certifications.${index}.name`)} value={item.name} onChange={(e) => updateCertification(index, 'name', e.target.value)} placeholder="Certification Name" />
                  <input className={inputClass(`certifications.${index}.issuer`)} value={item.issuer} onChange={(e) => updateCertification(index, 'issuer', e.target.value)} placeholder="Issuer" />
                  <input className={inputClass(`certifications.${index}.date`)} value={item.date} onChange={(e) => updateCertification(index, 'date', e.target.value)} placeholder="Date" />
                  <input className={inputClass(`certifications.${index}.link`)} value={item.link} onChange={(e) => updateCertification(index, 'link', e.target.value)} placeholder="Link" />
                </div>
              </div>
            ))}
            {profile.certifications.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No certifications added yet.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Achievements / Extra-curricular (Optional)</h2>
          <div className="mb-3 flex gap-2">
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500" value={achievementDraft} onChange={(e) => setAchievementDraft(e.target.value)} placeholder="Add achievement and press Add" />
            <button type="button" onClick={addAchievement} className="rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Add</button>
          </div>
          <ul className="space-y-2">
            {profile.achievements.map((item, index) => (
              <li key={`ach-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>{item}</span>
                <button type="button" onClick={() => removeAchievement(index)} className="text-rose-600"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-end pb-4">
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Master Profile
          </button>
        </div>
      </div>
    </div>
  )
}
