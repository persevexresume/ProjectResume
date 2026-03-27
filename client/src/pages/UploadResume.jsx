import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, FileText, ArrowLeft, CheckCircle2, Loader2, X } from 'lucide-react'
import useStore from '../store/useStore'
import { useToast } from '../context/ToastContext'
import { supabase, isMock } from '../supabase'
import { getDbUserId } from '../lib/userIdentity'
import * as resumeParser from '../lib/resumeParser'
import { withApiBase } from '../lib/apiBase'

export default function UploadResume() {
    const navigate = useNavigate()
    const { success: toastSuccess, error: toastError } = useToast()
    const { user, selectedTemplate, customization, setEditingResumeId, setUploadedResumePrefill, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications, setMasterProfile, applyMasterProfile } = useStore()
    const [file, setFile] = useState(null)
    const [status, setStatus] = useState('idle') // idle, uploading, parsing, success, error
    const [errorMessage, setErrorMessage] = useState('')
    const fileInputRef = useRef(null)

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
        const commonEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']
        const website = (websiteMatch?.[0] || '').toLowerCase()
        const isEmailDomain = commonEmailDomains.some(d => website.includes(d))
        
        // Find name: First non-empty line that isn't a section header and doesn't contain a phone/email/url
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
            location: locationLine || '',
            title: titleCandidate || '',
            summary: summaryLines.join(' '),
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
            .split(/[|,•·\n\t;]/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 2 && item.length <= 50)

        const deduped = [...new Set(skillTokens)]
        // Look for common skill separators within a token (e.g. "React, Node.js, Express")
        const finalSkills = []
        deduped.forEach(token => {
            const nested = token.split(/[,/]/).map(s => s.trim()).filter(Boolean)
            finalSkills.push(...nested)
        })

        return [...new Set(finalSkills)].map((name, index) => ({ 
            id: Date.now() + index, 
            name, 
            level: 'Advanced' 
        }))
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
        return entries
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
                school: schoolLine,
                degree: degreeLine,
                location: '',
                startDate: years[0] || '',
                endDate: years[1] || years[0] || '',
                gpa: '',
                description: ''
            })
            i++ // Skip next since we consumed it
        }

        return entries
    }

    const parseExperience = (lines) => {
        const expSectionLines = getSectionContent(lines, SECTION_HEADERS.experience)
        const chunks = expSectionLines.filter((line) => line.trim().length > 0)
        // More comprehensive date regex
        const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:\d{1,2},?\s*)?(?:19|20)\d{2})\s*(?:[-–—]|to)\s*((?:Present|Current|Till Date|Ongoing)|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:\d{1,2},?\s*)?(?:19|20)\d{2})/i

        const entries = []
        for (let i = 0; i < chunks.length; i += 1) {
            const current = chunks[i]
            if (!dateRegex.test(current)) continue

            // Look backward for role and company
            const prev1 = chunks[i - 1] || ''
            const prev2 = chunks[i - 2] || ''
            
            let role = ''
            let company = ''

            if (prev1 && prev2) {
                // Usually Company \n Role \n Date  OR  Role \n Company \n Date
                if (prev1.length < prev2.length) {
                    role = prev1
                    company = prev2
                } else {
                    role = prev2
                    company = prev1
                }
            } else {
                role = prev1 || 'Professional Role'
                company = 'Organization'
            }

            const details = []
            for (let j = i + 1; j < chunks.length; j++) {
                if (dateRegex.test(chunks[j]) || isLikelySectionHeader(chunks[j])) break
                details.push(chunks[j])
                if (details.length > 5) break // Don't grab too much
            }

            const dateParts = current.split(/[-–—]|to/i)

            entries.push({
                id: Date.now() + i,
                role: role.trim(),
                company: company.trim(),
                location: '',
                startDate: (dateParts[0] || '').trim(),
                endDate: (dateParts[1] || '').trim(),
                description: details.join(' ')
            })
        }

        return entries
    }

    const parseCertifications = (lines) => {
        const certLines = getSectionContent(lines, SECTION_HEADERS.certifications)
        const entries = []

        for (let i = 0; i < certLines.length; i += 1) {
            const clean = certLines[i]?.trim()
            if (!clean) continue

            const next = certLines[i + 1]?.trim() || ''
            entries.push({
                id: Date.now() + i,
                name: clean,
                issuer: next && !isLikelySectionHeader(next) ? next : '',
                issueDate: '',
                expiryDate: '',
                credentialId: '',
                link: ''
            })

            if (next && !isLikelySectionHeader(next)) {
                i += 1
            }
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

            // Preserve line structure from PDF coordinates so section parsing is reliable.
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
            projects: parseProjects(lines),
            certifications: parseCertifications(lines)
        }
    }

    const parseResumeWithAI = async (selectedFile) => {
        const formData = new FormData()
        formData.append('resume', selectedFile)

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
        if (payload?.profile) {
            return resumeParser.masterProfileToResumeData(payload.profile)
        }
        return payload?.data || {}
    }

    const mergeParsedResume = (baseParsed, aiParsed) => {
        const asArray = (value) => (Array.isArray(value) ? value : [])

        return {
            personalInfo: { ...(baseParsed.personalInfo || {}), ...(aiParsed?.personalInfo || {}) },
            experience: asArray(aiParsed?.experience).length ? aiParsed.experience : asArray(baseParsed.experience),
            education: asArray(aiParsed?.education).length ? aiParsed.education : asArray(baseParsed.education),
            skills: asArray(aiParsed?.skills).length ? aiParsed.skills : asArray(baseParsed.skills),
            projects: asArray(aiParsed?.projects).length ? aiParsed.projects : asArray(baseParsed.projects),
            certifications: asArray(aiParsed?.certifications).length ? aiParsed.certifications : asArray(baseParsed.certifications)
        }
    }

    const normalizeParsedResume = (parsed) => {
        const safeText = (value) => (typeof value === 'string' ? value.trim() : '')
        const safeArray = (value) => (Array.isArray(value) ? value : [])
        const firstNonEmpty = (...values) => values.map(safeText).find(Boolean) || ''
        const now = Date.now()

        const personal = parsed?.personalInfo || {}
        const fullName = firstNonEmpty(personal.fullName, personal.name)
        const splitName = fullName ? fullName.split(/\s+/).filter(Boolean) : []
        const firstName = firstNonEmpty(personal.firstName, splitName[0])
        const lastName = firstNonEmpty(personal.lastName, splitName.slice(1).join(' '))

        const personalInfo = {
            firstName,
            lastName,
            email: firstNonEmpty(personal.email),
            title: firstNonEmpty(personal.title, personal.headline, personal.role),
            phone: firstNonEmpty(personal.phone, personal.mobile),
            summary: firstNonEmpty(personal.summary, parsed?.summary),
            location: firstNonEmpty(personal.location, personal.address),
            github: firstNonEmpty(personal.github),
            linkedin: firstNonEmpty(personal.linkedin),
            website: firstNonEmpty(personal.website, personal.portfolio),
            profilePhoto: firstNonEmpty(personal.profilePhoto, personal.photoUrl)
        }

        const experience = safeArray(parsed?.experience).map((item, index) => {
            const role = firstNonEmpty(item?.role, item?.title, item?.position)
            const company = firstNonEmpty(item?.company, item?.organization, item?.employer)
            const startDate = firstNonEmpty(item?.startDate, item?.from, item?.start)
            const endDate = firstNonEmpty(item?.endDate, item?.to, item?.end)
            const description = firstNonEmpty(
                item?.description,
                safeArray(item?.highlights).join(' '),
                safeArray(item?.responsibilities).join(' ')
            )

            return {
                id: item?.id || now + index,
                role,
                company,
                location: firstNonEmpty(item?.location),
                startDate,
                endDate,
                description
            }
        }).filter((item) => item.role || item.company || item.description)

        const education = safeArray(parsed?.education).map((item, index) => ({
            id: item?.id || now + 1000 + index,
            school: firstNonEmpty(item?.school, item?.institution, item?.college, item?.university),
            degree: firstNonEmpty(item?.degree, item?.qualification, item?.program),
            location: firstNonEmpty(item?.location),
            startDate: firstNonEmpty(item?.startDate, item?.from, item?.start),
            endDate: firstNonEmpty(item?.endDate, item?.to, item?.end, item?.year, item?.graduationDate),
            gpa: firstNonEmpty(item?.gpa),
            description: firstNonEmpty(item?.description)
        })).filter((item) => item.school || item.degree)

        const skills = safeArray(parsed?.skills)
            .map((item, index) => {
                const now = Date.now()
                if (typeof item === 'string' && item.trim()) {
                    return { id: now + index, name: item.trim(), level: 'Advanced' }
                }
                if (item && typeof item === 'object') {
                    const name = firstNonEmpty(item.name, item.skill, item.label)
                    if (!name) return null
                    return { id: item.id || now + index, name, level: item.level || 'Advanced' }
                }
                return null
            })
            .filter(Boolean)

        const projects = safeArray(parsed?.projects).map((item, index) => ({
            id: item?.id || now + 2000 + index,
            name: firstNonEmpty(item?.name, item?.title, item?.project),
            description: firstNonEmpty(item?.description, safeArray(item?.highlights).join(' ')),
            link: firstNonEmpty(item?.link, item?.url, item?.repository),
            startDate: firstNonEmpty(item?.startDate, item?.from, item?.start),
            endDate: firstNonEmpty(item?.endDate, item?.to, item?.end)
        })).filter((item) => item.name || item.description)

        const certifications = safeArray(parsed?.certifications).map((item, index) => ({
            id: item?.id || now + 3000 + index,
            name: firstNonEmpty(item?.name, item?.title, item?.certification),
            issuer: firstNonEmpty(item?.issuer, item?.organization, item?.authority),
            issueDate: firstNonEmpty(item?.issueDate, item?.date),
            expiryDate: firstNonEmpty(item?.expiryDate, item?.expiresOn),
            credentialId: firstNonEmpty(item?.credentialId, item?.id),
            link: firstNonEmpty(item?.link, item?.url)
        })).filter((item) => item.name)

        return { personalInfo, experience, education, skills, projects, certifications }
    }

    const saveParsedResumeDraft = async (normalizedData) => {
        if (isMock) return null

        const dbUserId = getDbUserId(user)
        if (!dbUserId) {
            throw new Error('Please sign in so uploaded resume data can be saved.')
        }

        const attemptPayload = {
            user_id: dbUserId,
            data: normalizedData,
            template_id: selectedTemplate || 'prof-sebastian',
            template: selectedTemplate || 'prof-sebastian',
            customization: customization || {},
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        }

        for (let attempt = 0; attempt < 6; attempt += 1) {
            const result = await supabase
                .from('resumes')
                .insert(attemptPayload)
                .select('id')
                .single()

            if (!result.error) {
                return result.data?.id || null
            }

            const fullMessage = [result.error.message, result.error.details, result.error.hint]
                .filter(Boolean)
                .join(' | ')

            const missingColumnMatch =
                fullMessage.match(/Could not find the '([^']+)' column/i) ||
                fullMessage.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)

            if (missingColumnMatch && attemptPayload[missingColumnMatch[1]] !== undefined) {
                delete attemptPayload[missingColumnMatch[1]]
                continue
            }

            throw new Error(fullMessage || 'Failed to save uploaded resume data.')
        }

        throw new Error('Failed to save uploaded resume data after schema adaptation attempts.')
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

            let extractedText = ''
            let localExtractError = ''
            try {
                extractedText = await resumeParser.extractResumeText(selectedFile)
                if (!extractedText || extractedText.trim().length < 50) {
                    localExtractError = 'The file appears to be empty or could not be read locally.'
                    extractedText = ''
                }
            } catch (extractErr) {
                localExtractError = extractErr?.message || 'Local PDF parsing failed.'
            }

            setStatus('parsing')
            
            // Try AI parsing first, but fall back to local parsing if it fails (e.g. out of credits)
            let aiParsed = null
            let parseError = null
            
            try {
                aiParsed = await parseResumeWithAI(selectedFile)
            } catch (err) {
                console.warn('AI parsing failed, falling back to local extraction:', err.message)
                parseError = err.message
            }

            if (!extractedText && !aiParsed) {
                throw new Error(localExtractError || parseError || 'Could not read this PDF. Please try another file or start the backend server.')
            }

            // Always run local extraction as baseline/fallback
            const localParsed = extractedText
                ? resumeParser.parseResumeText(extractedText)
                : {
                    personalInfo: {},
                    experience: [],
                    education: [],
                    skills: [],
                    projects: [],
                    certifications: []
                }
            
            // Merge AI results into local results if available, else use local only
            const finalParsed = aiParsed ? resumeParser.mergeParsedResume(localParsed, aiParsed) : localParsed
            const normalized = resumeParser.normalizeParsedResume(finalParsed)
            const masterProfileData = resumeParser.createMasterProfileFromParsed(normalized)
            const resumeFromMaster = resumeParser.masterProfileToResumeData(masterProfileData)

            const hasExtractedData = Boolean(
                normalized.personalInfo.firstName ||
                normalized.personalInfo.lastName ||
                normalized.personalInfo.email ||
                normalized.personalInfo.summary ||
                normalized.experience.length ||
                normalized.education.length ||
                normalized.skills.length ||
                normalized.projects.length ||
                normalized.certifications.length
            )

            if (!hasExtractedData) {
                throw new Error(parseError || 'Could not extract usable details from this file. Please try a PDF or DOCX with readable text.')
            }

            // If we relied on fallback, show a small success toast but mention it's local only? 
            // Better to just let it succeed for the "fix it now" requirement.
            
            // Do not auto-create a resume row here; only create when user explicitly saves in Build.
            setEditingResumeId(null)
            setUploadedResumePrefill(true)

            // Update Master Profile through backend API.
            const dbUserId = getDbUserId(user)
            if (dbUserId) {
                try {
                    let saved = false
                    let apiErrorMessage = ''

                    try {
                        const saveResponse = await fetch(withApiBase('/api/master-profile'), {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: dbUserId,
                                profile: masterProfileData
                            })
                        })

                        if (!saveResponse.ok) {
                            const err = await saveResponse.json().catch(() => ({}))
                            apiErrorMessage = err?.error || `API save failed with status ${saveResponse.status}`
                            throw new Error(apiErrorMessage)
                        }

                        saved = true
                    } catch (apiErr) {
                        apiErrorMessage = apiErr?.message || apiErrorMessage || 'API save failed'
                    }

                    if (!saved) {
                        const { error: fallbackError } = await supabase
                            .from('master_profiles')
                            .upsert({
                                user_id: dbUserId,
                                profile_data: masterProfileData,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id' })

                        if (!fallbackError) {
                            saved = true
                        } else {
                            const resumeDataForProfile = resumeParser.masterProfileToResumeData(masterProfileData)
                            const profilePersonal = masterProfileData?.personal || {}
                            const [firstName = '', ...restName] = String(profilePersonal.fullName || '').split(/\s+/).filter(Boolean)
                            const lastName = restName.join(' ')

                            const adaptivePayload = {
                                user_id: dbUserId,
                                first_name: firstName,
                                last_name: lastName,
                                email: profilePersonal.email || '',
                                phone: profilePersonal.phone || '',
                                summary: masterProfileData?.summary || '',
                                website: profilePersonal.portfolioUrl || '',
                                linkedin: profilePersonal.linkedInUrl || '',
                                github: profilePersonal.githubUrl || '',
                                experience_data: resumeDataForProfile.experience || [],
                                education_data: resumeDataForProfile.education || [],
                                skills_data: resumeDataForProfile.skills || [],
                                projects_data: resumeDataForProfile.projects || [],
                                certifications_data: resumeDataForProfile.certifications || [],
                                resume_data: resumeDataForProfile,
                                master_profile: masterProfileData,
                                updated_at: new Date().toISOString()
                            }

                            let profileSaveError = fallbackError

                            for (let attempt = 0; attempt < 10; attempt += 1) {
                                const result = await supabase
                                    .from('profiles')
                                    .upsert(adaptivePayload, { onConflict: 'user_id' })

                                if (!result.error) {
                                    profileSaveError = null
                                    saved = true
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

                            if (profileSaveError) {
                                throw new Error(`${apiErrorMessage ? `${apiErrorMessage} | ` : ''}${fallbackError.message || 'Fallback save failed'} | ${profileSaveError.message || 'profiles save failed'}`)
                            }
                        }
                    }

                    setMasterProfile(masterProfileData)
                } catch (err) {
                    console.error("Error updating master profile:", err)
                }
            }

            // Update local store with AI-parsed data
            applyMasterProfile(masterProfileData)
            updatePersonalInfo(resumeFromMaster.personalInfo)
            setExperience(resumeFromMaster.experience)
            setEducation(resumeFromMaster.education)
            setSkills(resumeFromMaster.skills)
            setProjects(resumeFromMaster.projects)
            setCertifications(resumeFromMaster.certifications)

            setStatus('success')
            toastSuccess('Resume parsed successfully! Review and save your Master Profile.')
            setTimeout(() => {
                navigate('/master-profile?fromUpload=1')
            }, 1400)
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

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const droppedFiles = e.dataTransfer.files
        if (droppedFiles && droppedFiles.length > 0) {
            const selectedFile = droppedFiles[0]
            setFile(selectedFile)
            handleUpload(selectedFile)
        }
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
                padding: '2rem 2rem 5rem',
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden'
            }}
        >
            <Link
                to="/student/choice"
                style={{
                    position: 'absolute', top: '1.5rem', left: '2rem',
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
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
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
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>Resume Parsed!</h3>
                            <p style={{ color: '#64748b' }}>All your details have been extracted. Redirecting you to choose how to continue...</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
