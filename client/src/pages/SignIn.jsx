import { auth, supabase } from '../supabase'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { User, Lock, ArrowRight, Sun, ShieldCheck, Zap } from 'lucide-react'
import useStore from '../store/useStore'
import { getDbUserId, getDbUserIdCandidates } from '../lib/userIdentity'
import { loadMasterProfileBackup } from '../lib/masterProfileBackup'

export default function SignIn() {
    const { setUser, setMasterProfile, applyMasterProfile, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications, resetResume } = useStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [loginId, setLoginId] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const getProfileFromDatabase = async (activeUser) => {
        const candidates = new Set()
        const addCandidate = (value) => {
            const token = String(value || '').trim()
            if (token) candidates.add(token)
        }

        addCandidate(getDbUserId(activeUser))
        getDbUserIdCandidates(activeUser).forEach(addCandidate)
        addCandidate(activeUser?.studentId)
        addCandidate(activeUser?.uid)
        addCandidate(activeUser?.id)
        addCandidate(activeUser?.user_id)

        const email = String(activeUser?.email || '').trim()
        if (email) {
            const { data: studentData } = await supabase
                .from('students')
                .select('id')
                .eq('email', email)
                .maybeSingle()

            if (studentData?.id) {
                addCandidate(studentData.id)
            }
        }

        if (!candidates.size) return null

        const tableCandidates = ['profiles']

        for (const tableName of tableCandidates) {
            for (const userId of candidates) {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle()

                if (data) {
                    return data
                }

                if (!error) continue

                const fullMessage = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
                const relationMissing = error.code === 'PGRST205' || /relation .* does not exist|schema cache|not found|404/i.test(fullMessage)
                const noRows = error.code === 'PGRST116' || /0 rows|no rows/i.test(fullMessage)
                const invalidUuid = /invalid input syntax for type uuid/i.test(fullMessage)

                if (relationMissing || noRows || invalidUuid) {
                    continue
                }

                throw error
            }
        }

        return null
    }

    const isProfileComplete = (profile) => {
        if (!profile) return false
        const firstName = (profile.first_name || '').trim()
        const lastName = (profile.last_name || '').trim()
        const phone = (profile.phone || '').trim()
        const location = (profile.location || '').trim()
        return Boolean(firstName && lastName && phone && location)
    }

    useEffect(() => {
        const shouldClear = location.search.includes('logout=1') || location.state?.clearLogin
        if (shouldClear) {
            setLoginId('')
            setPassword('')
            setError('')
        }
    }, [location])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const input = loginId.trim()
            
            // Use the Supabase auth service
            const result = await auth.signIn(input, password)

            if (result.success) {
                setUser(result.user)
                
                // Navigate based on role
                if (result.userType === 'admin') {
                    navigate('/admin')
                } else {
                    const profile = await getProfileFromDatabase(result.user)
                    const backupProfile = loadMasterProfileBackup(result.user)

                    if (profile) {
                        let parsedMasterProfile = null
                        if (profile.master_profile) {
                            try {
                                parsedMasterProfile = typeof profile.master_profile === 'string'
                                    ? JSON.parse(profile.master_profile)
                                    : profile.master_profile
                            } catch {
                                parsedMasterProfile = null
                            }
                        }

                        if (parsedMasterProfile && typeof parsedMasterProfile === 'object') {
                            setMasterProfile(parsedMasterProfile)
                            applyMasterProfile(parsedMasterProfile)
                        }

                        const city = profile.city || profile.location?.split(',')[0]?.trim() || ''
                        const country = profile.country || profile.location?.split(',')[1]?.trim() || ''

                        updatePersonalInfo({
                            firstName: profile.first_name || '',
                            lastName: profile.last_name || '',
                            email: profile.email || result.user.email || '',
                            phone: profile.phone || '',
                            location: profile.location || [city, country].filter(Boolean).join(', '),
                            title: profile.title || '',
                            summary: profile.summary || ''
                        })
                        setExperience(Array.isArray(profile.experience_data) ? profile.experience_data : [])
                        setEducation(Array.isArray(profile.education_data) ? profile.education_data : [])
                        setSkills(Array.isArray(profile.skills_data) ? profile.skills_data : [])
                        setProjects(Array.isArray(profile.projects_data) ? profile.projects_data : [])
                        setCertifications(Array.isArray(profile.certifications_data) ? profile.certifications_data : [])
                    } else if (backupProfile) {
                        setMasterProfile(backupProfile)
                        applyMasterProfile(backupProfile)
                    } else {
                        resetResume()
                        updatePersonalInfo({ email: result.user.email || '' })
                    }

                    navigate('/student/choice', { state: { onboarding: 'post-login' } })
                }
            } else {
                setError(result.error || 'Invalid credentials. Please try again.')
            }
        } catch (err) {
            console.error("Login Error:", err)
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6 font-inter">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl flex flex-col md:flex-row shadow-[0_40px_80px_-15px_rgba(15,23,42,0.15)] rounded-[32px] overflow-hidden bg-white"
            >
                {/* Left Panel: Branding & Impact */}
                <div className="md:w-[42%] bg-[#0f172a] p-10 relative flex flex-col justify-between overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full" />

                    <div className="relative z-10 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="text-white" size={18} />
                        </div>
                        <span className="text-white font-black text-lg tracking-tighter uppercase italic">Persevex</span>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-white text-3xl font-black leading-tight tracking-tighter mb-4">
                            Build Your <br /> Future, Faster.
                        </h1>
                        <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                            The world's most sophisticated resume engineering platform.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Zap size={14} className="text-blue-400" />
                                </div>
                                <div className="text-xs font-bold uppercase tracking-wide">ATS-Extraction</div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Sun size={14} className="text-amber-400" />
                                </div>
                                <div className="text-xs font-bold uppercase tracking-wide">AI Templates</div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-8 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Validated Infrastructure</p>
                    </div>
                </div>

                {/* Right Panel: Clean Authentication */}
                <div className="md:w-[58%] p-10 md:p-14 flex flex-col justify-center bg-white">
                    <div className="w-full max-w-[320px] mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">Sign in</h2>
                            <p className="text-slate-500 text-sm font-medium">Access your career dashboard</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Student ID or Email</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                                    <input
                                        required
                                        type="text"
                                        name="signin_identifier"
                                        autoComplete="off"
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        placeholder="user@example.com"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-[16px] outline-none focus:border-blue-600/20 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                                    <input
                                        required
                                        type="password"
                                        name="signin_password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-[16px] outline-none focus:border-blue-600/20 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                                    {error}
                                </p>
                            )}

                            <button
                                disabled={loading}
                                className="w-full group relative py-3.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-[16px] font-black text-sm transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                            >
                                {loading ? 'Authenticating...' : 'Sign In'}
                                {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-loose">
                                © 2026 Persevex Infrastructure <br />
                                <span className="opacity-40 font-medium lowercase">secure internal portal</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
