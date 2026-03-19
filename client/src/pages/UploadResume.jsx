import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, FileText, ArrowLeft, CheckCircle2, Loader2, X } from 'lucide-react'
import useStore from '../store/useStore'
import { useToast } from '../context/ToastContext'
import { supabase } from '../supabase'
import { getDbUserId } from '../lib/userIdentity'

export default function UploadResume() {
    const navigate = useNavigate()
    const { success: toastSuccess, error: toastError } = useToast()
    const { user, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications } = useStore()
    const [file, setFile] = useState(null)
    const [status, setStatus] = useState('idle') // idle, uploading, parsing, success, error
    const [errorMessage, setErrorMessage] = useState('')
    const fileInputRef = useRef(null)

    const SECTION_HEADERS = {
        summary: ['summary', 'profile', 'objective', 'about me', 'professional summary', 'executive summary'],
        experience: ['experience', 'work experience', 'employment', 'professional experience', 'work history', 'career history'],
        education: ['education', 'academic background', 'academics', 'qualification', 'academic profile'],
        skills: ['skills', 'technical skills', 'core skills', 'expertise', 'specializations', 'proficiencies'],
        projects: ['projects', 'personal projects', 'key projects', 'academic projects'],
        certifications: ['certifications', 'awards', 'honors', 'achievements', 'certifications & awards']
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
        const commonEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']
        const website = (websiteMatch?.[0] || '').toLowerCase()
        const isEmailDomain = commonEmailDomains.some(d => website.includes(d))
        
        // Find name: First non-empty line that isn't a section header and doesn't contain a phone/email/url
        const nameLine = lines.find((line) => {
            const clean = line.trim()
            if (!clean || clean.length < 3 || clean.length > 60) return false
            if (/[@\d]/.test(clean)) return false
            if (clean.toLowerCase().includes('http')) return false
            if (isLikelySectionHeader(clean)) return false
            return /^[A-Za-z][A-Za-z\s.'-]+$/.test(clean)
        }) || ''

        const nameParts = nameLine.trim().split(/\s+/).filter(Boolean)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        const nameIndex = lines.indexOf(nameLine)
        const titleCandidate = nameIndex !== -1 ? lines.slice(nameIndex + 1, nameIndex + 4).find(l => 
            l.trim() && 
            !isLikelySectionHeader(l) && 
            !l.includes('@') && 
            !/^\+?\d/.test(l.trim()) &&
            l.length < 100
        ) : ''

        const locationLine = lines.find((line) => {
            const clean = line.trim()
            if (clean.length > 100) return false
            return (/,\s*[A-Za-z]{2,}$/.test(clean) || /[A-Za-z\s]+,\s*[A-Za-z\s]+/.test(clean)) && !clean.includes('@')
        })

        const summaryLines = getSectionContent(lines, SECTION_HEADERS.summary)

        return {
            firstName,
            lastName,
            email: emailMatch?.[0] || '',
            phone: phoneMatch?.[0]?.trim() || '',
            location: (locationLine || '').slice(0, 80),
            title: (titleCandidate || '').slice(0, 80),
            summary: summaryLines.slice(0, 4).join(' ').slice(0, 450),
            linkedin: linkedinMatch?.[0] || '',
            github: githubMatch?.[0] || '',
            website: isEmailDomain ? '' : website
        }
    }

    const parseSkills = (lines) => {
        const skillSectionLines = getSectionContent(lines, SECTION_HEADERS.skills)
        if (skillSectionLines.length === 0) return []
        
        const skillTokens = skillSectionLines
            .join(' | ')
            .split(/[|,•·\n]/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 2 && item.length <= 40)

        const deduped = [...new Set(skillTokens)].slice(0, 15)
        return deduped.map((name, index) => ({ id: Date.now() + index, name, level: 'Advanced' }))
    }

    const parseProjects = (lines) => {
        const projLines = getSectionContent(lines, SECTION_HEADERS.projects)
        const entries = []
        let currentEntry = null

        for (const line of projLines) {
            const clean = line.trim()
            if (!clean) continue

            // Heuristic: Short bold-ish line is a project title
            if (clean.length < 60 && !clean.includes('  ')) {
                if (currentEntry) entries.push(currentEntry)
                currentEntry = { id: Date.now() + Math.random(), name: clean, description: '', link: '' }
            } else if (currentEntry) {
                currentEntry.description += (currentEntry.description ? ' ' : '') + clean
            }
        }
        if (currentEntry) entries.push(currentEntry)
        return entries.map(e => ({ ...e, description: e.description.slice(0, 250) })).slice(0, 5)
    }

    const parseEducation = (lines) => {
        const eduSectionLines = getSectionContent(lines, SECTION_HEADERS.education)
        const chunks = eduSectionLines.filter((line) => line.trim().length > 0)
        const degreeRegex = /(b\.?tech|b\.?e|bachelor|master|m\.?tech|mba|ph\.?d|diploma|certificate|secondary|ssc|hsc)/i
        const yearRegex = /(19|20)\d{2}/g

        const entries = []
        for (let i = 0; i < chunks.length; i += 1) {
            const current = chunks[i]
            if (!degreeRegex.test(current) && !degreeRegex.test(chunks[i + 1] || '')) continue

            const degreeLine = degreeRegex.test(current) ? current : chunks[i + 1]
            const schoolLine = degreeRegex.test(current) ? (chunks[i + 1] || '') : current
            const years = (degreeLine + ' ' + schoolLine).match(yearRegex) || []

            entries.push({
                id: Date.now() + i,
                school: schoolLine.slice(0, 90),
                degree: degreeLine.slice(0, 90),
                location: '',
                startDate: years[0] || '',
                endDate: years[1] || years[0] || '',
                gpa: '',
                description: ''
            })
            i++ // Skip next since we consumed it
        }

        return entries.slice(0, 5)
    }

    const parseExperience = (lines) => {
        const expSectionLines = getSectionContent(lines, SECTION_HEADERS.experience)
        const chunks = expSectionLines.filter((line) => line.trim().length > 0)
        const dateRegex = /((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(19|20)\d{2})\s*[-–—]\s*((Present|Current|Till Date)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(19|20)\d{2})/i

        const entries = []
        for (let i = 0; i < chunks.length; i += 1) {
            const current = chunks[i]
            if (!dateRegex.test(current)) continue

            const roleLine = chunks[i - 1] || chunks[i + 1] || ''
            const companyLine = chunks[i - 2] || chunks[i - 1] || ''
            const details = chunks.slice(i + 1, i + 4).join(' ')
            const dateParts = current.split(/[-–—]/)

            entries.push({
                id: Date.now() + i,
                role: roleLine.slice(0, 80) || 'Professional Role',
                company: companyLine.slice(0, 80) || 'Organization',
                location: '',
                startDate: (dateParts[0] || '').trim(),
                endDate: (dateParts[1] || '').trim(),
                description: details.slice(0, 350)
            })
        }

        return entries.slice(0, 6)
    }

    const extractTextFromPdf = async (selectedFile) => {
        const pdfjsLib = await import('pdfjs-dist')

        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            try {
                const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default
            } catch {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
            }
        }

        const fileBuffer = await selectedFile.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise
        let text = ''

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber)
            const content = await page.getTextContent()
            const pageText = content.items.map((item) => item.str).join(' ')
            text += `\n${pageText}`
        }

        return text
    }

    const extractTextFromDocx = async (selectedFile) => {
        const mammoth = await import('mammoth')
        const arrayBuffer = await selectedFile.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        return result.value
    }

    const extractResumeText = async (selectedFile) => {
        const fileName = selectedFile.name.toLowerCase()
        const fileType = selectedFile.type || ''

        if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
            return extractTextFromPdf(selectedFile)
        }

        if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml')) {
            return extractTextFromDocx(selectedFile)
        }

        if (fileName.endsWith('.txt') || fileType.startsWith('text/')) {
            return selectedFile.text()
        }

        throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.')
    }

    const parseResumeText = (rawText) => {
        const text = rawText.replace(/\r/g, '\n').replace(/\n{2,}/g, '\n')
        const lines = text
            .split('\n')
            .map((line) => line.trim().replace(/\s+/g, ' '))
            .filter(Boolean)

        return {
            personalInfo: parsePersonalInfo(text, lines),
            experience: parseExperience(lines),
            education: parseEducation(lines),
            skills: parseSkills(lines),
            projects: parseProjects(lines)
        }
    }

    const saveParsedResume = async (parsed, selectedFile) => {
        const dbUserId = getDbUserId(user)
        if (!dbUserId) {
            throw new Error('Please sign in again before uploading resume.')
        }

        const fullName = `${parsed.personalInfo?.firstName || ''} ${parsed.personalInfo?.lastName || ''}`.trim()
        const fallbackTitle = selectedFile?.name ? selectedFile.name.replace(/\.[^.]+$/, '') : ''
        const title = parsed.personalInfo?.title || fullName || fallbackTitle || 'Uploaded Resume'

        const resumePayload = {
            personalInfo: parsed.personalInfo || {},
            experience: parsed.experience || [],
            education: parsed.education || [],
            skills: parsed.skills || [],
            projects: parsed.projects || [],
            certifications: parsed.certifications || []
        }

        const payload = {
            user_id: dbUserId,
            title,
            data: resumePayload,
            template_id: 't01',
            template: 't01',
            score: 0,
            updated_at: new Date().toISOString()
        }

        const attemptPayload = { ...payload }

        for (let attempt = 0; attempt < 6; attempt += 1) {
            const { error } = await supabase
                .from('resumes')
                .insert({
                    ...attemptPayload,
                    created_at: new Date().toISOString()
                })

            if (!error) {
                return
            }

            const fullMessage = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
            const missingColumnMatch = fullMessage.match(/Could not find the '([^']+)' column/i) || fullMessage.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)

            if (missingColumnMatch && attemptPayload[missingColumnMatch[1]] !== undefined) {
                delete attemptPayload[missingColumnMatch[1]]
                continue
            }

            throw error
        }

        throw new Error('Unable to save uploaded resume due to schema mismatch.')
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
            handleUpload(selectedFile)
        }
    }

    const handleUpload = async (selectedFile) => {
        try {
            setErrorMessage('')
            setStatus('uploading')
            const extractedText = await extractResumeText(selectedFile)

            setStatus('parsing')
            const parsed = parseResumeText(extractedText)

            // Update local store
            updatePersonalInfo(parsed.personalInfo)
            setExperience(parsed.experience)
            setEducation(parsed.education)
            setSkills(parsed.skills)
            setProjects(parsed.projects || [])
            setCertifications(parsed.certifications || [])

            await saveParsedResume(parsed, selectedFile)

            setStatus('success')
            toastSuccess('Resume uploaded and saved successfully. Redirecting to dashboard...')
            setTimeout(() => {
                navigate('/student/choice')
            }, 1200)
        } catch (error) {
            console.error('Resume parsing failed:', error)
            const message = error.message || 'Could not parse this file. Please try another resume format.'
            setErrorMessage(message)
            setStatus('error')
            toastError(message)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current.click()
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                minHeight: '100vh',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)',
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden'
            }}
        >
            <Link
                to="/student/choice"
                style={{
                    position: 'absolute', top: 'clamp(0.75rem, 3vw, 2rem)', left: 'clamp(0.75rem, 3vw, 2rem)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: '#64748b', textDecoration: 'none', fontWeight: 700
                }}
            >
                <ArrowLeft size={18} /> Back
            </Link>

            <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}>
                <div style={{ background: '#fff', padding: 'clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
                    {status === 'idle' && (
                        <>
                            <div style={{
                                width: '100px', height: '100px', background: 'rgba(79, 70, 229, 0.1)',
                                borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 2rem', color: '#4f46e5'
                            }}>
                                <Upload size={40} />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.04em' }}>Upload your <span className="text-gradient">Resume</span></h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '3rem' }}>
                                We'll automatically extract your details to get you started faster. Supports PDF, DOCX, TXT.
                            </p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.docx,.txt"
                                style={{ display: 'none' }}
                            />

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={triggerFileInput}
                                style={{
                                    padding: '3rem', border: '2px dashed #e2e8f0', borderRadius: '24px',
                                    cursor: 'pointer', transition: 'all 0.3s', background: '#f8fafc'
                                }}
                                onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
                                onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                            >
                                <div style={{ marginBottom: '1rem', color: '#4f46e5' }}>
                                    <FileText size={32} style={{ margin: '0 auto' }} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>Click to Browse Files</span>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>or drag and drop here</p>
                            </motion.div>
                        </>
                    )}

                    {(status === 'uploading' || status === 'parsing') && (
                        <div style={{ padding: '2rem 0' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 2rem' }}>
                                <Loader2 size={80} className="animate-spin" style={{ color: '#4f46e5', opacity: 0.2 }} />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                    <FileText size={32} />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                {status === 'uploading' ? 'Uploading...' : 'Parsing Resume...'}
                            </h3>
                            <p style={{ color: '#64748b' }}>Our AI is extracting your professional information.</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ padding: '2rem 0' }}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{
                                    width: '72px', height: '72px', background: '#fee2e2',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.5rem', color: '#dc2626'
                                }}
                            >
                                <X size={36} />
                            </motion.div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem', color: '#111827' }}>
                                Parsing failed
                            </h3>
                            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{errorMessage}</p>
                            <button
                                onClick={() => {
                                    setStatus('idle')
                                    setErrorMessage('')
                                    setFile(null)
                                }}
                                style={{
                                    background: '#111827',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '0.8rem 1.4rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Try another file
                            </button>
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={{ padding: '2rem 0' }}>
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                style={{
                                    width: '80px', height: '80px', background: '#10b981',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 2rem', color: '#fff'
                                }}
                            >
                                <CheckCircle2 size={40} />
                            </motion.div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>Success!</h3>
                            <p style={{ color: '#64748b' }}>Data extracted successfully. Redirecting to your selected builder template...</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
