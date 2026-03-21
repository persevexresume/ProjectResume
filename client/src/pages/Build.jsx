import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Briefcase, GraduationCap, Wrench, Award, FileText, Save, Download, Trash2, CheckCircle2, ChevronRight, Sparkles, Lightbulb, PenTool, ArrowLeft, Settings, Zap, Search, Plus, X } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase, isMock } from '../supabase'
import { resumeTemplates } from '../data/templates'
import { getDbUserId } from '../lib/userIdentity'
import ResumeRenderer, { calculateATSScore } from '../components/resume/ResumeRenderer'
import ATSChecker from '../components/ATSChecker'

// Wizard Components
import PathSelection from '../components/builder/PathSelection'
import WizardStep from '../components/builder/WizardStep'
import SectionIntro from '../components/builder/SectionIntro'
import TemplatePreview from '../components/builder/TemplatePreview'
import { useToast } from '../context/ToastContext'

export default function Build() {
    const navigate = useNavigate()
    const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
    const [searchParams] = useSearchParams()
    const templateFromQuery = searchParams.get('template')
    const { user, resumeData, customization, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications, selectedTemplate, setSelectedTemplate, editingResumeId, setEditingResumeId, restoreUserFromFallback, setUser } = useStore()

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
    const [showATSChecker, setShowATSChecker] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)

    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const isCompactRail = viewportWidth < 860
    const showPreviewPanel = viewportWidth >= 1024
    
    const railWidth = isCompactRail ? 92 : 260
    // LockedinAI/ResumeNow style wide split screen:
    // User wants roughly 45-50% of the screen width for the live preview
    const previewWidth = showPreviewPanel ? Math.max(480, Math.floor((viewportWidth - railWidth) * 0.48)) : 0
    // The true A4 pixel width is ~816. We scale the preview exactly to the panel.
    const previewScale = Math.max(0.4, Math.min(1.0, (previewWidth - 48) / 816))

    // Real-Time Auto-Save Functionality (LockedInAI style)
    const initialRender = useRef(true)
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false
            return
        }
        if (viewMode === 'form' && selectedTemplate) {
            const timeout = setTimeout(() => {
                handleSave(true)
            }, 1200)
            return () => clearTimeout(timeout)
        }
    }, [resumeData, selectedTemplate, customization])

    useEffect(() => {
        const resolvedTemplateId = templateFromQuery || selectedTemplate

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
    }, [templateFromQuery, selectedTemplate, setSelectedTemplate, editingResumeId])

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
            id: 3,
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
            id: 4,
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
            id: 5,
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
            id: 6,
            label: 'Certs',
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

            const startedAsUpdate = Boolean(editingResumeId)
            let { error, noRowsUpdated, data } = await saveWithAdaptiveColumns(startedAsUpdate, payload)

            if (!error && startedAsUpdate && noRowsUpdated) {
                const insertResult = await saveWithAdaptiveColumns(false, payload)
                error = insertResult.error
                noRowsUpdated = insertResult.noRowsUpdated
                data = insertResult.data
            }

            if (!error && data?.id) {
                setEditingResumeId(data.id)
            }

            // If FK fails, recover user_id from students table and retry once.
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
                    const retryResult = await saveWithAdaptiveColumns(Boolean(editingResumeId), retryPayload)
                    error = retryResult.error
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
        // Mark step as completed
        if (!completedSteps.includes(activeStep)) {
            setCompletedSteps([...completedSteps, activeStep])
        }

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

    const currentStep = steps.find(s => s.id === activeStep)

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
                    style={{ justifyContent: isCompactRail ? 'center' : 'flex-start', marginBottom: '1rem' }}
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
                marginLeft: `${railWidth}px`, marginRight: showPreviewPanel ? `${previewWidth}px` : 0, flex: 1,
                padding: viewportWidth < 860 ? '1rem 1rem 1rem 1.25rem' : '2rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
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
                        onNext={handleNext}
                        onBack={handleBack}
                        isFirst={activeStep === 1}
                        isLast={activeStep === steps.length}
                        nextLabel={activeStep === steps.length ? 'Finalize Resume' : 'Continue'}
                    >
                        <div className="bg-white p-2">
                            {activeStep === 1 && <HeaderSection data={resumeData.personalInfo} update={updatePersonalInfo} />}
                            {activeStep === 2 && <ExperienceSection experience={resumeData.experience} setExp={setExperience} />}
                            {activeStep === 3 && <EducationSection education={resumeData.education} setEdu={setEducation} />}
                            {activeStep === 4 && <SkillsSection skills={resumeData.skills} setSkills={setSkills} />}
                            {activeStep === 5 && <ProjectsSection projects={resumeData.projects} setProjects={setProjects} />}
                            {activeStep === 6 && <CertificationsSection certifications={resumeData.certifications} setCertifications={setCertifications} />}
                            {activeStep === 7 && <SummarySection data={resumeData.personalInfo} update={updatePersonalInfo} />}
                        </div>
                    </WizardStep>
                )}
            </div>

            {/* 3. Live Preview Panel (ResumeNow / LockedInAI Layout) */}
            {showPreviewPanel && (
            <div style={{
                width: `${previewWidth}px`, background: '#f8fafc', borderLeft: '1.5px solid #e2e8f0',
                overflowY: 'auto', overflowX: 'hidden', padding: '2rem', position: 'fixed', top: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10
            }}>
                <div style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>REAL-TIME ENGINE</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 shadow-sm">
                        <Zap size={12} className={calculateATSScore(resumeData) > 80 ? "text-emerald-500" : "text-amber-500"} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#334155', letterSpacing: '0.05em' }}>ATS Score:</span>
                        <span className={`text-xs font-black ${calculateATSScore(resumeData) > 80 ? "text-emerald-600" : "text-amber-600"}`}>{calculateATSScore(resumeData)}%</span>
                    </div>
                </div>

                <div style={{
                    width: '100%',
                    boxShadow: '0 32px 64px -16px rgba(0,0,0,0.12)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #f1f5f9',
                    background: '#fff'
                }}>
                    {activeTemplateId && (
                        <PagedResumePreview
                            data={resumeData}
                            templateId={activeTemplateId}
                            customization={{ ...customization, themeColor }}
                            previewScale={previewScale}
                            paged={false}
                        />
                    )}
                    <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                        <button
                            onClick={() => setShowPreviewModal(true)}
                            className="w-14 h-14 bg-[#f7c66a] text-slate-900 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border border-amber-300"
                            title="Open full preview"
                        >
                            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Search size={24} strokeWidth={2.3} />
                                <Plus size={11} strokeWidth={3} style={{ position: 'absolute', top: '3px', right: '2px' }} />
                            </span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 w-full">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        {saving ? <><Zap size={14} className="animate-pulse text-blue-500"/> Auto-Saving...</> : saveSuccess ? <><CheckCircle2 size={16} className="text-emerald-500" /> Saved to Cloud</> : <><Save size={16} className="text-blue-500" /> Force Save</>}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-bold">Progress saves automatically</p>
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
                            maxHeight: '90vh',
                            background: '#fff',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 35px 80px -20px rgba(15, 23, 42, 0.6)',
                            border: '1px solid #dbeafe'
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

                        <PagedResumePreview
                            data={resumeData}
                            templateId={activeTemplateId}
                            customization={{ ...customization, themeColor }}
                            previewScale={0.82}
                            paged={true}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

const PagedResumePreview = ({ data, templateId, customization, previewScale, paged }) => {
    const PAGE_WIDTH = 794
    const PAGE_HEIGHT = 1123
    const measureRef = useRef(null)
    const [pageCount, setPageCount] = useState(1)

    useEffect(() => {
        const refreshPages = () => {
            const measuredHeight = measureRef.current?.offsetHeight || PAGE_HEIGHT
            const computedPages = Math.max(1, Math.ceil(measuredHeight / PAGE_HEIGHT))
            setPageCount(Math.min(computedPages, 8))
        }

        const frame = window.requestAnimationFrame(() => {
            refreshPages()
            window.setTimeout(refreshPages, 120)
        })

        return () => window.cancelAnimationFrame(frame)
    }, [data, templateId, customization, paged])

    if (!paged) {
        return (
            <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1/1.41',
                overflowY: 'auto',
                overflowX: 'hidden',
                background: '#fff'
            }}>
                <div style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: `${PAGE_WIDTH}px`,
                    minHeight: `${PAGE_HEIGHT}px`
                }}>
                    <ResumeRenderer data={data} templateId={templateId} customization={customization} />
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative', width: '100%', background: '#f8fafc' }}>
            {/* Hidden measuring render to detect required page count */}
            <div
                style={{ position: 'absolute', left: '-20000px', top: 0, width: `${PAGE_WIDTH}px`, visibility: 'hidden', pointerEvents: 'none' }}
                aria-hidden="true"
            >
                <div ref={measureRef}>
                    <ResumeRenderer data={data} templateId={templateId} customization={customization} />
                </div>
            </div>

            <div style={{ maxHeight: '72vh', overflowY: 'auto', padding: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', alignItems: 'center' }}>
                    {Array.from({ length: pageCount }).map((_, pageIndex) => (
                        <div
                            key={`preview-page-${pageIndex}`}
                            style={{
                                width: `${PAGE_WIDTH * previewScale}px`,
                                height: `${PAGE_HEIGHT * previewScale}px`,
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                background: '#fff',
                                boxShadow: '0 14px 28px -14px rgba(15, 23, 42, 0.5)'
                            }}
                        >
                            <div
                                style={{
                                    width: `${PAGE_WIDTH}px`,
                                    height: `${PAGE_HEIGHT}px`,
                                    transform: `scale(${previewScale})`,
                                    transformOrigin: 'top left',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ transform: `translateY(-${pageIndex * PAGE_HEIGHT}px)` }}>
                                    <ResumeRenderer data={data} templateId={templateId} customization={customization} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const HeaderSection = ({ data, update }) => {
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
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                </div>
                <div>
                    <h4 className="text-sm font-black text-slate-900 mb-1">Profile Photo</h4>
                    <p className="text-[10px] font-medium text-slate-500 max-w-[200px]">Add a professional photo to increase your chances of being hired.</p>
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
    const addExp = () => setExp([...experience, { role: '', company: '', startDate: '', endDate: '', description: '' }])
    const updateExp = (idx, field, value) => {
        const updated = [...experience]
        updated[idx][field] = value
        setExp(updated)
    }
    const removeExp = (idx) => setExp(experience.filter((_, i) => i !== idx))

    return (
        <div>
            {experience.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Position #{idx + 1}</h3>
                        <button onClick={() => removeExp(idx)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                            <Trash2 size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Remove
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <InputField label="Job Title" value={item.role} onChange={(e) => updateExp(idx, 'role', e.target.value)} placeholder="Product Manager" />
                        <InputField label="Company" value={item.company} onChange={(e) => updateExp(idx, 'company', e.target.value)} placeholder="Tech Corp" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <InputField label="Start Date" value={item.startDate} onChange={(e) => updateExp(idx, 'startDate', e.target.value)} placeholder="Jan 2020" />
                        <InputField label="End Date" value={item.endDate} onChange={(e) => updateExp(idx, 'endDate', e.target.value)} placeholder="Present" />
                    </div>
                </div>
            ))}
            <button onClick={addExp} style={{ width: '100%', padding: '0.75rem', background: '#ecfdf5', color: '#059669', border: '2px dashed #10b981', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                <Plus size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> Add Experience
            </button>
        </div>
    )
}

const EducationSection = ({ education, setEdu }) => {
    const addEdu = () => setEdu([...education, { school: '', degree: '', endDate: '', gpa: '' }])
    const updateEdu = (idx, field, value) => {
        const updated = [...education]
        updated[idx][field] = value
        setEdu(updated)
    }
    const removeEdu = (idx) => setEdu(education.filter((_, i) => i !== idx))

    return (
        <div>
            {education.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>School #{idx + 1}</h3>
                        <button onClick={() => removeEdu(idx)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                            <Trash2 size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Remove
                        </button>
                    </div>
                    <InputField label="School / University" value={item.school} onChange={(e) => updateEdu(idx, 'school', e.target.value)} placeholder="Stanford University" style={{ marginBottom: '0.5rem' }} />
                    <InputField label="Degree" value={item.degree} onChange={(e) => updateEdu(idx, 'degree', e.target.value)} placeholder="B.S. Computer Science" style={{ marginBottom: '0.5rem' }} />
                    <InputField label="Graduation Date" value={item.endDate} onChange={(e) => updateEdu(idx, 'endDate', e.target.value)} placeholder="May 2020" />
                </div>
            ))}
            <button onClick={addEdu} style={{ width: '100%', padding: '0.75rem', background: '#ecfdf5', color: '#059669', border: '2px dashed #10b981', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                <Plus size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> Add Education
            </button>
        </div>
    )
}

const SkillsSection = ({ skills, setSkills }) => {
    const [newSkill, setNewSkill] = useState('')
    const addSkill = () => {
        if (newSkill.trim()) {
            setSkills([...skills, { name: newSkill.trim() }])
            setNewSkill('')
        }
    }
    const removeSkill = (idx) => setSkills(skills.filter((_, i) => i !== idx))

    return (
        <div>
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
                <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSkill()} placeholder="e.g., React, PM..." style={{ flex: 1, padding: '0.6rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '0.85rem' }} />
                <button onClick={addSkill} style={{ padding: '0.6rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={16} />
                </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {skills.map((skill, idx) => (
                    <div key={idx} style={{ background: '#dbeafe', color: '#1e40af', padding: '0.35rem 0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, fontSize: '0.8rem' }}>
                        {skill.name}
                        <button onClick={() => removeSkill(idx)} style={{ background: 'transparent', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>×</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

const ProjectsSection = ({ projects, setProjects }) => {
    const addProject = () => setProjects([...(projects || []), { name: '', role: '', startDate: '', endDate: '', link: '', description: '' }])
    const updateProject = (idx, field, value) => {
        const updated = [...(projects || [])]
        updated[idx][field] = value
        setProjects(updated)
    }
    const removeProject = (idx) => setProjects((projects || []).filter((_, i) => i !== idx))

    return (
        <div>
            {(projects || []).map((project, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Project #{idx + 1}</h3>
                        <button onClick={() => removeProject(idx)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                            <Trash2 size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Remove
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <InputField label="Project Name" value={project.name || ''} onChange={(e) => updateProject(idx, 'name', e.target.value)} placeholder="Fraud Detection Dashboard" />
                        <InputField label="Role" value={project.role || ''} onChange={(e) => updateProject(idx, 'role', e.target.value)} placeholder="Lead Developer" />
                    </div>
                    <InputField label="Project Link" value={project.link || ''} onChange={(e) => updateProject(idx, 'link', e.target.value)} placeholder="https://github.com/..." style={{ marginBottom: '0.5rem' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <InputField label="Start Date" value={project.startDate || ''} onChange={(e) => updateProject(idx, 'startDate', e.target.value)} placeholder="Jan 2023" />
                        <InputField label="End Date" value={project.endDate || ''} onChange={(e) => updateProject(idx, 'endDate', e.target.value)} placeholder="Present" />
                    </div>
                    <InputField label="Description" value={project.description || ''} onChange={(e) => updateProject(idx, 'description', e.target.value)} placeholder="Built and deployed a dashboard that reduced fraud losses by 18%." multiline rows={3} />
                </div>
            ))}

            <button onClick={addProject} style={{ width: '100%', padding: '0.75rem', background: '#ecfdf5', color: '#059669', border: '2px dashed #10b981', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                <Plus size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> Add Project
            </button>
        </div>
    )
}

const CertificationsSection = ({ certifications, setCertifications }) => {
    const addCertification = () => setCertifications([...(certifications || []), { name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', link: '' }])
    const updateCertification = (idx, field, value) => {
        const updated = [...(certifications || [])]
        updated[idx][field] = value
        setCertifications(updated)
    }
    const removeCertification = (idx) => setCertifications((certifications || []).filter((_, i) => i !== idx))

    return (
        <div>
            {(certifications || []).map((cert, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Certification #{idx + 1}</h3>
                        <button onClick={() => removeCertification(idx)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                            <Trash2 size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Remove
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <InputField label="Certification Name" value={cert.name || ''} onChange={(e) => updateCertification(idx, 'name', e.target.value)} placeholder="AWS Certified Cloud Practitioner" />
                        <InputField label="Issuer" value={cert.issuer || ''} onChange={(e) => updateCertification(idx, 'issuer', e.target.value)} placeholder="Amazon Web Services" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <InputField label="Issue Date" value={cert.issueDate || ''} onChange={(e) => updateCertification(idx, 'issueDate', e.target.value)} placeholder="Mar 2025" />
                        <InputField label="Expiry Date (Optional)" value={cert.expiryDate || ''} onChange={(e) => updateCertification(idx, 'expiryDate', e.target.value)} placeholder="Mar 2028" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <InputField label="Credential ID" value={cert.credentialId || ''} onChange={(e) => updateCertification(idx, 'credentialId', e.target.value)} placeholder="ABC-123-XYZ" />
                        <InputField label="Verification Link" value={cert.link || ''} onChange={(e) => updateCertification(idx, 'link', e.target.value)} placeholder="https://..." />
                    </div>
                </div>
            ))}

            <button onClick={addCertification} style={{ width: '100%', padding: '0.75rem', background: '#ecfdf5', color: '#059669', border: '2px dashed #10b981', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                <Plus size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> Add Certification
            </button>
        </div>
    )
}

const SummarySection = ({ data, update }) => {
    const handleChange = (field, value) => update({ ...data, [field]: value })
    return (
        <InputField label="Professional Summary" value={data.summary} onChange={(e) => handleChange('summary', e.target.value)} placeholder="Brief overview of your professional background..." multiline rows={3} />
    )
}

const InputField = ({ label, value, onChange, placeholder, multiline = false, rows = 1, style }) => {
    const Component = multiline ? 'textarea' : 'input'
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', ...style }}>
            {label && <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.01em' }}>{label}</label>}
            <Component
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#1e293b',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    fontFamily: 'inherit',
                    resize: 'none'
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb'
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.08)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'
                    e.currentTarget.style.transform = 'translateY(0)'
                }}
            />
        </div>
    )
}
