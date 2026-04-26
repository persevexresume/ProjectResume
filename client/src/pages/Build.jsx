import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Briefcase, GraduationCap, Wrench, Award, FileText, Save, Download, Trash2, CheckCircle2, ChevronRight, Sparkles, Lightbulb, PenTool, ArrowLeft, Settings, Zap, Search, Plus, Minus, X, Loader2 } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase, isMock } from '../supabase'
import { resumeTemplates } from '../data/templates'
import { getDbUserId } from '../lib/userIdentity'
import { isDbUuid } from '../lib/userIdentity'
import { getDbUserIdCandidates } from '../lib/userIdentity'
import * as resumeParser from '../lib/resumeParser'
import { withApiBase } from '../lib/apiBase'
import { RESUME_CONTENT_LIMITS } from '../lib/resumeConstraints'
import ResumeRenderer, { calculateATSScore } from '../components/resume/ResumeRenderer'
import ATSChecker from '../components/ATSChecker'

// Wizard Components
import PathSelection from '../components/builder/PathSelection'
import WizardStep from '../components/builder/WizardStep'
import SectionIntro from '../components/builder/SectionIntro'
import TemplatePreview from '../components/builder/TemplatePreview'
import { useToast } from '../context/ToastContext'

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

const ensureArray = (value) => Array.isArray(value) ? value : []
const MAX_SKILLS = RESUME_CONTENT_LIMITS.skills.maxItems
const MAX_SKILL_LENGTH = RESUME_CONTENT_LIMITS.skills.itemMax
const MAX_SUMMARY_LENGTH = RESUME_CONTENT_LIMITS.personal.summaryMax

