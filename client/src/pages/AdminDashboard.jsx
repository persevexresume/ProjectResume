import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { UserPlus, Users, Trash2, ShieldCheck, Mail, Lock, User, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2, Pencil } from 'lucide-react'
import useStore from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { supabase, isMock } from '../supabase'
import Papa from 'papaparse'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function AdminDashboard() {
    const { user, setUser } = useStore()
    const navigate = useNavigate()
    const [students, setStudents] = useState([])
    const [activeTab, setActiveTab] = useState('single')
    const [newStudent, setNewStudent] = useState({ id: '', email: '', password: '', name: '' })
    const [editingStudent, setEditingStudent] = useState(null)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null })
    const fileInputRef = useRef(null)

    const openConfirmDialog = (message, onConfirm) => {
        setConfirmDialog({ open: true, message, onConfirm })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog({ open: false, message: '', onConfirm: null })
    }

    // Refetch students function that can be called from anywhere
    const refetchStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching students:', error)
                return
            }

            if (data) {
                setStudents(data)
                console.log('Students refreshed:', data.length)
            }
        } catch (err) {
            console.error('Fetch students error:', err)
        }
    }

    const handleLogout = () => {
        setUser(null)
        navigate('/signin')
    }

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/signin')
            return
        }

        // Initial fetch
        refetchStudents()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('public:students')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'students'
                },
                (payload) => {
                    console.log('Student change detected:', payload.eventType)
                    // Refetch all students to stay in sync
                    refetchStudents()
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status)
            })

        return () => {
            channel.unsubscribe()
        }
    }, [user, navigate])

    const handleCreateStudent = async (e) => {
        if (e) e.preventDefault()

        if (editingStudent) {
            await handleUpdateStudent()
            return
        }

        if (!newStudent.name || !newStudent.email || !newStudent.password) {
            setError('Full Name, Email, and Password are required.')
            return
        }

        setIsCreating(true)
        const createdAt = new Date()
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 2)

        // Generate unique ID from email (use email as the unique identifier)
        const studentId = newStudent.email.split('@')[0] || newStudent.email

        try {
            // Insert into students table
            const { error: dbError } = await supabase
                .from('students')
                .insert([{
                    id: studentId,
                    name: newStudent.name,
                    email: newStudent.email,
                    password: String(newStudent.password),
                    created_at: createdAt.toISOString(),
                    expires_at: expiresAt.toISOString()
                }])

            if (!dbError) {
                setNewStudent({ id: '', email: '', password: '', name: '' })
                showSuccess('Student account created successfully!')
                await refetchStudents()
            } else {
                showError(dbError.message || 'Error creating student account.')
            }
        } catch (err) {
            console.error("Database Error:", err)
            showError('Error creating student account.')
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdateStudent = async () => {
        setIsCreating(true)
        try {
            const { error } = await supabase
                .from('students')
                .update({
                    name: newStudent.name || '',
                    email: newStudent.email || '',
                    password: String(newStudent.password)
                })
                .eq('id', editingStudent)

            if (!error) {
                setNewStudent({ id: '', email: '', password: '', name: '' })
                setEditingStudent(null)
                showSuccess('Student details updated successfully!')
                await refetchStudents()
            } else {
                showError(error.message || 'Error updating student account.')
            }
        } catch (err) {
            console.error("Update Error:", err)
            showError('Error updating student account.')
        } finally {
            setIsCreating(false)
        }
    }

    const startEditing = (stu) => {
        setActiveTab('single')
        setEditingStudent(stu.id)
        setNewStudent({
            id: stu.id,
            name: stu.name || '',
            email: stu.email || '',
            password: stu.password || ''
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEditing = () => {
        setEditingStudent(null)
        setNewStudent({ id: '', email: '', password: '', name: '' })
    }

    const showSuccess = (msg) => {
        setSuccess(msg)
        setError('')
        setTimeout(() => setSuccess(''), 5000)
    }

    const showError = (msg) => {
        setError(msg)
        setSuccess('')
        setTimeout(() => setError(''), 5000)
    }

    const handleDeleteStudent = async (studentId) => {
        openConfirmDialog(`Permanently remove access for student ID: ${studentId}?`, async () => {
            closeConfirmDialog()
        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId)

            if (!error) {
                showSuccess('Student deleted successfully!')
                // Refetch immediately to remove student from list
                await refetchStudents()
            } else {
                showError(error.message || 'Failed to delete student.')
            }
        } catch (err) {
            console.error("Database Delete Error:", err)
            showError('Failed to delete student.')
        }
        })
    }

    const handleSyncAdmin = async () => {
        try {
            const { data, error } = await supabase
                .from('admins')
                .insert([{
                    id: 'admin@gmail.com',
                    password: 'admin@123',
                    email: 'admin@gmail.com',
                    name: 'Main Administrator'
                }], { onConflict: 'id' })

            if (!error) {
                showSuccess('Admin account synced successfully!')
            } else {
                showError(error.message || 'Cloud synchronization failed.')
            }
        } catch (err) {
            console.error("Database Sync Error:", err)
            showError('Cloud synchronization failed.')
        }
    }

    const downloadSample = () => {
        const headers = ["StudentID", "Name", "Email", "Password"]
        const csvContent = headers.join(",") + "\nSTU101,John Doe,john@example.com,pass123\nSTU102,Jane Smith,jane@example.com,secure456"
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "persevex_student_import_template.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleExportAllData = () => {
        if (students.length === 0) {
            showError('No student data available to export.')
            return
        }

        try {
            const headers = ["StudentID", "Name", "Email", "Password", "Created At", "Expires At"]
            const csvRows = students.map(s => [
                s.id,
                s.name || '',
                s.email || '',
                s.password || '',
                s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
                s.expires_at ? new Date(s.expires_at).toLocaleDateString() : ''
            ].map(val => `"${val}"`).join(","))

            const csvContent = [headers.join(","), ...csvRows].join("\n")
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `persevex_students_export_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            showSuccess(`Successfully exported ${students.length} student records!`)
        } catch (err) {
            console.error("Export Error:", err)
            showError('Failed to generate export file.')
        }
    }

    const handleImportCSV = (e) => {
        const file = e.target.files[0]
        if (!file) return

        setIsImporting(true)
        setError('')
        setImportProgress({ current: 0, total: 0 })

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const data = results.data
                    setImportProgress({ current: 0, total: data.length })
                    let count = 0
                    const studentsToInsert = []

                    for (const row of data) {
                        const { Name, Email, Password } = row
                        if (Name && Email && Password) {
                            const createdAt = new Date()
                            const expiresAt = new Date()
                            expiresAt.setMonth(expiresAt.getMonth() + 2)

                            // Auto-generate ID from email prefix (e.g., "john" from "john@gmail.com")
                            const studentId = Email.split('@')[0].toLowerCase()

                            studentsToInsert.push({
                                id: studentId,
                                name: Name || '',
                                email: Email || '',
                                password: String(Password),
                                created_at: createdAt.toISOString(),
                                expires_at: expiresAt.toISOString()
                            })
                            count++
                        }
                        setImportProgress(prev => ({ ...prev, current: prev.current + 1 }))
                    }

                    // Bulk insert all students
                    if (studentsToInsert.length > 0) {
                        const { error } = await supabase
                            .from('students')
                            .insert(studentsToInsert)

                        if (error) {
                            showError(error.message || 'An error occurred during bulk provisioning.')
                        } else {
                            showSuccess(`Successfully provisioned ${count} student accounts via bulk import!`)
                            // Refetch immediately to show all imported students
                            await refetchStudents()
                        }
                    }
                } catch (err) {
                    console.error("Bulk Import Error:", err)
                    showError('An error occurred during bulk provisioning.')
                } finally {
                    setIsImporting(false)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                }
            },
            error: (err) => {
                console.error("CSV Parse Error:", err)
                showError('Could not read the CSV file. Please check the format.')
                setIsImporting(false)
            }
        })
    }

    if (!user || user.role !== 'admin') return null

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 md:p-8 font-sans transition-colors relative overflow-hidden"
        >
            {/* Background Light Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-[1400px] mx-auto space-y-8 relative z-10 pt-24">
                {/* Notifications */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
                        >
                            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={24} />
                            <div className="flex-1">
                                <p className="text-emerald-900 font-bold text-sm">{success}</p>
                            </div>
                            <button onClick={() => setSuccess('')} className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-lg transition-all">
                                <X size={18} />
                            </button>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
                        >
                            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                            <div className="flex-1">
                                <p className="text-red-900 font-bold text-sm">{error}</p>
                            </div>
                            <button onClick={() => setError('')} className="text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition-all">
                                <X size={18} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>


                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                    {/* ADD STUDENT SECTION */}
                    <div className="xl:col-span-3 space-y-6 lg:sticky lg:top-24">
                        <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100/80 overflow-hidden">
                            {/* Tab Switcher */}
                            <div className="flex p-2 bg-slate-100/50 border-b border-slate-100 shadow-inner">
                                <TabButton active={activeTab === 'single'} onClick={() => setActiveTab('single')} icon={<UserPlus size={18} />} label="Add Single" />
                                <TabButton active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')} icon={<Upload size={18} />} label="Bulk Import" />
                            </div>

                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'single' ? (
                                        <motion.div
                                            key="single"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        >
                                            <div className="mb-5 p-1 flex items-center justify-between">
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                                    {editingStudent ? 'Edit Account' : 'Provision One'}
                                                </h3>
                                                {editingStudent && (
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                            <form onSubmit={handleCreateStudent} className="space-y-2.5">
                                                <FormRow label="FULL NAME" icon={<ShieldCheck size={14} />} value={newStudent.name} onChange={(v) => setNewStudent({ ...newStudent, name: v })} placeholder="Student's Name" />
                                                <FormRow label="EMAIL ADDRESS" icon={<Mail size={14} />} value={newStudent.email} onChange={(v) => setNewStudent({ ...newStudent, email: v })} placeholder="email@example.com" type="email" />
                                                <FormRow label="TEMPORARY PASSWORD" icon={<Lock size={14} />} value={newStudent.password} onChange={(v) => setNewStudent({ ...newStudent, password: v })} placeholder="••••••••" type="password" />

                                                <button
                                                    type="submit"
                                                    disabled={isCreating || isImporting}
                                                    className={cn(
                                                        "w-full py-3 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all active:scale-[0.98] mt-2 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-3",
                                                        editingStudent ? "bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-600/20 hover:shadow-emerald-600/30" : "bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-indigo-600/20 hover:shadow-indigo-600/30"
                                                    )}
                                                >
                                                    {isCreating ? (
                                                        <>
                                                            <Loader2 size={16} className="animate-spin" />
                                                            <span>{editingStudent ? 'Updating Details...' : 'Creating Account...'}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {editingStudent ? <CheckCircle2 size={16} /> : <UserPlus size={16} />}
                                                            <span>{editingStudent ? 'Save Changes' : 'Create Student Account'}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="bulk"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="mb-6">
                                                <h3 className="text-xl font-black text-slate-900">Import Batch</h3>
                                                <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">Bulk Provisioning via CSV</p>
                                            </div>

                                            <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 space-y-4">
                                                <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                                                    Use the sample CSV to format your data. All fields are required.
                                                </p>
                                                <button onClick={downloadSample} className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-wider hover:underline">
                                                    <Download size={14} />
                                                    Download Template
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
                                                <button
                                                    disabled={isImporting}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={cn(
                                                        "w-full py-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all",
                                                        isImporting ? "bg-slate-50 border-slate-200 cursor-not-allowed" : "bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 group"
                                                    )}
                                                >
                                                    {isImporting ? (
                                                        <>
                                                            <Loader2 size={32} className="text-indigo-600 animate-spin" />
                                                            <span className="font-black text-slate-900 text-sm">Provisioning {importProgress.current}/{importProgress.total}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <FileSpreadsheet size={24} />
                                                            </div>
                                                            <div className="text-center">
                                                                <span className="block font-black text-slate-900">Upload CSV File</span>
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Max 500 rows per batch</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {(success || error) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="mt-6"
                                        >
                                            <div className={cn(
                                                "p-4 rounded-2xl flex items-center gap-3 border",
                                                success ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                                            )}>
                                                {success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                                <span className="text-xs font-black leading-tight">{success || error}</span>
                                                <button onClick={() => { setSuccess(''); setError('') }} className="ml-auto opacity-50 hover:opacity-100"><X size={14} /></button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </section>
                    </div>

                    {/* STUDENT LIST SECTION */}
                    <div className="xl:col-span-9 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                                    <Users size={22} className="text-slate-700" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provisioned Users</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExportAllData}
                                    disabled={students.length === 0}
                                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                    Export All
                                </button>
                                <span className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                    {students.length} Total
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 pb-20">
                            {students.length === 0 ? (
                                <div className="bg-white/50 backdrop-blur-xl border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center shadow-inner">
                                    <Users className="mx-auto text-slate-200 mb-6" size={80} />
                                    <h4 className="text-2xl font-black text-slate-900 mb-3">No Students Yet</h4>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto">Get started by adding a student account or performing a batch upload.</p>
                                </div>
                            ) : (
                                students.map((stu, i) => {
                                    const isExpired = stu.expires_at ? (new Date() > new Date(stu.expires_at)) : false
                                    return (
                                        <motion.div
                                            key={stu.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03, duration: 0.5 }}
                                            className={cn(
                                                "relative group overflow-hidden bg-white p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-6",
                                                isExpired ? "border-rose-100 bg-rose-50/10" : "border-slate-100 hover:border-indigo-100"
                                            )}
                                        >
                                            {/* Hover Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                            <div className="flex items-center gap-6 w-full lg:w-auto">
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform group-hover:rotate-3 transition-transform",
                                                    isExpired ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white" : "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                                                )}>
                                                    {stu.name ? stu.name.split(' ').slice(0, 2).map(n => n[0]).join('') : stu.id.substring(0, 2).toUpperCase()}
                                                </div>

                                                <div className="space-y-1.5 flex-1">
                                                    <div className="flex items-center flex-wrap gap-2.5">
                                                        <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none capitalize">{stu.name || 'Student'}</h4>
                                                        <span className={cn(
                                                            "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5",
                                                            isExpired ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                                        )}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isExpired ? "bg-rose-500" : "bg-emerald-500")} />
                                                            {isExpired ? 'Expired Account' : 'Live Status'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                                                            <User size={12} className="text-slate-400" />
                                                            <span>ID: <span className="text-indigo-600">{stu.id}</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                                                            <Mail size={12} className="text-slate-400" />
                                                            <span className="lowercase">{stu.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg group-hover:bg-white transition-colors border border-dashed border-slate-200">
                                                            <Lock size={12} className="text-slate-400" />
                                                            <span>PIN: <span className="text-indigo-600 font-mono tracking-widest">{stu.password}</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 self-center sm:self-auto bg-slate-50/50 p-1.5 rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                                                <button
                                                    onClick={() => startEditing(stu)}
                                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                                                    title="Edit Details"
                                                >
                                                    <Pencil size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStudent(stu.id)}
                                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )
                                })
                            )}
                        </div>

                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmDialog.open}
                title="Delete Student"
                message={confirmDialog.message}
                danger={true}
                confirmLabel="Yes, Delete"
                cancelLabel="Cancel"
                onCancel={closeConfirmDialog}
                onConfirm={() => confirmDialog.onConfirm?.()}
            />
        </motion.div>
    )
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                active ? "bg-white text-indigo-600 shadow-md shadow-indigo-100/50 border border-slate-200/50" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-200/50"
            )}
        >
            {icon}
            {label}
        </button>
    )
}

function FormRow({ label, icon, placeholder, value, onChange, type = "text" }) {
    return (
        <div className="space-y-1.5 group/row">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1 group-focus-within/row:text-indigo-600 transition-colors">{label}</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-all duration-300">
                    {icon}
                </div>
                <input
                    required
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:shadow-[0_4px_12px_rgba(79,70,229,0.08)]"
                />
            </div>
        </div>
    )
}
