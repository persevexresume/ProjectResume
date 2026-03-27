import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
    ArrowLeft, User, MapPin, Phone, Mail, Pin, ArrowRight, Plus, Trash2, 
    Upload, UserPlus, FileText, CheckCircle2, Loader2, X, Briefcase, 
    GraduationCap, Wrench, Award, PenTool, Sparkles, AlertCircle
} from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../supabase'
import { getDbUserId } from '../lib/userIdentity'
import { useToast } from '../context/ToastContext'
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import * as resumeParser from '../lib/resumeParser'

export default function MasterProfile() {
    const navigate = useNavigate()
    const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
    const { 
        user, updatePersonalInfo, setExperience, setEducation, 
        setSkills, setProjects, setCertifications, setMasterProfile 
    } = useStore()

    const [loading, setLoading] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [statusType, setStatusType] = useState('info')
    const [profileId, setProfileId] = useState(null)
    
    // Parsing states
    const [parseStatus, setParseStatus] = useState('idle') // idle, uploading, parsing, success, error
    const [parseError, setParseError] = useState('')
    const fileInputRef = useRef(null)

    const [personal, setPersonal] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        country: '',
        pinCode: '',
        phone: '',
        email: user?.email || '',
        title: '',
        summary: '',
        website: '',
        linkedin: '',
        github: ''
    })

    const [experience, setLocalExperience] = useState([])
    const [education, setLocalEducation] = useState([])
    const [skills, setLocalSkills] = useState([])
    const [projects, setLocalProjects] = useState([])
    const [certifications, setLocalCertifications] = useState([])
    const [skillInput, setSkillInput] = useState('')

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return

            const dbUserId = getDbUserId(user)
            if (!dbUserId) return

            try {
                // Use profiles table as the canonical source to avoid 404s when master_profiles is absent.
                const { data: pData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', dbUserId)
                    .maybeSingle()
                
                if (pData) {
                    setProfileId(pData.id)
                    if (pData.resume_data) {
                        const parsed = typeof pData.resume_data === 'string' ? JSON.parse(pData.resume_data) : pData.resume_data
                        const mergedParsed = resumeParser.normalizeParsedResume(
                            resumeParser.mergeParsedResume(parsed || {}, {
                                personalInfo: {
                                    firstName: pData.first_name || '',
                                    lastName: pData.last_name || '',
                                    email: pData.email || user?.email || '',
                                    phone: pData.phone || '',
                                    address: pData.address || '',
                                    city: pData.city || '',
                                    country: pData.country || '',
                                    pinCode: pData.pin_code || '',
                                    title: pData.title || '',
                                    summary: pData.summary || '',
                                    website: pData.website || '',
                                    linkedin: pData.linkedin || '',
                                    github: pData.github || ''
                                },
                                experience: Array.isArray(pData.experience_data) ? pData.experience_data : [],
                                education: Array.isArray(pData.education_data) ? pData.education_data : [],
                                skills: Array.isArray(pData.skills_data) ? pData.skills_data : [],
                                projects: Array.isArray(pData.projects_data) ? pData.projects_data : [],
                                certifications: Array.isArray(pData.certifications_data) ? pData.certifications_data : []
                            })
                        )
                        populateForm(mergedParsed)
                        return
                    }

                    const city = pData.city || pData.location?.split(',')[0]?.trim() || ''
                    const country = pData.country || pData.location?.split(',')[1]?.trim() || ''
                    
                    setPersonal({
                        firstName: pData.first_name || '',
                        lastName: pData.last_name || '',
                        address: pData.address || '',
                        city,
                        country,
                        pinCode: pData.pin_code || '',
                        phone: pData.phone || '',
                        email: pData.email || user?.email || '',
                        title: pData.title || '',
                        summary: pData.summary || '',
                        website: pData.website || '',
                        linkedin: pData.linkedin || '',
                        github: pData.github || ''
                    })

                    setLocalExperience(Array.isArray(pData.experience_data) ? pData.experience_data : [])
                    setLocalEducation(Array.isArray(pData.education_data) ? pData.education_data : [])
                    setLocalSkills(Array.isArray(pData.skills_data) ? pData.skills_data : [])
                    setLocalProjects(Array.isArray(pData.projects_data) ? pData.projects_data : [])
                    setLocalCertifications(Array.isArray(pData.certifications_data) ? pData.certifications_data : [])
                }
            } catch (err) {
                console.error("Error loading profile:", err)
            }
        }

        loadProfile()
    }, [user])

    const populateForm = (data) => {
        if (!data) return
        
        const personalInfo = data.personalInfo || {}
        const locationParts = resumeParser.splitLocationParts(personalInfo.location || '')
        setPersonal({
            firstName: personalInfo.firstName || '',
            lastName: personalInfo.lastName || '',
            email: personalInfo.email || user?.email || '',
            phone: personalInfo.phone || '',
            address: personalInfo.address || locationParts.address || '',
            city: personalInfo.city || locationParts.city || personalInfo.location?.split(',')[0]?.trim() || '',
            country: personalInfo.country || locationParts.country || personalInfo.location?.split(',')[1]?.trim() || '',
            pinCode: personalInfo.pinCode || locationParts.pinCode || '',
            title: personalInfo.title || '',
            summary: personalInfo.summary || '',
            website: personalInfo.website || '',
            linkedin: personalInfo.linkedin || '',
            github: personalInfo.github || ''
        })

        setLocalExperience(Array.isArray(data.experience) ? data.experience : [])
        setLocalEducation(Array.isArray(data.education) ? data.education : [])
        setLocalSkills(Array.isArray(data.skills) ? data.skills : [])
        setLocalProjects(Array.isArray(data.projects) ? data.projects : [])
        setLocalCertifications(Array.isArray(data.certifications) ? data.certifications : [])
    }

    const handleCreateFresh = () => {
        setPersonal({
            firstName: '',
            lastName: '',
            address: '',
            city: '',
            country: '',
            pinCode: '',
            phone: '',
            email: user?.email || '',
            title: '',
            summary: '',
            website: '',
            linkedin: '',
            github: ''
        })
        setLocalExperience([])
        setLocalEducation([])
        setLocalSkills([])
        setLocalProjects([])
        setLocalCertifications([])
        toastInfo("Started fresh. Fill in your details.")
    }

    const resetProfileState = () => {
        setPersonal({
            firstName: '',
            lastName: '',
            address: '',
            city: '',
            country: '',
            pinCode: '',
            phone: '',
            email: user?.email || '',
            title: '',
            summary: '',
            website: '',
            linkedin: '',
            github: ''
        })
        setLocalExperience([])
        setLocalEducation([])
        setLocalSkills([])
        setLocalProjects([])
        setLocalCertifications([])
    }

    const handleDeleteProfile = async () => {
        if (!user) {
            toastError('Please sign in first')
            return
        }

        const confirmed = window.confirm('Delete all Master Profile data? This will clear your saved profile details.')
        if (!confirmed) return

        setLoading(true)
        setStatusMessage('')
        try {
            const dbUserId = getDbUserId(user)
            if (!dbUserId) throw new Error('Unable to identify your account')

            const clearPayload = {
                resume_data: null,
                first_name: '',
                last_name: '',
                phone: '',
                city: '',
                country: '',
                title: '',
                summary: '',
                website: '',
                linkedin: '',
                github: '',
                experience_data: [],
                education_data: [],
                skills_data: [],
                projects_data: [],
                certifications_data: [],
                updated_at: new Date().toISOString()
            }

            const updateProfileAdaptive = async (initialPayload) => {
                const payload = { ...initialPayload }

                for (let attempt = 0; attempt < 8; attempt += 1) {
                    const result = await supabase
                        .from('profiles')
                        .update(payload)
                        .eq('user_id', dbUserId)

                    if (!result.error) return

                    const fullMessage = [result.error.message, result.error.details, result.error.hint]
                        .filter(Boolean)
                        .join(' | ')

                    const missingColumnMatch =
                        fullMessage.match(/Could not find the '([^']+)' column/i) ||
                        fullMessage.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)

                    if (missingColumnMatch && payload[missingColumnMatch[1]] !== undefined) {
                        delete payload[missingColumnMatch[1]]
                        continue
                    }

                    throw new Error(fullMessage || 'Failed to delete profile data')
                }

                throw new Error('Failed to delete profile data after schema adaptation attempts')
            }

            await updateProfileAdaptive(clearPayload)

            const emptyProfile = {
                personalInfo: {
                    firstName: '',
                    lastName: '',
                    email: user?.email || '',
                    phone: '',
                    location: '',
                    address: '',
                    city: '',
                    country: '',
                    pinCode: '',
                    title: '',
                    summary: '',
                    website: '',
                    linkedin: '',
                    github: ''
                },
                experience: [],
                education: [],
                skills: [],
                projects: [],
                certifications: []
            }

            setMasterProfile(emptyProfile)
            updatePersonalInfo(emptyProfile.personalInfo)
            setExperience([])
            setEducation([])
            setSkills([])
            setProjects([])
            setCertifications([])
            resetProfileState()
            toastSuccess('Master Profile data deleted successfully.')
        } catch (error) {
            console.error('Delete Error:', error)
            toastError(error.message || 'Failed to delete profile data.')
        } finally {
            setLoading(false)
        }
    }

    // --- PDF PARSING LOGIC (Simplified from UploadResume.jsx) ---
    
    const SECTION_HEADERS = {
        summary: ['summary', 'profile', 'objective', 'about me', 'professional summary', 'executive summary', 'professional profile'],
        experience: ['experience', 'work experience', 'employment', 'professional experience', 'work history', 'career history', 'employment history', 'professional background'],
        education: ['education', 'academic background', 'academics', 'qualification', 'academic profile', 'educational background', 'academic qualifications'],
        skills: ['skills', 'technical skills', 'core skills', 'expertise', 'specializations', 'proficiencies', 'technologies', 'technical expertise', 'key skills'],
        projects: ['projects', 'personal projects', 'key projects', 'academic projects', 'recent projects'],
        certifications: ['certifications', 'certification', 'certificates', 'certificate', 'awards', 'honors', 'achievements', 'achievement', 'certifications & awards', 'licenses', 'professional certifications', 'credentials']
    }

    const isLikelySectionHeader = (line) => {
        const value = line.trim().toLowerCase()
        return Object.values(SECTION_HEADERS).flat().some((header) => value === header || value === header + ':')
    }

    const getSectionContent = (lines, headers) => {
        const startIndex = lines.findIndex((line) => 
            headers.includes(line.trim().toLowerCase().replace(/:$/, ''))
        )
        if (startIndex < 0) return []
        const content = []
        for (let i = startIndex + 1; i < lines.length; i += 1) {
            const current = lines[i]
            if (isLikelySectionHeader(current)) break
            content.push(current)
        }
        return content
    }

    const parsePersonalInfo = (text, lines) => {
        const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)
        const phoneMatch = text.match(/((?:\+|00)\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/)
        const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[A-Za-z0-9\-_/]+/i)
        const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9\-_/]+/i)
        const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([A-Za-z0-9.-]+\.[A-Za-z]{2,})(?:\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]*)?/i)
        const nameLine = lines.find((line) => {
            const clean = line.trim()
            if (/[@\d]/.test(clean)) return false
            if (clean.toLowerCase().includes('http')) return false
            if (isLikelySectionHeader(clean)) return false
            return /^[A-Za-z][A-Za-z\s.'-]+$/.test(clean)
        }) || ''
        const nameParts = nameLine.trim().split(/\s+/).filter(Boolean)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        const locationLine = lines.find((line) => {
            const clean = line.trim()
            if (clean.length > 100) return false
            return (/,\s*[A-Za-z]{2,}$/.test(clean) || /[A-Za-z\s]+,\s*[A-Za-z\s]+/.test(clean)) && !clean.includes('@')
        })
        const summaryLines = getSectionContent(lines, SECTION_HEADERS.summary)
        return {
            firstName, lastName, email: emailMatch?.[0] || '', phone: phoneMatch?.[0]?.trim() || '',
            location: locationLine || '', summary: summaryLines.join(' '), 
            linkedin: linkedinMatch?.[0] || '', github: githubMatch?.[0] || '', website: websiteMatch?.[0] || ''
        }
    }

    const parseSkills = (lines) => {
        const skillSectionLines = getSectionContent(lines, SECTION_HEADERS.skills)
        if (skillSectionLines.length === 0) return []
        const skillTokens = skillSectionLines.join(' | ').split(/[|,•·\n\t;]/).map((item) => item.trim()).filter((item) => item.length >= 2 && item.length <= 50)
        return [...new Set(skillTokens)].map((name, index) => ({ id: Date.now() + index, name, level: 'Advanced' }))
    }

    const parseEducation = (lines) => {
        const eduSectionLines = getSectionContent(lines, SECTION_HEADERS.education)
        const chunks = eduSectionLines.filter((line) => line.trim().length > 0)
        const degreeRegex = /(b\.?tech|b\.?e|bachelor|master|m\.?tech|mba|ph\.?d|diploma|certificate|secondary|ssc|hsc)/i
        const entries = []
        for (let i = 0; i < chunks.length; i += 1) {
            const current = chunks[i]; if (!degreeRegex.test(current)) continue;
            entries.push({ id: Date.now() + i, school: chunks[i+1] || '', degree: current, startDate: '', endDate: '', description: '' })
            i++
        }
        return entries
    }

    const parseExperience = (lines) => {
        const expSectionLines = getSectionContent(lines, SECTION_HEADERS.experience)
        const chunks = expSectionLines.filter((line) => line.trim().length > 0)
        const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:\d{1,2},?\s*)?(?:19|20)\d{2})\s*(?:[-–—]|to)\s*((?:Present|Current|Till Date|Ongoing)|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:\d{1,2},?\s*)?(?:19|20)\d{2})/i
        const entries = []
        for (let i = 0; i < chunks.length; i += 1) {
            if (!dateRegex.test(chunks[i])) continue
            const dateParts = chunks[i].split(/[-–—]|to/i)
            entries.push({ id: Date.now() + i, role: chunks[i-1] || 'Role', company: chunks[i-2] || 'Company', startDate: (dateParts[0] || '').trim(), endDate: (dateParts[1] || '').trim(), description: chunks[i+1] || '' })
        }
        return entries
    }

    const extractTextFromPdf = async (selectedFile) => {
        const pdfjsModule = await import('pdfjs-dist')
        const pdfjsLib = (pdfjsModule?.GlobalWorkerOptions && pdfjsModule?.getDocument)
            ? pdfjsModule
            : pdfjsModule.default
        if (!pdfjsLib?.getDocument || !pdfjsLib?.GlobalWorkerOptions) {
            throw new Error('PDF parser failed to initialize.')
        }

        if (!pdfjsLib.GlobalWorkerOptions.workerPort) {
            pdfjsLib.GlobalWorkerOptions.workerPort = new PdfJsWorker()
        }

        const fileBuffer = await selectedFile.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise
        let text = ''

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber)
            const content = await page.getTextContent()

            const items = content.items
                .map((item) => ({
                    str: item.str || '',
                    x: item.transform?.[4] || 0,
                    y: item.transform?.[5] || 0
                }))
                .filter((item) => item.str.trim().length > 0)
                .sort((a, b) => {
                    if (Math.abs(b.y - a.y) > 2) return b.y - a.y
                    return a.x - b.x
                })

            const lines = []
            for (const item of items) {
                const line = lines.find((entry) => Math.abs(entry.y - item.y) <= 2.5)
                if (line) {
                    line.items.push(item)
                } else {
                    lines.push({ y: item.y, items: [item] })
                }
            }

            const pageText = lines
                .sort((a, b) => b.y - a.y)
                .map((line) => line.items
                    .sort((a, b) => a.x - b.x)
                    .map((item) => item.str)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim())
                .filter(Boolean)
                .join('\n')

            text += `\n${pageText}`
        }

        return text
    }

    const parseResumeWithAI = async (rawText) => {
        const response = await fetch('/api/parse-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeText: rawText })
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.error || 'AI parsing is unavailable right now.')
        }

        const payload = await response.json()
        return payload?.data || {}
    }

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0]
        if (!selectedFile) return
        
        try {
            setParseStatus('uploading')
            setParseError('')

            const rawText = await resumeParser.extractResumeText(selectedFile)

            if (!rawText || rawText.length < 50) throw new Error("Could not read enough text from file.")

            setParseStatus('parsing')

            let aiParsed = null
            try {
                aiParsed = await parseResumeWithAI(rawText)
            } catch (aiError) {
                console.warn('AI parsing failed in Master Profile, using local extraction fallback:', aiError.message)
            }

            const localParsed = resumeParser.parseResumeText(rawText)
            const mergedParsed = aiParsed ? resumeParser.mergeParsedResume(localParsed, aiParsed) : localParsed
            const extracted = resumeParser.normalizeParsedResume(mergedParsed)

            const hasExtractedData = Boolean(
                extracted.personalInfo.firstName ||
                extracted.personalInfo.lastName ||
                extracted.personalInfo.email ||
                extracted.personalInfo.phone ||
                extracted.personalInfo.summary ||
                extracted.experience.length ||
                extracted.education.length ||
                extracted.skills.length ||
                extracted.projects.length ||
                extracted.certifications.length
            )
            if (!hasExtractedData) {
                throw new Error('Could not extract usable details from this PDF. Please try another file.')
            }

            populateForm(extracted)
            setParseStatus('success')
            toastSuccess("Resume parsed! Adjust the details as needed.")
            setTimeout(() => setParseStatus('idle'), 2000)
        } catch (err) {
            console.error("Parse Error:", err)
            setParseStatus('error')
            setParseError(err.message || "Failed to parse resume.")
            toastError("Failed to parse resume.")
        }
    }

    const handleSave = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        setStatusMessage('')
        try {
            if (!user) throw new Error('Please sign in first')

            const dbUserId = getDbUserId(user)
            if (!dbUserId) throw new Error('Unable to identify your account')

            const composedLocation = [personal.address, personal.city, personal.country]
                .map((value) => (value || '').trim())
                .filter(Boolean)
                .join(', ')

            const normalizedData = {
                personalInfo: {
                    ...personal,
                    location: composedLocation || [personal.city, personal.country].filter(Boolean).join(', ')
                },
                experience,
                education,
                skills,
                projects,
                certifications
            }

            const upsertProfileAdaptive = async (initialPayload) => {
                const payload = { ...initialPayload }

                for (let attempt = 0; attempt < 8; attempt += 1) {
                    try {
                        const result = await supabase
                            .from('profiles')
                            .upsert(payload)

                        if (!result.error) return
                        
                        const fullMessage = [result.error.message, result.error.details, result.error.hint]
                            .filter(Boolean)
                            .join(' | ')

                        const missingColumnMatch =
                            fullMessage.match(/Could not find the '([^']+)' column/i) ||
                            fullMessage.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)

                        if (missingColumnMatch && payload[missingColumnMatch[1]] !== undefined) {
                            delete payload[missingColumnMatch[1]]
                            continue
                        }

                        throw new Error(fullMessage || 'Failed to save profile')
                    } catch (err) {
                        // If upsert fails, try update then insert
                        if (profileId) {
                            const updateResult = await supabase
                                .from('profiles')
                                .update(payload)
                                .eq('id', profileId)
                            
                            if (!updateResult.error) return
                        }
                        
                        // Try insert as fallback
                        const insertResult = await supabase
                            .from('profiles')
                            .insert([payload])
                        
                        if (!insertResult.error) return
                        
                        throw err
                    }
                }

                throw new Error('Failed to save profile after schema adaptation attempts')
            }

            const payload = {
                user_id: dbUserId,
                first_name: personal.firstName,
                last_name: personal.lastName,
                email: personal.email,
                phone: personal.phone,
                address: personal.address,
                city: personal.city,
                country: personal.country,
                pin_code: personal.pinCode,
                title: personal.title,
                summary: personal.summary,
                website: personal.website,
                linkedin: personal.linkedin,
                github: personal.github,
                experience_data: experience,
                education_data: education,
                skills_data: skills,
                projects_data: projects,
                certifications_data: certifications,
                updated_at: new Date().toISOString()
            }

            if (profileId) payload.id = profileId

            await upsertProfileAdaptive(payload)

            // Update local store
            setMasterProfile(normalizedData)
            updatePersonalInfo(normalizedData.personalInfo)
            setExperience(experience)
            setEducation(education)
            setSkills(skills)
            setProjects(projects)
            setCertifications(certifications)

            setSaveSuccess(true)
            toastSuccess("Master Profile saved for life!")
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (error) {
            console.error("Save Error:", error)
            toastError(error.message || "Failed to save profile.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                height: '100vh',
                background: '#f8fafc',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '1.2rem 2rem 0'
            }}
        >
            <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <Link to="/student/choice" className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
                        <ArrowLeft size={18} /> Back
                    </Link>
                    <div className="text-center flex-1 pr-[80px]">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Master <span className="text-indigo-600">Profile</span></h1>
                        <p className="text-slate-500 mt-0.5 font-medium text-xs">Your permanent professional identity, saved for a lifetime.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden min-h-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
                    {/* LEFT COLUMN: Options */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/40">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Fill Methods</h3>
                            
                            <div className="flex flex-col gap-4">
                                {/* Upload PDF Option */}
                                <motion.div
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => fileInputRef.current.click()}
                                    className="p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl cursor-pointer group transition-all hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10"
                                >
                                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 transition-transform group-hover:rotate-6">
                                        {parseStatus === 'uploading' || parseStatus === 'parsing' ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                                    </div>
                                    <h4 className="text-lg font-black text-indigo-900">Upload PDF</h4>
                                    <p className="text-xs text-indigo-600/70 font-bold mt-1">Auto-extract your existing details</p>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt" className="hidden" />
                                </motion.div>

                                {/* Create Profile Option */}
                                <motion.div
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCreateFresh}
                                    className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-2xl cursor-pointer group transition-all hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10"
                                >
                                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 transition-transform group-hover:-rotate-6">
                                        <UserPlus size={24} />
                                    </div>
                                    <h4 className="text-lg font-black text-emerald-900">Create Profile</h4>
                                    <p className="text-xs text-emerald-600/70 font-bold mt-1">Start fresh with a blank identity</p>
                                </motion.div>
                            </div>

                            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 font-medium leading-relaxed">
                                <AlertCircle size={14} className="inline mr-1 mb-0.5 text-slate-400" />
                                All details from these options are populated in the form on the right and saved for your account.
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE: Arrow */}
                    <div className="hidden lg:flex lg:col-span-1 items-center justify-center h-[300px]">
                        <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-slate-300"
                        >
                            <ArrowRight size={60} strokeWidth={3} />
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: Form */}
                    <div className="lg:col-span-8 h-full overflow-hidden">
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-100 h-full flex flex-col overflow-hidden">
                            <div className="px-8 py-6 md:px-12 md:py-8 border-b border-slate-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Personal Details</h2>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-0.5">Foundational Info</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleDeleteProfile}
                                            disabled={loading}
                                            className="px-4 py-2.5 rounded-xl font-black text-xs text-rose-600 border-2 border-rose-100 hover:bg-rose-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                        >
                                            Delete Profile
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={handleSave} disabled={loading}
                                            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-xl flex items-center gap-2 ${saveSuccess ? 'bg-green-600 shadow-green-200' : 'bg-indigo-600 shadow-indigo-200'} text-white`}
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                                            {loading ? 'Saving...' : saveSuccess ? 'Profile Saved!' : 'Save Profile'}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto px-8 md:px-12 py-8 pb-24 custom-scrollbar">
                                <form className="space-y-12">
                                    {/* Personal Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input value={personal.firstName} onChange={e => setPersonal({...personal, firstName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                            <input value={personal.lastName} onChange={e => setPersonal({...personal, lastName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input value={personal.email} onChange={e => setPersonal({...personal, email: e.target.value})} placeholder="you@example.com" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Title</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input value={personal.title} onChange={e => setPersonal({...personal, title: e.target.value})} placeholder="Software Engineer" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input value={personal.phone} onChange={e => setPersonal({...personal, phone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                            <input value={personal.address} onChange={e => setPersonal({...personal, address: e.target.value})} placeholder="House no, street, area" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input value={personal.city} onChange={e => setPersonal({...personal, city: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                                            <input value={personal.country} onChange={e => setPersonal({...personal, country: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pin Code</label>
                                            <div className="relative">
                                                <Pin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input value={personal.pinCode} onChange={e => setPersonal({...personal, pinCode: e.target.value})} placeholder="Postal / Zip Code" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website / Portfolio</label>
                                            <input value={personal.website} onChange={e => setPersonal({...personal, website: e.target.value})} placeholder="https://portfolio.com" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LinkedIn</label>
                                            <input value={personal.linkedin} onChange={e => setPersonal({...personal, linkedin: e.target.value})} placeholder="linkedin.com/in/username" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GitHub</label>
                                            <input value={personal.github} onChange={e => setPersonal({...personal, github: e.target.value})} placeholder="github.com/username" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Summary</label>
                                            <textarea value={personal.summary} onChange={e => setPersonal({...personal, summary: e.target.value})} rows={4} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-6 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none" placeholder="Describe your career highlights..." />
                                        </div>
                                    </div>

                                    {/* Experience Section */}
                                    <div className="pt-8 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">Work History</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Where you've been</p>
                                            </div>
                                            <button type="button" onClick={() => setLocalExperience([...experience, { role: '', company: '', location: '', startDate: '', endDate: '', description: '' }])} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <AnimatePresence>
                                                {experience.map((exp, idx) => (
                                                    <motion.div key={`exp-${idx}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 20 }} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 relative group">
                                                        <button onClick={() => setLocalExperience(experience.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <input value={exp.role} onChange={e => setLocalExperience(experience.map((it, i) => i === idx ? {...it, role: e.target.value} : it))} placeholder="Role" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                            <input value={exp.company} onChange={e => setLocalExperience(experience.map((it, i) => i === idx ? {...it, company: e.target.value} : it))} placeholder="Company" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <input value={exp.location || ''} onChange={e => setLocalExperience(experience.map((it, i) => i === idx ? {...it, location: e.target.value} : it))} placeholder="Location" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                            <input value={exp.startDate} onChange={e => setLocalExperience(experience.map((it, i) => i === idx ? {...it, startDate: e.target.value} : it))} placeholder="Start Date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <input value={exp.endDate} onChange={e => setLocalExperience(experience.map((it, i) => i === idx ? {...it, endDate: e.target.value} : it))} placeholder="End Date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                            <div />
                                                        </div>
                                                        <textarea value={exp.description || ''} onChange={e => setLocalExperience(experience.map((it, i) => i === idx ? {...it, description: e.target.value} : it))} placeholder="Describe achievements, responsibilities, and impact" rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm" />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {experience.length === 0 && <div className="text-center py-8 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm">No experience added yet.</div>}
                                        </div>
                                    </div>

                                    {/* Education Section */}
                                    <div className="pt-8 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">Education</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Your qualifications</p>
                                            </div>
                                            <button type="button" onClick={() => setLocalEducation([...education, { school: '', degree: '', location: '', startDate: '', endDate: '', gpa: '', description: '' }])} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {education.map((edu, idx) => (
                                                <div key={`edu-${idx}`} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 relative group">
                                                    <button onClick={() => setLocalEducation(education.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <input value={edu.school} onChange={e => setLocalEducation(education.map((it, i) => i === idx ? {...it, school: e.target.value} : it))} placeholder="University / School" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        <input value={edu.degree} onChange={e => setLocalEducation(education.map((it, i) => i === idx ? {...it, degree: e.target.value} : it))} placeholder="Degree / Major" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <input value={edu.location || ''} onChange={e => setLocalEducation(education.map((it, i) => i === idx ? {...it, location: e.target.value} : it))} placeholder="Location" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        <input value={edu.gpa || ''} onChange={e => setLocalEducation(education.map((it, i) => i === idx ? {...it, gpa: e.target.value} : it))} placeholder="GPA / Percentage" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <input value={edu.startDate || ''} onChange={e => setLocalEducation(education.map((it, i) => i === idx ? {...it, startDate: e.target.value} : it))} placeholder="Start Date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        <input value={edu.endDate || ''} onChange={e => setLocalEducation(education.map((it, i) => i === idx ? {...it, endDate: e.target.value} : it))} placeholder="End Date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                    </div>
                                                    <textarea value={edu.description || ''} onChange={e => setLocalEducation(education.map((it, i) => i === idx ? {...it, description: e.target.value} : it))} placeholder="Honors, relevant coursework, thesis, or achievements" rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm" />
                                                </div>
                                            ))}
                                            {education.length === 0 && <div className="text-center py-8 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm">No education added yet.</div>}
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    <div className="pt-8 border-t border-slate-100">
                                        <h3 className="text-xl font-black text-slate-900 mb-6">Master Skills</h3>
                                        <div className="flex gap-3 mb-6">
                                            <input 
                                                value={skillInput} onChange={e => setSkillInput(e.target.value)} 
                                                onKeyDown={e => { if(e.key === 'Enter'){ e.preventDefault(); if(skillInput.trim()){ setLocalSkills([...skills, {name: skillInput.trim()}]); setSkillInput(''); } } }}
                                                placeholder="Type a skill and press Enter" 
                                                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" 
                                            />
                                            <button type="button" onClick={() => { if(skillInput.trim()){ setLocalSkills([...skills, {name: skillInput.trim()}]); setSkillInput(''); } }} className="bg-indigo-600 text-white px-6 rounded-xl font-black hover:bg-slate-900 transition-all">Add</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map((skill, idx) => (
                                                <div key={`skill-${idx}`} className="px-4 py-2 bg-white border-2 border-slate-100 rounded-full flex items-center gap-2 group hover:border-indigo-200 transition-all">
                                                    <span className="text-sm font-black text-slate-700">{skill.name}</span>
                                                    <button type="button" onClick={() => setLocalSkills(skills.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Projects Section */}
                                    <div className="pt-8 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">Projects</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Academic + personal work</p>
                                            </div>
                                            <button type="button" onClick={() => setLocalProjects([...projects, { name: '', description: '', link: '', startDate: '', endDate: '' }])} className="p-2.5 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-600 hover:text-white transition-all">
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {projects.map((project, idx) => (
                                                <div key={`project-${idx}`} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 relative group">
                                                    <button onClick={() => setLocalProjects(projects.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <input value={project.name || ''} onChange={e => setLocalProjects(projects.map((it, i) => i === idx ? {...it, name: e.target.value} : it))} placeholder="Project Name" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        <input value={project.link || ''} onChange={e => setLocalProjects(projects.map((it, i) => i === idx ? {...it, link: e.target.value} : it))} placeholder="Project URL / Repo" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <input value={project.startDate || ''} onChange={e => setLocalProjects(projects.map((it, i) => i === idx ? {...it, startDate: e.target.value} : it))} placeholder="Start Date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        <input value={project.endDate || ''} onChange={e => setLocalProjects(projects.map((it, i) => i === idx ? {...it, endDate: e.target.value} : it))} placeholder="End Date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                    </div>
                                                    <textarea value={project.description || ''} onChange={e => setLocalProjects(projects.map((it, i) => i === idx ? {...it, description: e.target.value} : it))} placeholder="What problem did you solve? What technologies did you use?" rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm" />
                                                </div>
                                            ))}
                                            {projects.length === 0 && <div className="text-center py-8 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm">No projects added yet.</div>}
                                        </div>
                                    </div>

                                    {/* Certifications Section */}
                                    <div className="pt-8 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">Certifications</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Courses, badges, credentials</p>
                                            </div>
                                            <button type="button" onClick={() => setLocalCertifications([...certifications, { name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', link: '' }])} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all">
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {certifications.map((cert, idx) => (
                                                <div key={`cert-${idx}`} className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 relative group">
                                                    <button onClick={() => setLocalCertifications(certifications.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <input value={cert.name || ''} onChange={e => setLocalCertifications(certifications.map((it, i) => i === idx ? {...it, name: e.target.value} : it))} placeholder="Certification Name" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        <input value={cert.issuer || ''} onChange={e => setLocalCertifications(certifications.map((it, i) => i === idx ? {...it, issuer: e.target.value} : it))} placeholder="Issuing Organization" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <input value={cert.issueDate || ''} onChange={e => setLocalCertifications(certifications.map((it, i) => i === idx ? {...it, issueDate: e.target.value} : it))} placeholder="Issue Date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        <input value={cert.expiryDate || ''} onChange={e => setLocalCertifications(certifications.map((it, i) => i === idx ? {...it, expiryDate: e.target.value} : it))} placeholder="Expiry Date" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <input value={cert.credentialId || ''} onChange={e => setLocalCertifications(certifications.map((it, i) => i === idx ? {...it, credentialId: e.target.value} : it))} placeholder="Credential ID" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                        <input value={cert.link || ''} onChange={e => setLocalCertifications(certifications.map((it, i) => i === idx ? {...it, link: e.target.value} : it))} placeholder="Credential URL" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm" />
                                                    </div>
                                                </div>
                                            ))}
                                            {certifications.length === 0 && <div className="text-center py-8 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm">No certifications added yet.</div>}
                                        </div>
                                    </div>

                                    <div className="pt-12">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={handleSave} disabled={loading}
                                            className={`w-full py-5 rounded-[24px] font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 ${saveSuccess ? 'bg-green-600 shadow-green-400/20' : 'bg-slate-900 shadow-slate-900/20'} text-white`}
                                        >
                                            {loading ? <Loader2 size={24} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={24} /> : <SaveIcon />}
                                            {loading ? 'Committing to cloud...' : saveSuccess ? 'Success! Details locked in.' : 'Lock My Professional Profile'}
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
    )
}

function SaveIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0393 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}
