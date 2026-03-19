import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Briefcase, GraduationCap, Wrench, Award, FileText, Save, Download, Plus, Trash2, CheckCircle2, ChevronRight, Sparkles, Lightbulb, PenTool, ArrowLeft, Settings, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { supabase, isMock } from '../supabase'
import { resumeTemplates } from '../data/templates'
import { getDbUserId } from '../lib/userIdentity'
import ResumeRenderer from '../components/resume/ResumeRenderer'
import ATSChecker from '../components/ATSChecker'
import ATSRealtimePanel from '../components/resume/ATSRealtimePanel'

// Wizard Components
import PathSelection from '../components/build/PathSelection'
import WizardStep from '../components/build/WizardStep'
import SectionIntro from '../components/build/SectionIntro'
import TemplatePreview from '../components/build/TemplatePreview'
import { useToast } from '../context/ToastContext'
import { Search, Target, FileText as FileIcon } from 'lucide-react'

export default function Build() {
    const navigate = useNavigate()
    const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
    const [searchParams] = useSearchParams()
    const templateFromQuery = searchParams.get('template')
    const { user, resumeData, customization, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications, setJobDescription, selectedTemplate, setSelectedTemplate, editingResumeId, restoreUserFromFallback, setUser } = useStore()

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
    const [showBigPreview, setShowBigPreview] = useState(false)
    const [rightSidebarTab, setRightSidebarTab] = useState('preview') // 'preview', 'ats'
    const [isImporting, setIsImporting] = useState(false)

    const handleImportFromProfile = async () => {
        if (!user) {
            toastError('Please sign in to import your profile')
            return
        }

        setIsImporting(true)
        try {
            const dbUserId = getDbUserId(user)
            const { data, error } = await supabase
                .from('master_profiles')
                .select('*')
                .eq('user_id', dbUserId)
                .maybeSingle()

            if (error) throw error

            if (data) {
                // Update basic info
                updatePersonalInfo({
                    firstName: data.first_name || '',
                    lastName: data.last_name || '',
                    email: data.email || user.email || '',
                    phone: data.phone || '',
                    location: data.location || '',
                    title: data.title || '',
                    summary: data.summary || ''
                })

                // Load Experience if resume is empty or user confirms
                if (data.experience_data && Array.isArray(data.experience_data)) {
                    setExperience(data.experience_data)
                }

                // Load Education
                if (data.education_data && Array.isArray(data.education_data)) {
                    setEducation(data.education_data)
                }

                // Load Skills
                if (data.skills_data && Array.isArray(data.skills_data)) {
                    setSkills(data.skills_data)
                }

                toastSuccess('Everything imported from your Master Profile!')
            } else {
                toastInfo('No master profile found. Create one to enable 1-click building!')
            }
        } catch (err) {
            toastError('Import failed: ' + err.message)
        } finally {
            setIsImporting(false)
        }
    }

    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const isCompactRail = viewportWidth < 860
    const showPreviewPanel = viewportWidth >= 1100
    const railWidth = isCompactRail ? 92 : (viewportWidth < 1200 ? 240 : 280)
    const previewWidth = viewportWidth < 1400 ? 320 : 400
    const previewScale = Math.max(0.5, Math.min(0.74, (previewWidth - 28) / 816))

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

    const handleSave = async () => {
        setSaving(true)
        setStatusMessage('')
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
                    } else {
                        result = await supabase
                            .from('resumes')
                            .insert({
                                ...attemptPayload,
                                created_at: new Date().toISOString()
                            })
                    }

                    if (!result.error) {
                        return { error: null }
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

            let { error } = await saveWithAdaptiveColumns(Boolean(editingResumeId), payload)

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

            setSaveSuccess(true)
            setStatusType('success')
            setStatusMessage('Resume saved successfully.')
            toastSuccess('Resume saved successfully.')
            setTimeout(() => setSaveSuccess(false), 3000)
            return true
        } catch (error) {
            console.error('Error saving resume:', error)
            const message = (error && error.message) ? error.message : 'Failed to save progress'
            setStatusType('error')
            setStatusMessage(`Failed to save progress: ${message}`)
            toastError(`Failed to save progress: ${message}`)
            return false
        } finally {
            setSaving(false)
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
                    onClick={() => {
                        setRightSidebarTab('ats')
                        if (!showPreviewPanel) setShowATSChecker(true)
                    }}
                    className={`mt-6 w-full flex items-center gap-2 p-3 ${rightSidebarTab === 'ats' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'} rounded-xl font-bold text-xs uppercase tracking-widest transition-all`}
                    style={{ justifyContent: isCompactRail ? 'center' : 'flex-start', marginBottom: '1rem' }}
                    title="Analyze your resume with AI-powered ATS checker"
                >
                    <Zap size={14} className={rightSidebarTab === 'ats' ? 'text-amber-400' : ''} />
                    {!isCompactRail && 'ATS Score'}
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
                            {activeStep === 1 && <HeaderSection data={resumeData.personalInfo} update={updatePersonalInfo} onImport={handleImportFromProfile} isImporting={isImporting} supportsPhoto={currentTemplate?.supportsPhoto !== false} />}
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

            {/* 3. Live Preview Panel */}
            {showPreviewPanel && (
            <div style={{
                width: `${previewWidth}px`, background: '#f8fafc', borderLeft: '1.5px solid #f1f5f9',
                overflowY: 'auto', padding: '1.5rem', position: 'fixed', top: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', zIndex: 10
            }}>
                {/* Tabs for Sidebar */}
                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-8 self-center">
                    <button 
                        onClick={() => setRightSidebarTab('preview')}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${rightSidebarTab === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Live Preview
                    </button>
                    <button 
                        onClick={() => setRightSidebarTab('ats')}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${rightSidebarTab === 'ats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        ATS Checker
                    </button>
                </div>

                {rightSidebarTab === 'preview' ? (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
                        <div style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>REAL-TIME ENGINE</span>
                        </div>

                        <div style={{ 
                            position: 'relative', 
                            width: '100%', 
                            aspectRatio: '1/1.41', 
                            boxShadow: '0 32px 64px -16px rgba(0,0,0,0.12)', 
                            borderRadius: '12px', 
                            overflow: 'hidden', 
                            border: '1px solid #f1f5f9',
                            background: '#fff'
                        }}>
                            <div style={{ 
                                transform: `scale(${previewScale})`, 
                                transformOrigin: 'top left',
                                width: '794px',
                                height: '1123px',
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }}>
                                {activeTemplateId && (
                                    <ResumeRenderer data={resumeData} templateId={activeTemplateId} customization={{ ...customization, themeColor }} />
                                )}
                            </div>
                            
                            {/* Floating Actions on Bottom Left */}
                            <div className="absolute bottom-4 left-4 flex flex-col gap-3">
                                <button 
                                    onClick={() => setShowBigPreview(true)}
                                    className="w-8 h-8 bg-slate-900/90 text-white rounded-lg flex items-center justify-center shadow-xl hover:bg-black hover:scale-105 transition-all"
                                    title="Open Big Preview"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 w-full">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                            >
                                {saving ? 'Syncing...' : saveSuccess ? <><CheckCircle2 size={16} className="text-emerald-500" /> Saved</> : <><Save size={16} /> Save Draft</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                         {/* Job Description Input */}
                         <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                             <div className="flex items-center gap-2 mb-4">
                               <Target size={18} className="text-indigo-600" />
                               <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Job Description</h3>
                             </div>
                             <textarea 
                                value={resumeData.jobDescription || ''}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here to see keyword matches and ATS analysis..."
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-600 transition-all resize-none"
                             />
                             <p className="mt-2 text-[10px] font-bold text-slate-400 px-1">Keywords are automatically extracted from this text.</p>
                         </div>

                         {/* ATS Panel */}
                         <ATSRealtimePanel resumeData={resumeData} />
                    </div>
                )}
            </div>
            )}

            {/* ATS Checker Modal (Fallback for narrow screens) */}
            {showATSChecker && (
                <div className="fixed inset-0 z-[100] bg-slate-100 overflow-y-auto">
                    <div className="max-w-[1400px] mx-auto p-4 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={() => setShowATSChecker(false)} className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
                                <ArrowLeft size={16} /> Back to Builder
                            </button>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Full ATS Report</h2>
                            <div className="w-20" />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Target size={20} className="text-indigo-600" />
                                        <h3 className="font-black text-sm uppercase tracking-tight">Job Requirements</h3>
                                    </div>
                                    <textarea 
                                        value={resumeData.jobDescription || ''}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        placeholder="Paste the job description here..."
                                        className="w-full h-64 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-600 transition-all resize-none"
                                    />
                                </div>
                             </div>
                             <div className="lg:col-span-2">
                                <ATSRealtimePanel resumeData={resumeData} />
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Big Preview Modal */}
            <AnimatePresence>
                {showBigPreview && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
                        onClick={() => setShowBigPreview(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 40 }}
                            className="relative w-full max-w-5xl h-full bg-white rounded-[2.5rem] overflow-hidden shadow-[0_32px_120px_-20px_rgba(0,0,0,0.3)] border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-8 right-8 z-10">
                                <button 
                                    onClick={() => setShowBigPreview(false)}
                                    className="w-12 h-12 bg-white/80 backdrop-blur hover:bg-white text-slate-900 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 border border-slate-100"
                                >
                                    <ArrowLeft size={24} className="rotate-180" />
                                </button>
                            </div>
                            
                            <div className="w-full h-full overflow-y-auto p-12 flex justify-center bg-slate-50/50">
                                <div className="bg-white shadow-2xl origin-top mb-12" style={{ 
                                    width: '794px', 
                                    minHeight: '1123px',
                                    transform: viewportWidth < 1000 ? `scale(${(viewportWidth - 100) / 794})` : 'scale(1)'
                                }}>
                                    {activeTemplateId && (
                                        <ResumeRenderer data={resumeData} templateId={activeTemplateId} customization={{ ...customization, themeColor }} />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const HeaderSection = ({ data, update, supportsPhoto = true, onImport, isImporting }) => {
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
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <User size={18} className="text-indigo-600" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Personal Information</h3>
                </div>
                {onImport && (
                    <button 
                        onClick={onImport}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest border border-indigo-100/50"
                    >
                        {isImporting ? <div className="w-3 h-3 border-2 border-indigo-700 border-t-transparent animate-spin" /> : <Sparkles size={14} />}
                        Sync Master Profile
                    </button>
                )}
            </div>
            {supportsPhoto && (
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
            )}
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
