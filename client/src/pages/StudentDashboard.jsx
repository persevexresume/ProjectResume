import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import useStore from '../store/useStore'
import {
    LayoutDashboard, FileText, Pickaxe, Clock, Star,
    Edit3, Trash2, Download as DownloadIcon, Plus,
    MoreVertical, Search, Filter, CheckCircle2, AlertCircle,
    User, Settings, LogOut, ChevronRight, Zap, Briefcase
} from 'lucide-react'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ResumeRenderer from '../components/resume/ResumeRenderer'
import { cn } from '../lib/utils'
import { getDbUserId } from '../lib/userIdentity'
import { downloadDocxResume } from '../lib/docxExport'
import { useToast } from '../context/ToastContext'

const getResumeTemplateId = (resume) => resume?.template_id || resume?.template || resume?.templateId || 'prof-sebastian'

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
    const navigate = useNavigate()

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

    const fetchResumes = async () => {
        try {
            const dbUserId = getDbUserId(user)
            if (!dbUserId) {
                setResumes([])
                return
            }

            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', dbUserId)
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
            const dbUserId = getDbUserId(user)
            if (!dbUserId) {
                setCoverLetters([])
                return
            }

            const { data, error } = await supabase
                .from('cover_letters')
                .select('*')
                .eq('user_id', dbUserId)
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
        
        try {
            // Short delay to ensure React has rendered the printable version
            await new Promise(resolve => setTimeout(resolve, 800))
            const element = document.getElementById('resume-preview-download')
            if (!element) throw new Error("Capture element not found")

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const imgProps = pdf.getImageProperties(imgData)
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`${resume.title || 'resume'}.pdf`)
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
        if (!window.confirm("Are you sure you want to delete this resume? This action cannot be undone.")) return
        
        setIsDeleting(resumeId)
        try {
            const { error } = await supabase
                .from('resumes')
                .delete()
                .eq('id', resumeId)

            if (!error) {
                setResumes(prev => prev.filter(r => r.id !== resumeId))
                if (previewResume && previewResume.id === resumeId) setPreviewResume(null)
            } else {
                alert("Failed to delete resume: " + error.message)
            }
        } catch (error) {
            console.error("Delete Error:", error)
        } finally {
            setIsDeleting(null)
        }
    }

    const handleDeleteCoverLetter = async (clId) => {
        if (!window.confirm("Are you sure you want to delete this cover letter? This action cannot be undone.")) return
        
        setIsDeleting(clId)
        try {
            const { error } = await supabase
                .from('cover_letters')
                .delete()
                .eq('id', clId)

            if (!error) {
                setCoverLetters(prev => prev.filter(cl => cl.id !== clId))
                if (previewCoverLetter && previewCoverLetter.id === clId) setPreviewCoverLetter(null)
            } else {
                alert("Failed to delete cover letter: " + error.message)
            }
        } catch (error) {
            console.error("Delete Error:", error)
        } finally {
            setIsDeleting(null)
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
        setDownloadTarget(coverLetter)
        setIsGenerating(true)
        try {
            // Wait for hidden capture div to render
            await new Promise(resolve => setTimeout(resolve, 800))
            const element = document.getElementById('cover-letter-preview-download')
            if (!element) throw new Error("Capture element not found")

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const imgProps = pdf.getImageProperties(imgData)
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`${coverLetter.title || 'cover-letter'}.pdf`)
            success('Cover letter downloaded as PDF!')
        } catch (err) {
            console.error("PDF Download Error:", err)
            showError("Failed to download PDF. Please try again.")
        } finally {
            setIsGenerating(false)
            setDownloadTarget(null)
        }
    }

    const filteredResumes = resumes.filter(r =>
        (r.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredCoverLetters = coverLetters.filter(cl =>
        (cl.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: resumes.length,
        avgScore: resumes.length > 0
            ? Math.round(resumes.reduce((acc, curr) => acc + (curr.score || 0), 0) / resumes.length)
            : 0,
        recentCount: resumes.filter(r => {
            const d = new Date(r.created_at)
            const now = new Date()
            return (now - d) < (7 * 24 * 60 * 60 * 1000)
        }).length
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50 text-[#1E293B] font-sans">

            <main className="max-w-[1400px] mx-auto px-6 pt-32 pb-12">
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
                                                onEdit={() => { loadResume(resume); navigate('/build'); }}
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
                                <div className="bg-white shadow-2xl w-full">
                                    <div className="a4-paper">
                                        <ResumeRenderer
                                            data={previewResume.data}
                                            templateId={getResumeTemplateId(previewResume)}
                                            customization={previewResume.customization}
                                        />
                                    </div>
                                </div>
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
                                        Created {new Date(previewCoverLetter.created_at).toLocaleDateString()}
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
                                <div className="bg-white shadow-2xl w-full">
                                    <CoverLetterContent data={previewCoverLetter.data} />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden Render Engine for PDFs */}
            {isGenerating && downloadTarget && (
                <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                    {/* Resume Capture */}
                    {(downloadTarget.template_id || downloadTarget.template) ? (
                        <div id="resume-preview-download" className="a4-paper" style={{ background: '#fff' }}>
                            <ResumeRenderer
                                data={downloadTarget.data}
                                templateId={getResumeTemplateId(downloadTarget)}
                                customization={downloadTarget.customization || {}}
                            />
                        </div>
                    ) : (
                        /* Cover Letter Capture */
                        <div id="cover-letter-preview-download" className="a4-paper" style={{ background: '#fff' }}>
                            <CoverLetterContent data={downloadTarget.data} />
                        </div>
                    )}
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
        </div>
    )
}

function CoverLetterContent({ data }) {
    if (!data) return null;
    return (
        <div style={{ padding: '20mm', fontFamily: 'Georgia, serif', fontSize: '12pt', lineHeight: 1.6, background: '#fff', color: '#000', textAlign: 'left' }}>
            {/* Sender Header */}
            <div style={{ marginBottom: '40px', borderBottom: '1px solid #000', paddingBottom: '20px' }}>
                <div style={{ fontSize: '18pt', fontWeight: 900 }}>{data.senderFirstName} {data.senderLastName}</div>
                <div style={{ color: '#000', fontSize: '10pt', marginTop: '5px' }}>
                    {data.senderEmail} {data.senderPhone && `| ${data.senderPhone}`}
                </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom: '30px', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ fontWeight: 700 }}>{data.recipientName}</div>
                <div>{data.recipientTitle}</div>
                <div style={{ fontWeight: 700 }}>{data.companyName}</div>
            </div>

            {/* Salutation */}
            <div style={{ marginBottom: '20px' }}>Dear {data.recipientName || 'Hiring Manager'},</div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'justify' }}>
                {data.openingParagraph && <p style={{ margin: 0 }}>{data.openingParagraph}</p>}
                {data.bodyParagraphs?.map((para, idx) => (
                    para && <p key={idx} style={{ margin: 0 }}>{para}</p>
                ))}
                {data.closingParagraph && <p style={{ margin: 0 }}>{data.closingParagraph}</p>}
            </div>

            {/* Sign-off */}
            <div style={{ marginTop: '60px' }}>
                <div style={{ marginBottom: '40px' }}>Sincerely,</div>
                <div style={{ fontWeight: 900, fontSize: '14pt' }}>{data.senderFirstName} {data.senderLastName}</div>
            </div>
        </div>
    );
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

function ResumeCard({ resume, idx, onEdit, onDelete, onDownload, onPreview, isDeleting, isEditing, editingTitle, onStartEdit, onSaveTitle, onCancelEdit, onTitleChange }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:border-indigo-100 h-full flex flex-col"
        >
            <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden group-hover:bg-indigo-50 transition-colors cursor-pointer border-b border-slate-50" onClick={onPreview}>
                {/* Resume Preview Thumbnail */}
                <div className="absolute inset-0 p-4 transition-opacity duration-300 group-hover:opacity-40">
                    {resume.data ? (
                        <div 
                            className="origin-top-left shadow-2xl" 
                            style={{ 
                                width: '816px', 
                                height: '1056px', 
                                transform: 'scale(0.34)', 
                                pointerEvents: 'none',
                                background: '#fff',
                                borderRadius: '4px'
                            }}
                        >
                            <ResumeRenderer 
                                data={resume.data} 
                                templateId={getResumeTemplateId(resume)}
                                customization={resume.customization || {}}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                            <FileText size={80} className="text-slate-300" />
                        </div>
                    )}
                </div>

                {/* Score Badge */}
                <div className="absolute top-4 right-4 z-10">
                    <div className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg",
                        (resume.score || 0) > 80 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    )}>
                        ATS Score: {resume.score || 0}%
                    </div>
                </div>

                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-indigo-900/60 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                        <Edit3 size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                        <DownloadIcon size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
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
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                        <button
                            onClick={onPreview}
                            className="text-[10px] font-black text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                        >
                            Preview Draft
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

function CoverLetterCard({ coverLetter, idx, onDelete, onDownload, onPreview, isDeleting, isEditing, editingTitle, onStartEdit, onSaveTitle, onCancelEdit, onTitleChange }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:border-emerald-100 h-full flex flex-col"
        >
            <div className="aspect-[4/5] bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden group-hover:from-emerald-100 group-hover:to-teal-100 transition-colors cursor-pointer border-b border-emerald-100 p-4 flex flex-col" onClick={onPreview}>
                {/* Text Preview */}
                <div className="absolute inset-0 p-4 overflow-hidden flex flex-col justify-start opacity-40 group-hover:opacity-60 transition-all pointer-events-none">
                    <p className="text-[10px] font-bold text-slate-700 mb-2 truncate">{coverLetter.data?.senderFirstName} {coverLetter.data?.senderLastName}</p>
                    <p className="text-[9px] text-slate-600 line-clamp-3">To: {coverLetter.data?.recipientName}</p>
                    <p className="text-[9px] text-slate-600 line-clamp-2">{coverLetter.data?.companyName}</p>
                    <div className="mt-2 pt-2 border-t border-slate-300">
                        <p className="text-[8px] text-slate-500 line-clamp-4 leading-tight">{coverLetter.data?.openingParagraph}</p>
                    </div>
                </div>

                {/* Icon Fallback */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-0 transition-all">
                    <Briefcase size={80} className="text-emerald-200 group-hover:text-emerald-300 transition-colors" />
                </div>

                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                        <DownloadIcon size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
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
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(coverLetter.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-emerald-600">Company: {coverLetter.data?.companyName || 'N/A'}</span>
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