export default function Build() {
    const navigate = useNavigate()
    const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
    const [searchParams] = useSearchParams()
    const templateFromQuery = searchParams.get('template')
    const forceNewFromQuery = searchParams.get('new') === '1'
    const { user, resumeData, customization, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications, selectedTemplate, setSelectedTemplate, editingResumeId, setEditingResumeId, restoreUserFromFallback, setUser, masterProfile, setMasterProfile, applyMasterProfile } = useStore()

    // Wizard State
    const [viewMode, setViewMode] = useState('selection') // 'selection', 'preview', 'intro', 'form'
    const [activeStep, setActiveStep] = useState(1)
    const [completedSteps, setCompletedSteps] = useState([])

    const [saving, setSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [statusType, setStatusType] = useState('info')
    const [themeColor, setThemeColor] = useState('#2563eb')
    const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
    const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight)
    const [showATSChecker, setShowATSChecker] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [showLivePreview] = useState(true)
    const [previewZoom, setPreviewZoom] = useState(1.1)

    useEffect(() => {
        const handleResize = () => {
            setViewportWidth(window.innerWidth)
            setViewportHeight(window.innerHeight)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const isCompactRail = viewportWidth < 860
    const canShowSidePreview = viewportWidth >= 1024

    const railWidth = isCompactRail ? 92 : 260
    // Keep preview comfortably readable on desktop while preserving workspace area.
    const previewWidthBuffer = (canShowSidePreview && showLivePreview) ? Math.max(420, Math.min(620, viewportWidth * 0.37)) : 0
    const previewWidth = previewWidthBuffer

    // Calculate scales for both width and height to ensure full visibility
    const horizontalScale = (previewWidth - 18) / PAGE_WIDTH
    // Reserve space for panel chrome (header, card spacing, and save panel)
    const availableHeight = Math.max(500, viewportHeight - 250)
    const verticalScale = availableHeight / PAGE_HEIGHT

    // Base fit scale from viewport constraints, with user zoom applied.
    const basePreviewScale = Math.max(0.34, Math.min(0.8, horizontalScale, verticalScale))
    const previewScale = Math.max(0.34, Math.min(0.95, basePreviewScale * previewZoom))

    useEffect(() => {
        const resolvedTemplateId = templateFromQuery || selectedTemplate

        if (forceNewFromQuery && editingResumeId) {
            setEditingResumeId(null)
        }

        if (templateFromQuery && templateFromQuery !== selectedTemplate) {
            const queryTemplate = resumeTemplates.find(t => t.id === templateFromQuery)
            if (queryTemplate) {
                setSelectedTemplate(templateFromQuery)
            }
        }

        if (editingResumeId) {
            setViewMode('form')
            setActiveStep(1)
        } else if (resolvedTemplateId) {
            // Go directly to form when a template is selected
            setViewMode('form')
            // Set theme color from template if available
            const template = resumeTemplates.find(t => t.id === resolvedTemplateId)
            if (template?.colors?.accent) {
                setThemeColor(template.colors.accent)
            }
        }
    }, [templateFromQuery, selectedTemplate, setSelectedTemplate, editingResumeId, forceNewFromQuery])

    useEffect(() => {
        const fetchMaster = async () => {
            const dbUserId = getDbUserId(user)
            if (!dbUserId || editingResumeId) return

            try {
                const localMaster = masterProfile ? resumeParser.normalizeMasterProfile(masterProfile) : null
                if (localMaster && resumeParser.calculateMasterProfileCompleteness(localMaster) > 0) {
                    const isEmpty = !resumeData.personalInfo.firstName && (!resumeData.experience || resumeData.experience.length === 0)
                    if (isEmpty) {
                        setMasterProfile(localMaster)
                        applyMasterProfile(localMaster)
                    }
                    return
                }

                try {
                    const apiResponse = await fetch(withApiBase(`/api/master-profile/${encodeURIComponent(dbUserId)}`))
                    if (apiResponse.ok) {
                        const payload = await apiResponse.json()
                        if (payload?.profile) {
                            const normalizedMaster = resumeParser.normalizeMasterProfile(payload.profile)
                            if (resumeParser.calculateMasterProfileCompleteness(normalizedMaster) > 0) {
                                const isEmpty = !resumeData.personalInfo.firstName && (!resumeData.experience || resumeData.experience.length === 0)
                                if (isEmpty) {
                                    setMasterProfile(normalizedMaster)
                                    applyMasterProfile(normalizedMaster)
                                }
                                return
                            }
                        }
                    }
                } catch (apiError) {
                    const message = String(apiError?.message || '')
                    if (!message.includes('404')) {
                        console.warn('Master profile API fetch failed, falling back to direct profile table:', apiError)
                    }
                }

                if (!isDbUuid(dbUserId)) {
                    return
                }

                // Use profiles as canonical profile source to avoid missing-table 404 noise.
                let { data, error } = await supabase
                    .from('profiles')
                    .select('master_profile, resume_data, first_name, last_name, email, phone, address, city, country, pin_code, title, summary, website, linkedin, github, experience_data, education_data, skills_data, projects_data, certifications_data')
                    .eq('user_id', dbUserId)
                    .single()

                if (!data) {
                    // Fallback 3: Latest resume from 'resumes' table
                    const { data: rData, error: rError } = await supabase
                        .from('resumes')
                        .select('data')
                        .eq('user_id', dbUserId)
                        .order('updated_at', { ascending: false })
                        .limit(1)
                        .single()
                    if (!rError && rData) {
                        data = { resume_data: rData.data }
                    }
                }

                if (data) {
                    if (data.master_profile) {
                        const rawMaster = typeof data.master_profile === 'string' ? JSON.parse(data.master_profile) : data.master_profile
                        const normalizedMaster = resumeParser.normalizeMasterProfile(rawMaster)
                        const isEmpty = !resumeData.personalInfo.firstName && (!resumeData.experience || resumeData.experience.length === 0)
                        if (isEmpty) {
                            setMasterProfile(normalizedMaster)
                            applyMasterProfile(normalizedMaster)
                        }
                        return
                    }

                    const parsed = data.resume_data
                        ? (typeof data.resume_data === 'string' ? JSON.parse(data.resume_data) : data.resume_data)
                        : {}
                    const mergedParsed = resumeParser.normalizeParsedResume(
                        resumeParser.mergeParsedResume(parsed, {
                            personalInfo: {
                                firstName: data.first_name || '',
                                lastName: data.last_name || '',
                                email: data.email || '',
                                phone: data.phone || '',
                                address: data.address || '',
                                city: data.city || '',
                                country: data.country || '',
                                pinCode: data.pin_code || '',
                                title: data.title || '',
                                summary: data.summary || '',
                                website: data.website || '',
                                linkedin: data.linkedin || '',
                                github: data.github || ''
                            },
                            experience: Array.isArray(data.experience_data) ? data.experience_data : [],
                            education: Array.isArray(data.education_data) ? data.education_data : [],
                            skills: Array.isArray(data.skills_data) ? data.skills_data : [],
                            projects: Array.isArray(data.projects_data) ? data.projects_data : [],
                            certifications: Array.isArray(data.certifications_data) ? data.certifications_data : []
                        })
                    )
                    // Only load if current resume data is empty to avoid overwriting user edits
                    const isEmpty = !resumeData.personalInfo.firstName && (!resumeData.experience || resumeData.experience.length === 0)
                    if (isEmpty) {
                        const mergedMaster = resumeParser.createMasterProfileFromParsed(mergedParsed)
                        setMasterProfile(mergedMaster)
                        applyMasterProfile(mergedMaster)
                    }
                }
            } catch (err) {
                console.error("Error fetching master profile:", err)
            }
        }
        fetchMaster()
    }, [user, editingResumeId, resumeData, masterProfile, setMasterProfile, applyMasterProfile])

    // Get the selected template from the templates data
    const activeTemplateId = templateFromQuery || selectedTemplate
    const currentTemplate = resumeTemplates.find(t => t.id === activeTemplateId)

    const steps = [
        {
            id: 1,
            label: 'Header',
            icon: <User size={18} />,
            title: "Let's start with your header",
            description: "Provide your basic contact information so employers know how to reach you.",
            hasIntro: false
        },
        {
            id: 2,
            label: 'Education',
            icon: <GraduationCap size={18} />,
            title: "Tell us about your education",
            description: "Include your degrees, schools, and any relevant academic honors.",
            hasIntro: true,
            intro: {
                title: "Education & Credentials",
                icon: GraduationCap,
                text: "Your academic background provides the foundation for your professional identity.",
                tips: [
                    "List your degrees in reverse chronological order.",
                    "Include any relevant certifications or professional development.",
                    "Mention high honors or a high GPA if you're a recent graduate."
                ]
            }
        },
        {
            id: 3,
            label: 'Experience',
            icon: <Briefcase size={18} />,
            title: "Describe your work history",
            description: "List your previous roles and key achievements.",
            hasIntro: true,
            intro: {
                title: "Work Experience",
                icon: Briefcase,
                text: "Your work history shows employers that you have the skills and experience to do the job.",
                tips: [
                    "Use strong action verbs like 'Managed', 'Developed', or 'Optimized'.",
                    "Focus on your measurable achievements (e.g., 'Increased sales by 20%').",
                    "Tailor your descriptions to the job you're applying for."
                ]
            }
        },
        {
            id: 4,
            label: 'Projects',
            icon: <FileText size={18} />,
            title: 'Showcase your key projects',
            description: 'Add your strongest project work with outcomes and links.',
            hasIntro: true,
            intro: {
                title: 'Projects',
                icon: PenTool,
                text: 'Projects make your resume concrete and prove what you can actually build or deliver.',
                tips: [
                    'Focus on impact and measurable outcomes.',
                    'Link to live demo or repository when possible.',
                    'Keep each project to 2-4 concise bullet points.'
                ]
            }
        },
        {
            id: 5,
            label: 'Skills',
            icon: <Wrench size={18} />,
            title: "What are your top skills?",
            description: "Highlight your technical and soft skills that match the job requirements.",
            hasIntro: true,
            intro: {
                title: "Core Skills",
                icon: Wrench,
                text: "Your skills section is a quick way for recruiters to see if you meet the requirements.",
                tips: [
                    "Mix technical 'hard' skills with interpersonal 'soft' skills.",
                    "Group similar skills together for better readability.",
                    "Only include skills that are relevant to the target position."
                ]
            }
        },
        {
            id: 6,
            label: 'Certifications',
            icon: <Award size={18} />,
            title: 'Add certifications',
            description: 'Include certifications that strengthen your role credibility.',
            hasIntro: false
        },
        {
            id: 7,
            label: 'Summary',
            icon: <FileText size={18} />,
            title: 'Professional Summary',
            description: 'A short paragraph that highlights your key strengths and career goals.',
            hasIntro: true,
            intro: {
                title: 'Professional Summary',
                icon: PenTool,
                text: "This is your elevator pitch. Make it count by summarizing your top value.",
                tips: [
                    'Keep it concise (3-5 lines is ideal).',
                    'Highlight 2-3 of your most impressive achievements.',
                    'Ensure it matches the tone of the job description.'
                ]
            }
        }
    ]

    const stepHelpers = {
        1: {
            title: 'What to do in Header',
            points: [
                'Add first name, last name, and a professional title.',
                'Fill email and phone so recruiters can contact you quickly.'
            ],
            tip: 'Keep details professional and consistent with LinkedIn.'
        },
        2: {
            title: 'What to do in Education',
            points: [
                'Add your latest degree first.',
                'Include institution and graduation date for each entry.'
            ],
            tip: 'Recent graduates can include GPA and honors.'
        },
        3: {
            title: 'What to do in Experience',
            points: [
                'Add role, company, and dates first.',
                'Write outcome-focused bullets in the description step.'
            ],
            tip: 'Use numbers where possible, for example "improved by 30%".'
        },
        4: {
            title: 'What to do in Projects',
            points: [
                'Add project name and your role.',
                'Describe impact and add repo/live links when available.'
            ],
            tip: 'Prioritize projects that match your target job.'
        },
        5: {
            title: 'What to do in Skills',
            points: [
                'Add role-relevant skills one by one.',
                'Keep only skills you can confidently discuss in interviews.'
            ],
            tip: 'Press Enter to add a skill quickly.'
        },
        6: {
            title: 'What to do in Certifications',
            points: [
                'Add certificate name and issuing organization.',
                'Include issue date and optional verification link.'
            ],
            tip: 'Only list active and relevant certifications.'
        },
        7: {
            title: 'What to do in Summary',
            points: [
                'Write 3-5 lines about your core strengths.',
                'Mention your domain, years of exposure, and top outcomes.'
            ],
            tip: 'Mirror keywords from your target job description.'
        }
    }

    const handlePathSelect = (path) => {
        if (path === 'create') {
            setViewMode('preview')
            setActiveStep(1)
        } else {
            navigate('/upload-resume')
        }
    }

    const handleSave = async (isAutoSave = false) => {
        if (!isAutoSave) {
            setSaving(true)
            setStatusMessage('')
        }
        try {
            let activeUser = user
            if (!activeUser) {
                restoreUserFromFallback()
                const fallback = localStorage.getItem('persevex_user')
                if (fallback) {
                    activeUser = JSON.parse(fallback)
                }
            }

            if (!activeUser) {
                const message = 'Please sign in to save your progress.'
                setStatusType('error')
                setStatusMessage(message)
                toastInfo(message)
                return false
            }

            const dbUserId = getDbUserId(activeUser)
            if (!dbUserId) {
                const message = 'Unable to identify your account. Please sign in again.'
                setStatusType('error')
                setStatusMessage(message)
                toastError(message)
                return false
            }

            const candidateUserIds = [...new Set([dbUserId, ...getDbUserIdCandidates(activeUser)])]
            const generatedResumeName = [
                String(resumeData?.personalInfo?.firstName || '').trim(),
                String(resumeData?.personalInfo?.lastName || '').trim()
            ].filter(Boolean).join(' ')
            const generatedResumeTitle = generatedResumeName ? `${generatedResumeName} Resume` : 'Untitled Resume'

            const payload = {
                user_id: dbUserId,
                data: resumeData,
                template_id: activeTemplateId,
                template: activeTemplateId,
                customization: customization,
                score: calculateATSScore(resumeData),
                updated_at: new Date().toISOString()
            }

            const saveWithAdaptiveColumns = async (isUpdate, initialPayload) => {
                const attemptPayload = { ...initialPayload }

                for (let attempt = 0; attempt < 6; attempt += 1) {
                    let result

                    if (isUpdate) {
                        result = await supabase
                            .from('resumes')
                            .update(attemptPayload)
                            .eq('id', editingResumeId)
                            .select('id')
                            .maybeSingle()

                        if (!result.error && !result.data) {
                            return { error: null, noRowsUpdated: true }
                        }
                    } else {
                        result = await supabase
                            .from('resumes')
                            .insert({
                                ...attemptPayload,
                                title: attemptPayload.title || generatedResumeTitle,
                                created_at: new Date().toISOString()
                            })
                            .select('id')
                            .single()
                    }

                    if (!result.error) {
                        return { error: null, noRowsUpdated: false, data: result.data }
                    }

                    const fullMessage = [result.error.message, result.error.details, result.error.hint].filter(Boolean).join(' | ')
                    const missingColumnMatch = fullMessage.match(/Could not find the '([^']+)' column/i) || fullMessage.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)

                    if (missingColumnMatch && attemptPayload[missingColumnMatch[1]] !== undefined) {
                        delete attemptPayload[missingColumnMatch[1]]

                        if (missingColumnMatch[1] === 'template_id' && attemptPayload.template === undefined) {
                            attemptPayload.template = activeTemplateId
                        }

                        continue
                    }

                    return { error: result.error }
                }

                return { error: { message: 'Save failed after multiple schema adaptation attempts.' } }
            }

            const runSaveAttempt = async (initialPayload, preferUpdate) => {
                let result = await saveWithAdaptiveColumns(preferUpdate, initialPayload)

                // Some environments return a "successful" update with zero affected rows.
                // In edit mode, immediately fall back to insert so the save is not lost.
                if (!result.error && preferUpdate && result.noRowsUpdated) {
                    result = await saveWithAdaptiveColumns(false, initialPayload)
                }

                return result
            }

            const startedAsUpdate = Boolean(editingResumeId)
            let { error, data } = await runSaveAttempt(payload, startedAsUpdate)

            if (!error && data?.id) {
                setEditingResumeId(data.id)
            }

            // Retry with alternate candidate IDs first for legacy identity mismatches.
            if (error && candidateUserIds.length > 1) {
                for (const candidateId of candidateUserIds) {
                    if (!candidateId || candidateId === payload.user_id) continue
                    const retryPayload = { ...payload, user_id: candidateId }
                    const retryResult = await runSaveAttempt(retryPayload, startedAsUpdate)
                    error = retryResult.error
                    data = retryResult.data
                    if (!error && data?.id) {
                        setEditingResumeId(data.id)
                    }
                    if (!error) break
                }
            }

            // If FK still fails, recover user_id from students table and retry once.
            if (error && /resumes_user_id_fkey|foreign key constraint/i.test([error.message, error.details, error.hint].filter(Boolean).join(' | ')) && activeUser?.email && !isMock) {
                const { data: studentRow } = await supabase
                    .from('students')
                    .select('id, email, name')
                    .eq('email', activeUser.email)
                    .single()

                if (studentRow?.id) {
                    const recoveredUser = {
                        ...activeUser,
                        uid: studentRow.id,
                        studentId: studentRow.id,
                        name: studentRow.name || activeUser.name,
                        email: studentRow.email || activeUser.email
                    }
                    setUser(recoveredUser)

                    const retryPayload = { ...payload, user_id: studentRow.id }
                    const retryResult = await runSaveAttempt(retryPayload, startedAsUpdate)
                    error = retryResult.error
                    data = retryResult.data
                    if (!error && data?.id) {
                        setEditingResumeId(data.id)
                    }
                }
            }

            if (error) {
                const details = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
                throw new Error(details || 'Unknown database error')
            }

            if (!isAutoSave) {
                setSaveSuccess(true)
                setStatusType('success')
                setStatusMessage('Resume saved successfully.')
                toastSuccess('Resume saved successfully.')
                setTimeout(() => setSaveSuccess(false), 3000)
            }
            return true
        } catch (error) {
            console.error('Error saving resume:', error)
            const message = (error && error.message) ? error.message : 'Failed to save progress'
            if (!isAutoSave) {
                setStatusType('error')
                setStatusMessage(`Failed to save progress: ${message}`)
                toastError(`Failed to save progress: ${message}`)
            }
            return false
        } finally {
            if (!isAutoSave) {
                setSaving(false)
            }
        }
    }

    const handleNext = async () => {
        // Mark step as completed in a race-safe way.
        setCompletedSteps((prev) => (prev.includes(activeStep) ? prev : [...prev, activeStep]))

        if (activeStep < steps.length) {
            const nextStep = activeStep + 1
            const nextStepData = steps.find(s => s.id === nextStep)

            if (nextStepData.hasIntro) {
                setViewMode('intro')
                setActiveStep(nextStep)
            } else {
                setViewMode('form')
                setActiveStep(nextStep)
            }
        } else {
            // Finalize flow
            const isSaved = await handleSave()
            if (isSaved) {
                navigate('/student')
            }
        }
    }

    const handleBack = () => {
        if (activeStep > 1) {
            const prevStep = activeStep - 1
            setViewMode('form') // Going back always goes to the form of previous step
            setActiveStep(prevStep)
        } else {
            setViewMode('selection')
        }
    }

    const handleIntroContinue = () => {
        setViewMode('form')
    }

    const handlePreviewContinue = () => {
        setViewMode('form')
    }

    const handlePreviewBack = () => {
        setViewMode('selection')
    }

    const handleJumpToStep = (stepId) => {
        const stepData = steps.find(s => s.id === stepId)
        if (stepData.hasIntro && !completedSteps.includes(stepId)) {
            setViewMode('intro')
        } else {
            setViewMode('form')
        }
        setActiveStep(stepId)
    }

    if (viewMode === 'selection') {
        return <PathSelection onSelect={handlePathSelect} />
    }

    if (viewMode === 'preview') {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
                <div style={{
                    flex: 1,
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    overflowY: 'auto'
                }}>
                    <TemplatePreview
                        template={currentTemplate}
                        onContinue={handlePreviewContinue}
                        onBack={handlePreviewBack}
                    />
                </div>
            </div>
        )
    }

    const currentStep = steps.find(s => s.id === activeStep) || steps[0]
    const currentStepHelper = stepHelpers[activeStep] || null
    const previewScalePercent = Math.round(previewScale * 100)
    const completionPercent = (() => {
        let count = 0;
        if (resumeData?.personalInfo?.firstName?.trim() || resumeData?.personalInfo?.email?.trim()) count++;
        if (resumeData?.education?.some(e => e.school?.trim() || e.degree?.trim())) count++;
        if (resumeData?.experience?.some(e => e.company?.trim() || e.role?.trim())) count++;
        if (resumeData?.projects?.some(p => p.name?.trim())) count++;
        if (resumeData?.skills?.length > 0 && resumeData.skills.some(s => s.name?.trim() || s.category?.trim())) count++;
        if (resumeData?.certifications?.some(c => c.name?.trim())) count++;
        if (resumeData?.personalInfo?.summary?.trim()) count++;
        return Math.min(100, Math.round((count / 7) * 100));
    })();
    const nextActionText = activeStep === steps.length
        ? 'Finalize Resume to save your work and return to Dashboard.'
        : viewMode === 'intro'
            ? 'Read the quick intro tips, then click Continue.'
            : 'Complete the current section, then click Continue.'

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
            {/* 1. Enhanced Navigation Rail */}
            <div style={{
                width: `${railWidth}px`, background: '#ffffff', display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', padding: '2rem 1.25rem', position: 'fixed', top: 0, bottom: 0, zIndex: 20,
                borderRight: '1.5px solid #f1f5f9', overflowY: 'auto'
            }}>
                {!isCompactRail && (
                    <div className="mb-8 ml-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Build Progress</span>
                    </div>
                )}

                {steps.map((step) => (
                    <div key={step.id} style={{ width: '100%', position: 'relative', marginBottom: '0.75rem' }}>
                        <button
                            onClick={() => handleJumpToStep(step.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${activeStep === step.id ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                            style={{ textAlign: 'left', justifyContent: isCompactRail ? 'center' : 'flex-start', padding: isCompactRail ? '0.75rem 0.5rem' : '0.75rem' }}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${activeStep === step.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : completedSteps.includes(step.id) ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {completedSteps.includes(step.id) && activeStep !== step.id ? <CheckCircle2 size={16} /> : step.id}
                            </div>
                            {!isCompactRail && (
                                <>
                                    <div className="flex flex-col">
                                        <span className={`text-[13px] font-black tracking-tight ${activeStep === step.id ? 'text-blue-600' : 'text-slate-600'}`}>{step.label}</span>
                                        {activeStep === step.id && <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Editing...</span>}
                                    </div>
                                    {activeStep === step.id && <ChevronRight size={14} className="ml-auto opacity-40" />}
                                </>
                            )}
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setShowATSChecker(true)}
                    className="mt-6 w-full flex items-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    style={{ justifyContent: isCompactRail ? 'center' : 'flex-start', marginBottom: '0.75rem' }}
                    title="Analyze your resume with AI-powered ATS checker"
                >
                    <Zap size={14} />
                    {!isCompactRail && 'ATS Check'}
                </button>

                <button
                    onClick={() => navigate('/student')}
                    className="mt-auto w-full flex items-center gap-2 p-3 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors"
                    style={{ justifyContent: isCompactRail ? 'center' : 'flex-start' }}
                >
                    <ArrowLeft size={14} />
                    {!isCompactRail && 'Exit Builder'}
                </button>
            </div>

            {/* 2. Main Workspace */}
            <div style={{
                marginLeft: `${railWidth}px`, marginRight: (canShowSidePreview && showLivePreview) ? `${previewWidth}px` : 0, flex: 1,
                padding: viewportWidth < 860 ? '2.5rem 1rem 1rem 1.25rem' : '3.5rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                transition: 'margin-right 0.3s ease-in-out'
            }}>


                {statusMessage && (
                    <div style={{
                        width: '100%',
                        marginBottom: '1rem',
                        borderRadius: '12px',
                        padding: '0.8rem 1rem',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        border: statusType === 'success' ? '1px solid #86efac' : '1px solid #fca5a5',
                        background: statusType === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: statusType === 'success' ? '#166534' : '#991b1b'
                    }}>
                        {statusMessage}
                    </div>
                )}
                {viewMode === 'intro' ? (
                    <SectionIntro
                        title={currentStep.intro.title}
                        introText={currentStep.intro.text}
                        tips={currentStep.intro.tips}
                        icon={currentStep.intro.icon}
                        onContinue={handleIntroContinue}
                    />
                ) : (
                    <WizardStep
                        title={currentStep.title}
                        description={currentStep.description}
                        helper={currentStepHelper}
                        sectionTag={`${currentStep.id}/${steps.length} · ${currentStep.label}`}
                        onNext={handleNext}
                        onBack={handleBack}
                        isFirst={activeStep === 1}
                        isLast={activeStep === steps.length}
                        nextLabel={activeStep === steps.length ? 'Finalize Resume' : 'Continue'}
                    >
                        <div className="p-2">
                            {activeStep === 1 && <HeaderSection data={resumeData.personalInfo} update={updatePersonalInfo} />}
                            {activeStep === 2 && <EducationSection education={resumeData.education} setEdu={setEducation} />}
                            {activeStep === 3 && <ExperienceSection experience={resumeData.experience} setExp={setExperience} />}
                            {activeStep === 4 && <ProjectsSection projects={resumeData.projects} setProjects={setProjects} />}
                            {activeStep === 5 && <SkillsSection skills={resumeData.skills} setSkills={setSkills} />}
                            {activeStep === 6 && <CertificationsSection certifications={resumeData.certifications} setCertifications={setCertifications} />}
                            {activeStep === 7 && <SummarySection data={resumeData.personalInfo} update={updatePersonalInfo} />}
                        </div>
                    </WizardStep>
                )}
            </div>

            {/* 3. Live Preview Panel */}
            {canShowSidePreview && showLivePreview && (
                <div style={{
                    width: `${previewWidth}px`, background: '#f1f5f9', borderLeft: '1px solid #e2e8f0',
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', zIndex: 10,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {/* Fixed Panel Header */}
                    <div style={{
                        padding: '1.5rem 1.25rem', background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        zIndex: 20
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 950, color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Preview Engine</span>
                        </div>

                        <div className="hidden lg:flex flex-col items-center flex-1 max-w-[220px] mx-6">
                            <div className="w-full flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                <span>Completion</span>
                                <span className={completionPercent === 100 ? "text-emerald-500" : "text-blue-600"}>{completionPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden shadow-inner">
                                <div className={`h-full transition-all duration-700 ease-out ${completionPercent === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]'}`} style={{ width: `${completionPercent}%` }} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <Zap size={13} className={calculateATSScore(resumeData) > 80 ? "text-emerald-500" : "text-amber-500"} />
                                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#445163', letterSpacing: '0.05em' }}>ATS:</span>
                                <span className={`text-[13px] font-black ${calculateATSScore(resumeData) > 80 ? "text-emerald-600" : "text-amber-600"}`}>{calculateATSScore(resumeData)}%</span>
                            </div>
                            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setPreviewZoom((prev) => Math.max(0.85, Number((prev - 0.08).toFixed(2))))}
                                    className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-600 flex items-center justify-center"
                                    title="Zoom out preview"
                                >
                                    <Minus size={13} />
                                </button>
                                <span style={{ minWidth: '44px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: '#334155', letterSpacing: '0.03em' }}>{previewScalePercent}%</span>
                                <button
                                    onClick={() => setPreviewZoom((prev) => Math.min(1.4, Number((prev + 0.08).toFixed(2))))}
                                    className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-600 flex items-center justify-center"
                                    title="Zoom in preview"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(true)}
                                className="p-3 bg-white text-slate-600 hover:text-blue-600 rounded-xl border border-slate-200 shadow-sm transition-all hover:scale-105"
                                title="Full screen preview"
                            >
                                <div className="relative">
                                    <Search size={18} strokeWidth={2.5} />
                                    <Plus size={9} strokeWidth={4} style={{ position: 'absolute', top: '-1px', right: '-4px' }} />
                                </div>
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {activeTemplateId && (
                            <div style={{
                                width: 'fit-content',
                                minWidth: `${Math.min(previewWidth - 20, PAGE_WIDTH * previewScale)}px`,
                                background: '#fff',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0,0,0,0.1)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <PagedResumePreview
                                    data={resumeData}
                                    templateId={activeTemplateId}
                                    customization={{ ...customization, themeColor }}
                                    previewScale={previewScale}
                                    paged={false}
                                />
                            </div>
                        )}
                    </div>

                    {/* Fixed Panel Footer (Save Action) */}
                    <div style={{
                        padding: '1.25rem', background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0',
                        zIndex: 20
                    }}>
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 p-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                        >
                            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : saveSuccess ? <><CheckCircle2 size={16} /> Cloud Synced</> : <><Save size={16} /> Save Progress Now</>}
                        </button>
                        <p className="text-center text-[9px] text-slate-400 mt-2.5 uppercase tracking-[0.2em] font-black">Your progress is automatically cached</p>
                    </div>
                </div>
            )}

            {/* ATS Checker Modal */}
            {showATSChecker && (
                <ATSChecker onClose={() => setShowATSChecker(false)} />
            )}

            {/* Centered Resume Preview Modal */}
            {showPreviewModal && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowPreviewModal(false)
                        }
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 120,
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                >
                    <div
                        style={{
                            width: 'min(980px, 92vw)',
                            height: '90vh',
                            background: '#fff',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 35px 80px -20px rgba(15, 23, 42, 0.6)',
                            border: '1px solid #dbeafe',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid #e2e8f0',
                            background: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Search size={16} color="#334155" />
                                    <Plus size={8} color="#334155" strokeWidth={3} style={{ position: 'absolute', top: '0px', right: '-1px' }} />
                                </span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    Resume Preview
                                </span>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '8px',
                                    background: '#eef2ff',
                                    color: '#4338ca',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #c7d2fe'
                                }}
                                title="Close preview"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9', padding: '3rem 1rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ pointerEvents: 'none', transformOrigin: 'top center' }}>
                                <PagedResumePreview
                                    data={resumeData}
                                    templateId={activeTemplateId}
                                    customization={{ ...customization, themeColor }}
                                    previewScale={0.9}
                                    paged={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const PagedResumePreview = ({ data, templateId, customization, previewScale, paged }) => {
    const measureRef = useRef(null)
    const [measuredHeight, setMeasuredHeight] = useState(PAGE_HEIGHT)

    useEffect(() => {
        const refreshPages = () => {
            const currentHeight = measureRef.current?.offsetHeight || PAGE_HEIGHT
            setMeasuredHeight(Math.max(currentHeight, PAGE_HEIGHT))
        }

        const frame = window.requestAnimationFrame(() => {
            refreshPages()
            window.setTimeout(refreshPages, 120)
        })

        return () => window.cancelAnimationFrame(frame)
    }, [data, templateId, customization, paged])

    return (
        <div style={{ position: 'relative' }}>
            {/* Hidden div to measure real resume height */}
            <div
                style={{ position: 'absolute', left: '-20000px', top: 0, width: `${PAGE_WIDTH}px`, visibility: 'hidden', pointerEvents: 'none' }}
                aria-hidden="true"
            >
                <div ref={measureRef}>
                    <ResumeRenderer data={data} templateId={templateId} customization={customization} />
                </div>
            </div>
            {/* Scaled visible preview */}
            <div style={{
                width: `${PAGE_WIDTH * previewScale}px`,
                height: `${measuredHeight * previewScale}px`,
                position: 'relative',
                background: '#fff',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
            }}>
                <div style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: `${PAGE_WIDTH}px`,
                    height: `${measuredHeight}px`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}>
                    <ResumeRenderer data={data} templateId={templateId} customization={customization} />
                </div>
            </div>
        </div>
    )
}

const HeaderSection = ({ data, update }) => {
    const photoInputRef = useRef(null)
    const handleChange = (field, value) => update({ ...data, [field]: value })

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                handleChange('profilePhoto', reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handlePhotoRemove = () => {
        handleChange('profilePhoto', '')
        if (photoInputRef.current) {
            photoInputRef.current.value = ''
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg">
                        {data.profilePhoto ? (
                            <img src={data.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={40} />
                            </div>
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
                        <PenTool size={20} />
                        <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                </div>
                <div>
                    <h4 className="text-sm font-black text-slate-900 mb-1">Profile Photo</h4>
                    <p className="text-[10px] font-medium text-slate-500 max-w-[200px]">Add a professional photo to increase your chances of being hired.</p>
                    {data.profilePhoto && (
                        <button
                            type="button"
                            onClick={handlePhotoRemove}
                            className="mt-2 inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                        >
                            <Trash2 size={12} />
                            Remove Photo
                        </button>
                    )}
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <InputField label="First Name" value={data.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="John" />
                <InputField label="Last Name" value={data.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Doe" />
            </div>
            <InputField label="Professional Title" value={data.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Software Engineer" style={{ marginBottom: '0.75rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <InputField label="Email" value={data.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="john@example.com" />
                <InputField label="Phone" value={data.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+1 (123) 456-7890" />
            </div>
            <InputField label="Location" value={data.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="City, Country" style={{ marginBottom: '0.75rem' }} />
            <InputField label="Website / Portfolio" value={data.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://yourportfolio.com" />
        </div>
    )
}

const ExperienceSection = ({ experience, setExp }) => {
    const [editingIdx, setEditingIdx] = useState(null)
    const [step, setStep] = useState(1) // 1: Basics, 2: Description
    const safeExperience = ensureArray(experience)

    const addExp = () => {
        setExp([...safeExperience, { role: '', company: '', startDate: '', endDate: '', description: '' }])
        setEditingIdx(safeExperience.length)
        setStep(1)
    }

    const updateExp = (field, value) => {
        if (editingIdx === null || !safeExperience[editingIdx]) return
        const updated = [...safeExperience]
        updated[editingIdx] = { ...updated[editingIdx], [field]: value }
        setExp(updated)
    }

    const removeExp = (idx) => {
        setExp(safeExperience.filter((_, i) => i !== idx))
        if (editingIdx === idx) {
            setEditingIdx(null)
            return
        }
        if (editingIdx !== null && editingIdx > idx) {
            setEditingIdx(editingIdx - 1)
        }
    }

    const closeEditor = () => {
        setEditingIdx(null)
        setStep(1)
    }

    if (editingIdx !== null && safeExperience[editingIdx]) {
        const item = safeExperience[editingIdx]
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>
                        {step === 1 ? "Job Details" : "Role Description"}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Step {step} of 2</span>
                        <button onClick={closeEditor} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                            Cancel
                        </button>
                    </div>
                </div>

                {step === 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <InputField label="What was your title?" value={item.role} onChange={(e) => updateExp('role', e.target.value)} placeholder="e.g. Senior Product Manager" />
                        <InputField label="Who did you work for?" value={item.company} onChange={(e) => updateExp('company', e.target.value)} placeholder="e.g. Acme Corp" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <InputField label="Start Date" value={item.startDate} onChange={(e) => updateExp('startDate', e.target.value)} placeholder="Jan 2020" />
                            <InputField label="End Date" value={item.endDate} onChange={(e) => updateExp('endDate', e.target.value)} placeholder="Present" />
                        </div>
                        <button onClick={() => setStep(2)} style={{ marginTop: '1rem', width: '100%', padding: '0.85rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                            Next: Add Description
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', minHeight: '350px' }}>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                            <h4 className="text-sm font-black text-blue-800 mb-1">What did you achieve?</h4>
                            <p className="text-xs font-medium text-blue-600/80">Focus on measurable results and action verbs. Bullet points are highly recommended.</p>
                        </div>
                        <InputField
                            label=""
                            value={item.description}
                            onChange={(e) => updateExp('description', e.target.value)}
                            placeholder="• Increased sales by 20%...\n• Managed a team of 5..."
                            multiline
                            rows={10}
                            style={{ height: '100%', flex: 1 }}
                        />
                        <div className="flex gap-3 mt-auto pt-4">
                            <button onClick={() => setStep(1)} style={{ padding: '0.85rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Back
                            </button>
                            <button onClick={closeEditor} style={{ flex: 1, padding: '0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Save Experience
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {safeExperience.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', borderRadius: '12px', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => setEditingIdx(idx)} className="hover:border-blue-300 hover:shadow-md group">
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{item.role || '(Not specified)'}</h4>
                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>{item.company} {item.startDate && `• ${item.startDate} - ${item.endDate}`}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); removeExp(idx); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingIdx(idx); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <PenTool size={16} />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={addExp} style={{ width: '100%', padding: '1.25rem', background: '#f8fafc', color: '#3b82f6', border: '2px dashed #cbd5e1', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }} className="hover:bg-blue-50 hover:border-blue-300">
                <Plus size={18} /> Add New Position
            </button>
        </div>
    )
}

const EducationSection = ({ education, setEdu }) => {
    const [editingIdx, setEditingIdx] = useState(null)
    const safeEducation = ensureArray(education)

    const addEdu = () => {
        setEdu([...safeEducation, { school: '', degree: '', endDate: '', gpa: '' }])
        setEditingIdx(safeEducation.length)
    }

    const updateEdu = (field, value) => {
        if (editingIdx === null || !safeEducation[editingIdx]) return
        const updated = [...safeEducation]
        updated[editingIdx] = { ...updated[editingIdx], [field]: value }
        setEdu(updated)
    }

    const removeEdu = (idx) => {
        setEdu(safeEducation.filter((_, i) => i !== idx))
        if (editingIdx === idx) {
            setEditingIdx(null)
            return
        }
        if (editingIdx !== null && editingIdx > idx) {
            setEditingIdx(editingIdx - 1)
        }
    }

    if (editingIdx !== null && safeEducation[editingIdx]) {
        const item = safeEducation[editingIdx]
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>Education Details</h3>
                    <button onClick={() => setEditingIdx(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Close</button>
                </div>
                <InputField label="School / University" value={item.school} onChange={(e) => updateEdu('school', e.target.value)} placeholder="e.g. Stanford University" />
                <InputField label="Degree & Major" value={item.degree} onChange={(e) => updateEdu('degree', e.target.value)} placeholder="e.g. B.S. Computer Science" />
                <InputField label="Graduation Date" value={item.endDate} onChange={(e) => updateEdu('endDate', e.target.value)} placeholder="e.g. May 2024" />
                <button onClick={() => setEditingIdx(null)} style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Save Education
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {safeEducation.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setEditingIdx(idx)} className="hover:border-blue-300 hover:shadow-md group transition-all">
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{item.school || '(Not specified)'}</h4>
                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>{item.degree} {item.endDate && `• ${item.endDate}`}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); removeEdu(idx); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={addEdu} style={{ width: '100%', padding: '1.25rem', background: '#f8fafc', color: '#3b82f6', border: '2px dashed #cbd5e1', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="hover:bg-blue-50 hover:border-blue-300 transition-all">
                <Plus size={18} /> Add Education
            </button>
        </div>
    )
}

const SkillsSection = ({ skills, setSkills }) => {
    const [newSkill, setNewSkill] = useState('')
    const safeSkills = ensureArray(skills)
    const remainingSkills = Math.max(0, MAX_SKILLS - safeSkills.length)

    const addSkill = () => {
        const nextSkill = newSkill.trim().slice(0, MAX_SKILL_LENGTH)
        if (nextSkill && safeSkills.length < MAX_SKILLS) {
            setSkills([...safeSkills, { name: nextSkill }])
            setNewSkill('')
        }
    }
    const removeSkill = (idx) => setSkills(safeSkills.filter((_, i) => i !== idx))

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 mb-1">Add a few key skills</h4>
                <p className="text-xs font-medium text-blue-600/80">List exact software, frameworks, and methodologies. Press Enter to add.</p>
                <p className="text-[11px] font-bold text-blue-700 mt-2">Limit: {MAX_SKILLS} skills total, {MAX_SKILL_LENGTH} characters each.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={newSkill} maxLength={MAX_SKILL_LENGTH} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="e.g. React, Agile, Python..." style={{ flex: 1, padding: '0.85rem 1rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }} className="focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                <button onClick={addSkill} disabled={safeSkills.length >= MAX_SKILLS} style={{ padding: '0 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: safeSkills.length >= MAX_SKILLS ? 'not-allowed' : 'pointer', opacity: safeSkills.length >= MAX_SKILLS ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-blue-600 transition-colors">
                    Add
                </button>
            </div>
            <p className="text-[11px] font-bold text-slate-500">{safeSkills.length}/{MAX_SKILLS} skills used • {remainingSkills} remaining</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {safeSkills.map((skill, idx) => (
                    <div key={idx} className="animate-in zoom-in-95 duration-200" style={{ background: '#1e293b', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {String(skill?.name || '').slice(0, MAX_SKILL_LENGTH)}
                        <button onClick={() => removeSkill(idx)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }} className="hover:bg-red-500 transition-colors">×</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

const ProjectsSection = ({ projects, setProjects }) => {
    const [editingIdx, setEditingIdx] = useState(null)
    const [step, setStep] = useState(1)
    const safeProjects = ensureArray(projects)

    const addProject = () => {
        setProjects([...safeProjects, { name: '', role: '', startDate: '', endDate: '', link: '', description: '' }])
        setEditingIdx(safeProjects.length)
        setStep(1)
    }

    const updateProject = (field, value) => {
        if (editingIdx === null || !safeProjects[editingIdx]) return
        const updated = [...safeProjects]
        updated[editingIdx] = { ...updated[editingIdx], [field]: value }
        setProjects(updated)
    }

    const removeProject = (idx) => {
        setProjects(safeProjects.filter((_, i) => i !== idx))
        if (editingIdx === idx) {
            setEditingIdx(null)
            return
        }
        if (editingIdx !== null && editingIdx > idx) {
            setEditingIdx(editingIdx - 1)
        }
    }

    const closeEditor = () => {
        setEditingIdx(null)
        setStep(1)
    }

    if (editingIdx !== null && safeProjects[editingIdx]) {
        const item = safeProjects[editingIdx]
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>
                        {step === 1 ? "Project Basics" : "Project Story"}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Step {step} of 2</span>
                        <button onClick={closeEditor} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Cancel</button>
                    </div>
                </div>

                {step === 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <InputField label="Project Name" value={item.name || ''} onChange={(e) => updateProject('name', e.target.value)} placeholder="e.g. AI Content Generator" />
                        <InputField label="Your Role" value={item.role || ''} onChange={(e) => updateProject('role', e.target.value)} placeholder="e.g. Lead Developer" />
                        <InputField label="Project Link / URL" value={item.link || ''} onChange={(e) => updateProject('link', e.target.value)} placeholder="e.g. https://github.com/..." />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <InputField label="Start Date" value={item.startDate || ''} onChange={(e) => updateProject('startDate', e.target.value)} placeholder="Jan 2023" />
                            <InputField label="End Date" value={item.endDate || ''} onChange={(e) => updateProject('endDate', e.target.value)} placeholder="Present" />
                        </div>
                        <button onClick={() => setStep(2)} style={{ marginTop: '1rem', width: '100%', padding: '0.85rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                            Next: Add Details
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', minHeight: '350px' }}>
                        <InputField
                            label="What was the project and its impact?"
                            value={item.description || ''}
                            onChange={(e) => updateProject('description', e.target.value)}
                            placeholder="• Built a scalable backend that handled 10k RPS...\n• Reduced load time by 30%..."
                            multiline
                            rows={10}
                            style={{ height: '100%', flex: 1 }}
                        />
                        <div className="flex gap-3 mt-auto pt-4">
                            <button onClick={() => setStep(1)} style={{ padding: '0.85rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>Back</button>
                            <button onClick={closeEditor} style={{ flex: 1, padding: '0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>Save Project</button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {safeProjects.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setEditingIdx(idx)} className="hover:border-blue-300 hover:shadow-md group transition-all">
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{item.name || '(Not specified)'}</h4>
                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>{item.role}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); removeProject(idx); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={addProject} style={{ width: '100%', padding: '1.25rem', background: '#f8fafc', color: '#3b82f6', border: '2px dashed #cbd5e1', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="hover:bg-blue-50 hover:border-blue-300 transition-all">
                <Plus size={18} /> Add Project
            </button>
        </div>
    )
}

const CertificationsSection = ({ certifications, setCertifications }) => {
    const [editingIdx, setEditingIdx] = useState(null)
    const safeCertifications = ensureArray(certifications)

    const addCertification = () => {
        setCertifications([...safeCertifications, { name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', link: '' }])
        setEditingIdx(safeCertifications.length)
    }

    const updateCertification = (field, value) => {
        if (editingIdx === null || !safeCertifications[editingIdx]) return
        const updated = [...safeCertifications]
        updated[editingIdx] = { ...updated[editingIdx], [field]: value }
        setCertifications(updated)
    }

    const removeCertification = (idx) => {
        setCertifications(safeCertifications.filter((_, i) => i !== idx))
        if (editingIdx === idx) {
            setEditingIdx(null)
            return
        }
        if (editingIdx !== null && editingIdx > idx) {
            setEditingIdx(editingIdx - 1)
        }
    }

    if (editingIdx !== null && safeCertifications[editingIdx]) {
        const item = safeCertifications[editingIdx]
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>Certification Details</h3>
                    <button onClick={() => setEditingIdx(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Close</button>
                </div>
                <InputField label="Certification Name" value={item.name || ''} onChange={(e) => updateCertification('name', e.target.value)} placeholder="e.g. AWS Certified Developer" />
                <InputField label="Issuing Organization" value={item.issuer || ''} onChange={(e) => updateCertification('issuer', e.target.value)} placeholder="e.g. Amazon Web Services" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InputField label="Issue Date" value={item.issueDate || ''} onChange={(e) => updateCertification('issueDate', e.target.value)} placeholder="e.g. Mar 2025" />
                    <InputField label="Expiry Date (Optional)" value={item.expiryDate || ''} onChange={(e) => updateCertification('expiryDate', e.target.value)} placeholder="e.g. Mar 2028" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InputField label="Credential ID" value={item.credentialId || ''} onChange={(e) => updateCertification('credentialId', e.target.value)} placeholder="e.g. ABC-123-XYZ" />
                    <InputField label="Verification Link" value={item.link || ''} onChange={(e) => updateCertification('link', e.target.value)} placeholder="e.g. https://..." />
                </div>
                <button onClick={() => setEditingIdx(null)} style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Save Certification
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {safeCertifications.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setEditingIdx(idx)} className="hover:border-blue-300 hover:shadow-md group transition-all">
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{item.name || '(Not specified)'}</h4>
                        <p style={{ margin: '0.2rem 0 0', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>{item.issuer}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); removeCertification(idx); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={addCertification} style={{ width: '100%', padding: '1.25rem', background: '#f8fafc', color: '#3b82f6', border: '2px dashed #cbd5e1', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="hover:bg-blue-50 hover:border-blue-300 transition-all">
                <Plus size={18} /> Add Certification
            </button>
        </div>
    )
}

const SummarySection = ({ data, update }) => {
    const handleChange = (field, value) => update({ ...data, [field]: value })
    const summaryValue = String(data.summary || '')
    return (
        <div className="flex flex-col gap-4 min-h-[400px]">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 mb-1">Professional Overview</h4>
                <p className="text-xs font-medium text-blue-600/80">A strong summary uses 3-4 lines to highlight your biggest accomplishments and core value proposition.</p>
                <p className="text-[11px] font-bold text-blue-700 mt-2">Limit: {MAX_SUMMARY_LENGTH} characters.</p>
            </div>
            <InputField
                label=""
                value={summaryValue}
                onChange={(e) => handleChange('summary', e.target.value.slice(0, MAX_SUMMARY_LENGTH))}
                placeholder="Results-driven professional with 5+ years of experience in..."
                multiline
                rows={12}
                maxLength={MAX_SUMMARY_LENGTH}
                style={{ flex: 1, minHeight: '300px' }}
            />
            <p className="text-[11px] font-bold text-slate-500 text-right">{summaryValue.length}/{MAX_SUMMARY_LENGTH}</p>
        </div>
    )
}

const InputField = ({ label, value, onChange, placeholder, multiline = false, rows = 1, maxLength, style }) => {
    const Component = multiline ? 'textarea' : 'input'
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', ...style }}>
            {label && <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', letterSpacing: '0.01em' }}>{label}</label>}
            <Component
                value={value ?? ''}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                maxLength={maxLength}
                style={{
                    width: '100%',
                    padding: multiline ? '1rem' : '0.8rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.25s ease',
                    fontFamily: 'inherit',
                    resize: 'none',
                    lineHeight: multiline ? 1.6 : 1,
                    ...(multiline ? { minHeight: '150px' } : {})
                }}
                className="focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
            />
        </div>
    )
}
