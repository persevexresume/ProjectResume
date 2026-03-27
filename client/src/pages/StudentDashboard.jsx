import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState, useRef } from 'react'
import useStore from '../store/useStore'
import {
    LayoutDashboard, FileText, Pickaxe, Clock, Star,
    Edit3, Trash2, Download as DownloadIcon, Plus,
    MoreVertical, Search, Filter, CheckCircle2, AlertCircle,
    User, Settings, LogOut, ChevronRight, Zap, Briefcase, Copy
} from 'lucide-react'
import { supabase } from '../supabase'
import ResumeRenderer, { calculateATSScore } from '../components/resume/ResumeRenderer';
import { cn } from '../lib/utils'
import { getDbUserId, getDbUserIdCandidates } from '../lib/userIdentity'
import { downloadDocxResume } from '../lib/docxExport'
import { exportElementToPaginatedPdf } from '../lib/pdfExport'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const getResumeTemplateId = (resume) => resume?.template_id || resume?.template || resume?.templateId || 'prof-sebastian'
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

const getObject = (value) => {
    if (!value) return {}
    if (typeof value === 'object') return value
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value)
            return parsed && typeof parsed === 'object' ? parsed : {}
        } catch {
            return {}
        }
    }
    return {}
}

const ensureArray = (value) => {
    if (Array.isArray(value)) return value
    return []
}

const normalizeSkills = (skills) => {
    const list = ensureArray(skills)
    return list
        .map((skill, index) => {
            if (typeof skill === 'string') {
                return { id: Date.now() + index, name: skill, level: 'Advanced' }
            }
            return {
                id: skill?.id || Date.now() + index,
                name: skill?.name || '',
                level: skill?.level || 'Advanced'
            }
        })
        .filter((skill) => skill.name)
}

const normalizeResumeData = (rawData) => {
    const source = getObject(rawData)
    const nested = getObject(source.resumeData)
    const data = Object.keys(nested).length ? nested : source
    const personalInfoSource = getObject(data.personalInfo || data.personal_info || data.profile)

    const mapExperience = (items) => ensureArray(items).map((item = {}) => {
        const details = ensureArray(item.details || item.highlights || item.responsibilities)
        const description = item.description || item.summary || details.join(' ')
        const startDate = item.startDate || item.from || item.start || ''
        const endDate = item.endDate || item.to || item.end || ''

        return {
            ...item,
            role: item.role || item.position || item.title || item.designation || '',
            company: item.company || item.organization || item.employer || '',
            date: item.date || [startDate, endDate].filter(Boolean).join(' - '),
            startDate,
            endDate,
            description: description || ''
        }
    })

    const mapEducation = (items) => ensureArray(items).map((item = {}) => ({
        ...item,
        degree: item.degree || item.program || item.qualification || item.course || '',
        institution: item.institution || item.school || item.college || item.university || '',
        year: item.year || item.endDate || item.graduationDate || ''
    }))

    const mapProjects = (items) => ensureArray(items).map((item = {}) => ({
        ...item,
        name: item.name || item.title || '',
        role: item.role || item.position || item.contribution || '',
        description: item.description || item.summary || ''
    }))

    const mapCertifications = (items) => ensureArray(items).map((item = {}) => ({
        ...item,
        name: item.name || item.title || item.certificate || '',
        issuer: item.issuer || item.organization || item.institution || '',
        issueDate: item.issueDate || item.date || item.year || ''
    }))

    const summary = data.summary || source.summary || personalInfoSource.summary || personalInfoSource.about || personalInfoSource.objective || ''

    const personalInfo = {
        ...personalInfoSource,
        firstName: personalInfoSource.firstName || personalInfoSource.first_name || '',
        lastName: personalInfoSource.lastName || personalInfoSource.last_name || '',
        email: personalInfoSource.email || '',
        title: personalInfoSource.title || personalInfoSource.headline || '',
        phone: personalInfoSource.phone || personalInfoSource.phoneNumber || personalInfoSource.mobile || '',
        summary,
        location: personalInfoSource.location || personalInfoSource.address || '',
        github: personalInfoSource.github || '',
        linkedin: personalInfoSource.linkedin || personalInfoSource.linkedIn || '',
        website: personalInfoSource.website || personalInfoSource.portfolio || '',
        profilePhoto: personalInfoSource.profilePhoto || personalInfoSource.photo || ''
    }

    const normalized = {
        ...data,
        personalInfo,
        summary,
        experience: mapExperience(data.experience || data.workExperience || data.work_experience),
        education: mapEducation(data.education),
        skills: normalizeSkills(data.skills),
        projects: mapProjects(data.projects),
        certifications: mapCertifications(data.certifications)
    }

    return normalized
}

const getResumeATSScore = (resume) => {
    const computed = calculateATSScore(resume.normalizedData || resume.data)
    return Number.isFinite(computed) ? computed : 0
}

export default function StudentDashboard() {
    const { user, clearUser, setTemplatesLocked, loadResume, resetResume } = useStore()
    const { success, error: showError } = useToast()
    const [resumes, setResumes] = useState([])
    const [coverLetters, setCoverLetters] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('resumes')
    const [isDeleting, setIsDeleting] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [editingType, setEditingType] = useState(null)
    const [newTitle, setNewTitle] = useState('')
    const [previewResume, setPreviewResume] = useState(null)
    const [previewCoverLetter, setPreviewCoverLetter] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: 'Please Confirm',
        message: '',
        danger: false,
        confirmLabel: 'Confirm',
        onConfirm: null
    })
    const navigate = useNavigate()

    const openConfirmDialog = ({ title, message, danger = false, confirmLabel = 'Confirm', onConfirm }) => {
        setConfirmDialog({
            open: true,
            title: title || 'Please Confirm',
            message,
            danger,
            confirmLabel,
            onConfirm
        })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }))
    }

    // Unlock templates and fetch resumes
    useEffect(() => {
        if (!user || user.role !== 'student') {
            navigate('/signin')
            return
        }

        setTemplatesLocked(false)
        fetchResumes()
        fetchCoverLetters()

        const dbUserId = getDbUserId(user)
        if (!dbUserId) return

        // Subscribe to resume changes
        const resumeSubscription = supabase
            .channel('resumes_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'resumes',
                filter: `user_id=eq.${dbUserId}`
            }, () => {
                fetchResumes()
            })
            .subscribe()

        // Subscribe to cover letter changes
        const clSubscription = supabase
            .channel('cover_letters_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'cover_letters',
                filter: `user_id=eq.${dbUserId}`
            }, () => {
                fetchCoverLetters()
            })
            .subscribe()

        return () => {
            resumeSubscription.unsubscribe()
            clSubscription.unsubscribe()
        }
    }, [user, navigate, setTemplatesLocked])

    const resolveUserIdCandidates = async () => {
        const baseCandidates = getDbUserIdCandidates(user)
        const unique = new Set(baseCandidates)

        const email = String(user?.email || '').trim()
        if (email) {
            try {
                const { data } = await supabase
                    .from('students')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle()

                if (data?.id) {
                    unique.add(String(data.id))
                }
            } catch {
                // Ignore lookup issues and continue with local candidates.
            }
        }

        return [...unique]
    }

    const fetchResumes = async () => {
        try {
            const candidates = await resolveUserIdCandidates()
            if (!candidates.length) {
                setResumes([])
                return
            }

            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .in('user_id', candidates)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setResumes(data)
            }
        } catch (err) {
            console.error("Fetch Error:", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchCoverLetters = async () => {
        try {
            const candidates = await resolveUserIdCandidates()
            if (!candidates.length) {
                setCoverLetters([])
                return
            }

            const { data, error } = await supabase
                .from('cover_letters')
                .select('*')
                .in('user_id', candidates)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setCoverLetters(data)
            }
        } catch (err) {
            console.error("Fetch Error:", err)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        clearUser()
        navigate('/signin?logout=1', { replace: true, state: { clearLogin: true } })
    }

    const [isGenerating, setIsGenerating] = useState(false)

    const [downloadTarget, setDownloadTarget] = useState(null)

    const handleDownload = async (resume) => {
        setDownloadTarget(resume)
        setIsGenerating(true)
        
        const elementId = `resume-container`
        
        try {
            // Short delay to ensure React has rendered the printable version
            await new Promise(resolve => setTimeout(resolve, 600))
            const element = document.getElementById(elementId)
            
            if (!element) {
                throw new Error("Could not find render element")
            }

            await exportElementToPaginatedPdf(element, `${resume.title || 'resume'}.pdf`)
            success('Resume downloaded as PDF!')
        } catch (err) {
            console.error("PDF Download Error:", err)
            showError("Failed to download PDF. Please try again.")
        } finally {
            setIsGenerating(false)
            setDownloadTarget(null)
        }
    }

    const handleDownloadWord = async (resume) => {
        try {
            await downloadDocxResume(resume.data, resume.title || 'resume')
            success('Resume downloaded as Word document!')
        } catch (err) {
            console.error("Word Download Error:", err)
            showError("Failed to download Word document. Please try again.")
        }
    }

    const handleDelete = async (resumeId) => {
        openConfirmDialog({
            title: 'Delete Resume',
            message: 'Are you sure you want to delete this resume? This action cannot be undone.',
            danger: true,
            confirmLabel: 'Yes, Delete',
            onConfirm: async () => {
                closeConfirmDialog()
                setIsDeleting(resumeId)
                try {
                    const { error } = await supabase
                        .from('resumes')
                        .delete()
                        .eq('id', resumeId)

                    if (!error) {
                        setResumes(prev => prev.filter(r => r.id !== resumeId))
                        if (previewResume && previewResume.id === resumeId) setPreviewResume(null)
                        success('Resume deleted successfully!')
                    } else {
                        showError("Failed to delete resume: " + error.message)
                    }
                } catch (error) {
                    console.error("Delete Error:", error)
                    showError('Failed to delete resume. Please try again.')
                } finally {
                    setIsDeleting(null)
                }
            }
        })
    }

    const handleDuplicate = async (resume) => {
        try {
            const dbUserId = getDbUserId(user)
            if (!dbUserId) throw new Error("User not authenticated")

            const { data, error } = await supabase
                .from('resumes')
                .insert({
                    user_id: dbUserId,
                    data: resume.data,
                    template: resume.template,
                    template_id: resume.template_id,
                    customization: resume.customization,
                    score: resume.score,
                    title: `${resume.title || 'Untitled'} (Copy)`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()

            if (error) {
                const attemptPayload = {
                    user_id: dbUserId,
                    data: resume.data,
                    template: resume.template,
                    customization: resume.customization,
                    title: `${resume.title || 'Untitled'} (Copy)`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
                const fallbackResult = await supabase
                    .from('resumes')
                    .insert(attemptPayload)
                    .select()
                
                if (fallbackResult.error) throw fallbackResult.error;
            }

            success('Resume duplicated successfully!')
            fetchResumes()
        } catch (error) {
            console.error("Duplicate Error:", error)
            showError("Failed to duplicate resume. Please try again.")
        }
    }

    const handleDeleteCoverLetter = async (clId) => {
        openConfirmDialog({
            title: 'Delete Cover Letter',
            message: 'Are you sure you want to delete this cover letter? This action cannot be undone.',
            danger: true,
            confirmLabel: 'Yes, Delete',
            onConfirm: async () => {
                closeConfirmDialog()
                setIsDeleting(clId)
                try {
                    const { error } = await supabase
                        .from('cover_letters')
                        .delete()
                        .eq('id', clId)

                    if (!error) {
                        setCoverLetters(prev => prev.filter(cl => cl.id !== clId))
                        if (previewCoverLetter && previewCoverLetter.id === clId) setPreviewCoverLetter(null)
                        success('Cover letter deleted successfully!')
                    } else {
                        showError("Failed to delete cover letter: " + error.message)
                    }
                } catch (error) {
                    console.error("Delete Error:", error)
                    showError('Failed to delete cover letter. Please try again.')
                } finally {
                    setIsDeleting(null)
                }
            }
        })
    }

    const handleDuplicateCoverLetter = async (cl) => {
        try {
            const dbUserId = getDbUserId(user)
            if (!dbUserId) throw new Error("User not authenticated")

            const { data, error } = await supabase
                .from('cover_letters')
                .insert({
                    user_id: dbUserId,
                    data: cl.data,
                    title: `${cl.title || 'Untitled'} (Copy)`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()

            if (error) throw error

            success('Cover letter duplicated successfully!')
            fetchCoverLetters()
        } catch (error) {
            console.error("Duplicate Error:", error)
            showError("Failed to duplicate cover letter. Please try again.")
        }
    }

    const handleStartEditTitle = (id, currentTitle, type) => {
        setEditingId(id)
        setEditingType(type)
        setNewTitle(currentTitle)
    }

    const handleSaveTitle = async () => {
        if (!newTitle.trim()) {
            showError('Title cannot be empty')
            return
        }

        try {
            const table = editingType === 'resume' ? 'resumes' : 'cover_letters'
            const { error } = await supabase
                .from(table)
                .update({ title: newTitle.trim(), updated_at: new Date().toISOString() })
                .eq('id', editingId)

            if (error) throw error

            // Update local state
            if (editingType === 'resume') {
                setResumes(prev => prev.map(r => r.id === editingId ? { ...r, title: newTitle.trim() } : r))
            } else {
                setCoverLetters(prev => prev.map(cl => cl.id === editingId ? { ...cl, title: newTitle.trim() } : cl))
            }

            success(`${editingType === 'resume' ? 'Resume' : 'Cover Letter'} renamed successfully!`)
            setEditingId(null)
            setEditingType(null)
            setNewTitle('')
        } catch (err) {
            showError(`Failed to rename: ${err.message}`)
        }
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditingType(null)
        setNewTitle('')
    }

    const handleCreateNew = () => {
        resetResume()
        navigate('/templates')
    }

    const handleDownloadCoverLetterPDF = async (coverLetter) => {
        setIsGenerating(true)
        try {
            const element = document.getElementById(`cover-letter-capture-${coverLetter.id}`)
            if (!element) throw new Error('Could not find cover letter render element')

            await exportElementToPaginatedPdf(element, `${coverLetter.title || 'cover-letter'}.pdf`)
            success('Cover letter downloaded as PDF!')
        } catch (err) {
            console.error("PDF Download Error:", err)
            showError("Failed to download PDF. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    const preparedResumes = useMemo(() => {
        return resumes.map((resume) => {
            const normalizedData = normalizeResumeData(resume.data)
            return {
                ...resume,
                _rawData: resume.data,      // keep original DB data for saving/editing
                data: normalizedData,
                customization: getObject(resume.customization),
                dynamicScore: calculateATSScore(normalizedData),
                normalizedData
            }
        })
    }, [resumes])

    const filteredResumes = preparedResumes.filter(r =>
        (r.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredCoverLetters = coverLetters.filter(cl =>
        (cl.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: preparedResumes.length,
        avgScore: preparedResumes.length > 0
            ? Math.round(preparedResumes.reduce((acc, curr) => acc + getResumeATSScore(curr), 0) / preparedResumes.length)
            : 0,
        recentCount: preparedResumes.filter(r => {
            const d = new Date(r.created_at)
            const now = new Date()
            return (now - d) < (7 * 24 * 60 * 60 * 1000)
        }).length
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50 text-[#1E293B] font-sans">

            <main className="max-w-[1400px] mx-auto px-6 pt-40 pb-12">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 leading-tight">
                            Welcome back, <span className="text-indigo-600">{user.name?.split(' ')[0] || 'Member'}!</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium max-w-2xl">
                            You have <span className="text-slate-900 font-bold">{resumes.length} professional resumes</span>. Ready to apply?
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/cover-letter"
                            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
                        >
                            <FileText size={18} />
                            Cover Letter
                        </Link>
                        <button
                            onClick={handleCreateNew}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
                        >
                            <Plus size={18} />
                            Create New Resume
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
                    <StatCard
                        icon={<FileText size={20} className="text-indigo-600" />}
                        label="Total Creations"
                        value={stats.total}
                        sub="Templates"
                        color="bg-indigo-50"
                    />
                    <StatCard
                        icon={<Zap size={20} className="text-amber-500" />}
                        label="Avg. Optimization"
                        value={`${stats.avgScore}%`}
                        sub="ATS Scoring"
                        color="bg-amber-50"
                    />
                    <StatCard
                        icon={<Clock size={20} className="text-emerald-500" />}
                        label="Recent Activity"
                        value={stats.recentCount}
                        sub="Last 7 Days"
                        color="bg-emerald-50"
                    />
                </div>

                {/* Resume Management Area */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    {/* Tab Navigation */}
                    <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 border-b-2 border-transparent">
                                <button
                                    onClick={() => setActiveTab('resumes')}
                                    className={`px-5 py-3 font-black text-sm uppercase tracking-wider transition-all ${
                                        activeTab === 'resumes'
                                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                                            : 'text-slate-500 border-b-2 border-transparent'
                                    }`}
                                >
                                    <FileText size={18} className="inline mr-2" />
                                    Resumes ({resumes.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('coverLetters')}
                                    className={`px-5 py-3 font-black text-sm uppercase tracking-wider transition-all ${
                                        activeTab === 'coverLetters'
                                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                                            : 'text-slate-500 border-b-2 border-transparent'
                                    }`}
                                >
                                    <Briefcase size={18} className="inline mr-2" />
                                    Cover Letters ({coverLetters.length})
                                </button>
                            </div>
                            <div className="hidden lg:flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronized Cloud Mode</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 pl-12 pr-6 py-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all w-full md:w-64"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 grayscale opacity-50">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="mb-4">
                                    <FileText size={48} className="text-slate-400" />
                                </motion.div>
                                <p className="font-bold text-slate-500">Retrieving your workspace...</p>
                            </div>
                        ) : activeTab === 'resumes' ? (
                            filteredResumes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                        <FileText size={40} className="text-slate-300" />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-2">No documents found</h4>
                                    <p className="text-slate-400 font-bold max-w-sm mx-auto">
                                        {searchQuery ? `No results for "${searchQuery}". Try a different name.` : "You haven't created any resumes yet. Let's build your first standout design!"}
                                    </p>
                                    {!searchQuery && (
                                        <button onClick={handleCreateNew} className="mt-8 text-indigo-600 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                            Browse templates <ChevronRight size={16} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                                    <AnimatePresence>
                                                        {filteredResumes.map((resume, idx) => (
                                            <ResumeCard
                                                key={resume.id}
                                                resume={resume}
                                                idx={idx}
                                                onEdit={() => {
                                                    // Load with normalized data but preserve original template/customization DB fields
                                                    loadResume({
                                                        ...resume,
                                                        data: resume.data,
                                                        customization: resume.customization,
                                                        template_id: resume.template_id,
                                                        template: resume.template,
                                                        templateId: resume.templateId
                                                    });
                                                    navigate('/build');
                                                }}
                                                onDelete={() => handleDelete(resume.id)}
                                                onDownload={() => handleDownload(resume)}
                                                onPreview={() => setPreviewResume(resume)}
                                                isDeleting={isDeleting === resume.id}
                                                isEditing={editingId === resume.id && editingType === 'resume'}
                                                editingTitle={newTitle}
                                                onStartEdit={() => handleStartEditTitle(resume.id, resume.title || 'Untitled Resume', 'resume')}
                                                onSaveTitle={handleSaveTitle}
                                                onCancelEdit={handleCancelEdit}
                                                onTitleChange={setNewTitle}
                                                onDuplicate={() => handleDuplicate(resume)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )
                        ) : (
                            filteredCoverLetters.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                                        <Briefcase size={40} className="text-emerald-300" />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-2">No cover letters found</h4>
                                    <p className="text-slate-400 font-bold max-w-sm mx-auto">
                                        {searchQuery ? `No results for "${searchQuery}". Try a different name.` : "You haven't created any cover letters yet. Let's create your first one!"}
                                    </p>
                                    {!searchQuery && (
                                        <Link to="/cover-letter" className="mt-8 text-emerald-600 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                            Create cover letter <ChevronRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                                    <AnimatePresence>
                                        {filteredCoverLetters.map((cl, idx) => (
                                            <CoverLetterCard
                                                key={cl.id}
                                                coverLetter={cl}
                                                idx={idx}
                                                onDelete={() => handleDeleteCoverLetter(cl.id)}
                                                onDownload={() => handleDownloadCoverLetterPDF(cl)}
                                                onPreview={() => setPreviewCoverLetter(cl)}
                                                isDeleting={isDeleting === cl.id}
                                                isEditing={editingId === cl.id && editingType === 'coverLetter'}
                                                editingTitle={newTitle}
                                                onStartEdit={() => handleStartEditTitle(cl.id, cl.title || 'Untitled Cover Letter', 'coverLetter')}
                                                onSaveTitle={handleSaveTitle}
                                                onCancelEdit={handleCancelEdit}
                                                onTitleChange={setNewTitle}
                                                onDuplicate={() => handleDuplicateCoverLetter(cl)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>

            {/* Full Preview Modal for Resume */}
            <AnimatePresence>
                {previewResume && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/90 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">{previewResume.title || 'Resume Preview'}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Last updated {new Date(previewResume.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleDownload(previewResume)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        <DownloadIcon size={18} /> Download PDF
                                    </button>
                                    <button
                                        onClick={() => handleDownloadWord(previewResume)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                                    >
                                        <DownloadIcon size={18} /> Download Word
                                    </button>
                                    <button
                                        onClick={() => { loadResume(previewResume); navigate('/build'); }}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                                    >
                                        <Edit3 size={18} /> Edit
                                    </button>
                                    <button
                                        onClick={() => setPreviewResume(null)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        <Plus size={24} className="rotate-45" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-4 sm:p-8 md:p-12 bg-slate-50 flex justify-center">
                                <SavedResumePreview
                                    resume={previewResume}
                                    templateId={getResumeTemplateId(previewResume)}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Preview Modal for Cover Letter */}
            <AnimatePresence>
                {previewCoverLetter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/90 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">{previewCoverLetter.title || 'Cover Letter Preview'}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Created {new Date(previewCoverLetter.created_at).toLocaleString('en-US', { 
                                            year: 'numeric', 
                                            month: '2-digit', 
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleDownloadCoverLetterPDF(previewCoverLetter)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                                    >
                                        <DownloadIcon size={18} /> Download PDF
                                    </button>
                                    <button
                                        onClick={() => setPreviewCoverLetter(null)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        <Plus size={24} className="rotate-45" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-4 sm:p-8 md:p-12 bg-slate-50 flex justify-center">
                                <div className="bg-white shadow-2xl w-full p-12" id={`cover-letter-capture-${previewCoverLetter.id}`} style={{ fontFamily: 'Georgia, serif', fontSize: '12pt', lineHeight: 1.6 }}>
                                    {/* Sender Header */}
                                    <div style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                                        <div style={{ fontSize: '18pt', fontWeight: 900 }}>{previewCoverLetter.data.senderFirstName} {previewCoverLetter.data.senderLastName}</div>
                                        <div style={{ color: '#666', fontSize: '10pt', marginTop: '5px' }}>
                                            {previewCoverLetter.data.senderEmail} {previewCoverLetter.data.senderPhone && `| ${previewCoverLetter.data.senderPhone}`}
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div style={{ marginBottom: '30px', fontWeight: 600 }}>
                                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>

                                    {/* Recipient */}
                                    <div style={{ marginBottom: '40px' }}>
                                        <div style={{ fontWeight: 700 }}>{previewCoverLetter.data.recipientName}</div>
                                        <div>{previewCoverLetter.data.recipientTitle}</div>
                                        <div style={{ fontWeight: 700 }}>{previewCoverLetter.data.companyName}</div>
                                    </div>

                                    {/* Salutation */}
                                    <div style={{ marginBottom: '20px' }}>Dear {previewCoverLetter.data.recipientName || 'Hiring Manager'},</div>

                                    {/* Content */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'justify' }}>
                                        {previewCoverLetter.data.openingParagraph && <p style={{ margin: 0 }}>{previewCoverLetter.data.openingParagraph}</p>}
                                        {previewCoverLetter.data.bodyParagraphs?.map((para, idx) => (
                                            para && <p key={idx} style={{ margin: 0 }}>{para}</p>
                                        ))}
                                        {previewCoverLetter.data.closingParagraph && <p style={{ margin: 0 }}>{previewCoverLetter.data.closingParagraph}</p>}
                                    </div>

                                    {/* Sign-off */}
                                    <div style={{ marginTop: '60px' }}>
                                        <div style={{ marginBottom: '40px' }}>Sincerely,</div>
                                        <div style={{ fontWeight: 900, fontSize: '14pt' }}>{previewCoverLetter.data.senderFirstName} {previewCoverLetter.data.senderLastName}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden Render Engine for PDFs - Only active when downloading */}
            {isGenerating && (downloadTarget || previewResume) && (
                <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', opacity: 1, pointerEvents: 'none', zIndex: -1 }}>
                    <div
                        id="resume-container"
                        style={{
                            background: '#fff',
                            width: '794px',
                            maxWidth: '794px',
                            height: 'auto',
                            minHeight: '1123px',
                            aspectRatio: 'auto',
                            margin: 0,
                            padding: 0,
                            overflow: 'visible'
                        }}
                    >
                        <ResumeRenderer
                            data={downloadTarget?.data || previewResume?.data}
                            templateId={getResumeTemplateId(downloadTarget || previewResume)}
                            customization={downloadTarget?.customization || previewResume?.customization}
                        />
                    </div>
                </div>
            )}

            {/* Global Loader for heavy actions */}
            {isGenerating && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Zap className="text-indigo-600" size={40} />
                        </motion.div>
                        <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Generating Premium PDF...</p>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                danger={confirmDialog.danger}
                confirmLabel={confirmDialog.confirmLabel}
                cancelLabel="Cancel"
                onCancel={closeConfirmDialog}
                onConfirm={() => confirmDialog.onConfirm?.()}
            />
        </div>
    )
}

function SavedResumePreview({ resume, templateId }) {
    const measureRef = useRef(null)
    const [pageOffsets, setPageOffsets] = useState([0])
    const [previewScale, setPreviewScale] = useState(0.7)

    const PAGE_TOP_MARGIN = 28
    const PAGE_BOTTOM_MARGIN = 24
    const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_TOP_MARGIN - PAGE_BOTTOM_MARGIN

    const computeSmartPageOffsets = (container) => {
        if (!container) return [0]

        const contentHeight = Math.max(
            PAGE_HEIGHT,
            container.scrollHeight || 0,
            container.offsetHeight || 0
        )

        const rootTop = container.getBoundingClientRect().top
        const blockNodes = Array.from(container.querySelectorAll('section, article, h1, h2, h3, h4, h5, p, li, div'))

        const blockStarts = blockNodes
            .map((node) => {
                const rect = node.getBoundingClientRect()
                return Math.max(0, Math.floor(rect.top - rootTop))
            })
            .filter((value) => Number.isFinite(value) && value > 0 && value < contentHeight)
            .sort((a, b) => a - b)

        const offsets = [0]
        const maxPages = 12
        const minContentChunk = Math.floor(CONTENT_HEIGHT * 0.62)
        const cutoffPadding = 20

        while (offsets.length < maxPages) {
            const start = offsets[offsets.length - 1]
            const idealEnd = start + CONTENT_HEIGHT
            if (idealEnd >= contentHeight) break

            const searchMin = start + minContentChunk
            const searchMax = idealEnd - cutoffPadding
            const candidates = blockStarts.filter((pos) => pos > searchMin && pos <= searchMax)

            let nextOffset = idealEnd
            if (candidates.length > 0) {
                nextOffset = candidates[candidates.length - 1]
            }

            if (nextOffset <= start + 120) {
                nextOffset = idealEnd
            }

            offsets.push(nextOffset)
        }

        return offsets
    }

    useEffect(() => {
        const refreshPages = () => {
            const measuredNode = measureRef.current
            const nextOffsets = computeSmartPageOffsets(measuredNode)
            setPageOffsets(nextOffsets)
        }

        const frame = window.requestAnimationFrame(() => {
            refreshPages()
            window.setTimeout(refreshPages, 120)
        })

        return () => window.cancelAnimationFrame(frame)
    }, [resume, templateId])

    useEffect(() => {
        const updateScale = () => {
            const maxWidth = window.innerWidth < 768 ? window.innerWidth - 72 : 860
            const nextScale = Math.max(0.32, Math.min(1, maxWidth / PAGE_WIDTH))
            setPreviewScale(nextScale)
        }

        updateScale()
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [])

    return (
        <div className="w-full flex justify-center">
            <div
                style={{
                    position: 'absolute',
                    left: '-20000px',
                    top: 0,
                    width: `${PAGE_WIDTH}px`,
                    visibility: 'hidden',
                    pointerEvents: 'none'
                }}
                aria-hidden="true"
            >
                <div ref={measureRef}>
                    <ResumeRenderer
                        data={resume?.data}
                        templateId={templateId}
                        customization={resume?.customization}
                    />
                </div>
            </div>

            <div className="w-full max-h-full overflow-y-auto">
                <div className="flex flex-col items-center gap-6 pb-4">
                    {pageOffsets.map((offset, pageIndex) => (
                        <div
                            key={`saved-preview-page-${pageIndex}-${offset}`}
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
                                <div
                                    style={{
                                        position: 'relative',
                                        width: `${PAGE_WIDTH}px`,
                                        height: `${PAGE_HEIGHT}px`,
                                        background: '#fff',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: `${PAGE_TOP_MARGIN}px`,
                                            left: 0,
                                            width: `${PAGE_WIDTH}px`,
                                            height: `${CONTENT_HEIGHT}px`,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ transform: `translateY(-${offset}px)` }}>
                                            <ResumeRenderer
                                                data={resume?.data}
                                                templateId={templateId}
                                                customization={resume?.customization}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, sub, color }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", color)}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-0.5">{label}</p>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{sub}</span>
                </div>
            </div>
        </motion.div>
    )
}

function LazyResumeThumbnail({ resume }) {
    const containerRef = useRef(null)
    const viewportRef = useRef(null)
    const [shouldRender, setShouldRender] = useState(false)
    const [scale, setScale] = useState(0.22)

    useEffect(() => {
        const node = viewportRef.current
        if (!node) return

        const updateScale = () => {
            const maxWidth = node.clientWidth
            const maxHeight = node.clientHeight
            if (!maxWidth || !maxHeight) return

            const widthScale = maxWidth / 794
            const heightScale = maxHeight / 1123
            const nextScale = Math.max(0.2, Math.min(widthScale, heightScale) * 0.96)
            setScale(nextScale)
        }

        updateScale()

        const resizeObserver = new ResizeObserver(() => updateScale())
        resizeObserver.observe(node)

        return () => resizeObserver.disconnect()
    }, [])

    useEffect(() => {
        const node = containerRef.current
        if (!node) return

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries
                if (entry?.isIntersecting) {
                    setShouldRender(true)
                    observer.disconnect()
                }
            },
            {
                root: null,
                rootMargin: '250px',
                threshold: 0.05
            }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    return (
        <div ref={containerRef} className="absolute inset-0 p-3">
            <div ref={viewportRef} className="w-full h-full rounded-lg overflow-hidden bg-white border border-slate-100 shadow-sm relative">
                {shouldRender ? (
                    <div
                        className="absolute"
                        style={{
                            width: '794px',
                            height: '1123px',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            transformOrigin: 'center center',
                            pointerEvents: 'none'
                        }}
                    >
                        <ResumeRenderer
                            data={resume.data}
                            templateId={getResumeTemplateId(resume)}
                            customization={resume.customization}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                        <FileText size={52} />
                    </div>
                )}
            </div>
        </div>
    )
}

function ResumeCard({ resume, idx, onEdit, onDelete, onDownload, onPreview, isDeleting, isEditing, editingTitle, onStartEdit, onSaveTitle, onCancelEdit, onTitleChange, onDuplicate }) {
    const dynamicScore = getResumeATSScore(resume)

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:border-indigo-100 h-full flex flex-col"
        >
            <div className="aspect-[210/297] bg-slate-50 relative overflow-hidden group-hover:bg-indigo-50 transition-colors cursor-pointer border-b border-slate-50" onClick={onPreview}>
                <LazyResumeThumbnail resume={resume} />

                <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-0 transition-all pointer-events-none">
                    <FileText size={80} className="text-slate-200" />
                </div>

                {/* Score Badge */}
                <div className="absolute top-4 right-4 z-10">
                    <div className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg",
                        dynamicScore > 80 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    )}>
                        ATS Score: {dynamicScore}%
                    </div>
                </div>
            </div>

            {/* Content info */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                    {isEditing ? (
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => onTitleChange(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm font-bold text-slate-900 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSaveTitle()
                                    if (e.key === 'Escape') onCancelEdit()
                                }}
                            />
                        </div>
                    ) : (
                        <h4 className="text-base font-black text-slate-900 truncate mb-0.5 cursor-pointer hover:text-indigo-600" onClick={onStartEdit}>{resume.title || 'Untitled Resume'}</h4>
                    )}
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(resume.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-indigo-600">{getResumeTemplateId(resume)?.split('-')[0]}</span>
                    </div>
                </div>

                {isEditing ? (
                    <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center gap-2">
                        <button
                            onClick={onSaveTitle}
                            className="flex-1 text-[9px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors uppercase"
                        >
                            Save
                        </button>
                        <button
                            onClick={onCancelEdit}
                            className="flex-1 text-[9px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors uppercase"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 pt-3 border-t border-slate-50">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <button
                                onClick={onEdit}
                                className="w-11 h-11 bg-white text-indigo-600 rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg border border-indigo-100"
                                title="Edit resume"
                            >
                                <Edit3 size={18} />
                            </button>
                            <button
                                onClick={onDownload}
                                className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg"
                                title="Download resume"
                            >
                                <DownloadIcon size={18} />
                            </button>
                            <button
                                onClick={onDuplicate}
                                className="w-11 h-11 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg border border-slate-200"
                                title="Duplicate resume"
                            >
                                <Copy size={18} />
                            </button>
                            <button
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="w-11 h-11 bg-rose-600 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                title="Delete resume"
                            >
                                {isDeleting ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                        <Clock size={16} />
                                    </motion.div>
                                ) : (
                                    <Trash2 size={18} />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                onClick={onPreview}
                                className="text-[10px] font-black text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                            >
                                Preview Draft
                            </button>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

function CoverLetterCard({ coverLetter, idx, onDelete, onDownload, onPreview, isDeleting, isEditing, editingTitle, onStartEdit, onSaveTitle, onCancelEdit, onTitleChange, onDuplicate }) {
    // Parse cover letter data properly
    let clData = coverLetter.data
    if (typeof clData === 'string') {
        try {
            clData = JSON.parse(clData)
        } catch (e) {
            clData = {}
        }
    }
    
    const senderName = `${clData?.senderFirstName || ''} ${clData?.senderLastName || ''}`.trim()
    const recipientName = clData?.recipientName || 'Hiring Manager'
    const companyName = clData?.companyName || 'Company'
    const openingText = clData?.openingParagraph || ''
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:border-emerald-100 h-full flex flex-col"
        >
            <div className="aspect-[4/5] bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden group-hover:from-emerald-100 group-hover:to-teal-100 transition-colors cursor-pointer border-b border-emerald-100 p-4 flex flex-col" onClick={onPreview}>
                {/* Text Preview - Always visible, more visible on hover */}
                <div className="absolute inset-0 p-4 overflow-hidden flex flex-col justify-start opacity-70 group-hover:opacity-100 transition-all pointer-events-none">
                    {senderName && <p className="text-[10px] font-bold text-slate-700 mb-2 truncate">{senderName}</p>}
                    <p className="text-[9px] text-slate-600 line-clamp-1">To: {recipientName}</p>
                    <p className="text-[9px] text-slate-600 line-clamp-1 font-semibold">{companyName}</p>
                    {openingText && (
                        <div className="mt-2 pt-2 border-t border-slate-300">
                            <p className="text-[8px] text-slate-500 line-clamp-5 leading-tight">{openingText}</p>
                        </div>
                    )}
                </div>

                {/* Icon Fallback - only show if no opening text */}
                {!openingText && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-0 transition-all">
                        <Briefcase size={80} className="text-emerald-200 group-hover:text-emerald-300 transition-colors" />
                    </div>
                )}

                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} title="Download PDF" className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                        <DownloadIcon size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicate" className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                        <Copy size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete" className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Content info */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                    {isEditing ? (
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => onTitleChange(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSaveTitle()
                                    if (e.key === 'Escape') onCancelEdit()
                                }}
                            />
                        </div>
                    ) : (
                        <h4 className="text-base font-black text-slate-900 truncate mb-0.5 cursor-pointer hover:text-emerald-600" onClick={onStartEdit}>{coverLetter.title || 'Untitled Cover Letter'}</h4>
                    )}
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                            <Clock size={10} /> 
                            {new Date(coverLetter.created_at).toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            })}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600">Company: {companyName || 'N/A'}</span>
                    </div>
                </div>

                {isEditing ? (
                    <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center gap-2">
                        <button
                            onClick={onSaveTitle}
                            className="flex-1 text-[9px] font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg transition-colors uppercase"
                        >
                            Save
                        </button>
                        <button
                            onClick={onCancelEdit}
                            className="flex-1 text-[9px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors uppercase"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center justify-between">
                        <button
                            onClick={onPreview}
                            className="text-[10px] font-black text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-wider"
                        >
                            View Letter
                        </button>
                        <div className="flex items-center gap-2">
                            {isDeleting ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                    <Clock size={16} className="text-slate-300" />
                                </motion.div>
                            ) : (
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
