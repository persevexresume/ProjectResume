import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

const SECTION_HEADERS = {
  summary: ['summary', 'profile', 'objective', 'about me', 'professional summary', 'executive summary', 'professional profile'],
  experience: ['experience', 'work experience', 'employment', 'professional experience', 'work history', 'career history', 'employment history', 'professional background'],
  education: ['education', 'academic background', 'academics', 'qualification', 'academic profile', 'educational background', 'academic qualifications'],
  skills: ['skills', 'technical skills', 'core skills', 'expertise', 'specializations', 'proficiencies', 'technologies', 'technical expertise', 'key skills'],
  projects: ['projects', 'personal projects', 'key projects', 'academic projects', 'recent projects'],
  certifications: ['certifications', 'certification', 'certificates', 'certificate', 'awards', 'honors', 'achievements', 'achievement', 'certifications & awards', 'licenses', 'professional certifications', 'credentials']
}

const COMMON_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']
const KNOWN_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 'php', 'go', 'rust', 'kotlin', 'swift',
  'react', 'next.js', 'vue', 'angular', 'node.js', 'express', 'nestjs', 'django', 'flask', 'spring',
  'html', 'css', 'tailwind', 'bootstrap', 'sass', 'redux',
  'mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle', 'firebase', 'supabase', 'redis',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'github actions', 'ci/cd',
  'git', 'linux', 'postman', 'figma', 'power bi', 'tableau', 'excel', 'numpy', 'pandas', 'tensorflow', 'pytorch'
]

const stripBulletPrefix = (line = '') => line.replace(/^[\s\u2022\u2023\u25E6\u2043\u2219*\-]+/, '').trim()

const splitBulletLikeChunks = (line = '') => {
  return line
    .split(/[•·\u2022\u2023\u25E6\u2043\u2219|]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

const normalizeSectionToken = (value = '') => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const matchesSectionHeader = (line, header) => {
  const lineToken = normalizeSectionToken(line)
  const headerToken = normalizeSectionToken(header)
  if (!lineToken || !headerToken) return false
  return lineToken === headerToken || lineToken.startsWith(`${headerToken} `)
}

const isLikelySectionHeader = (line) => {
  return Object.values(SECTION_HEADERS).flat().some((header) => matchesSectionHeader(line, header))
}

const getSectionContent = (lines, headers) => {
  const headerIndexes = []
  for (let i = 0; i < lines.length; i += 1) {
    if (headers.some((header) => matchesSectionHeader(lines[i], header))) {
      headerIndexes.push(i)
    }
  }

  if (headerIndexes.length === 0) return []

  const content = []
  for (const startIndex of headerIndexes) {
    for (let i = startIndex + 1; i < lines.length; i += 1) {
      const current = lines[i]
      if (isLikelySectionHeader(current)) break
      content.push(current)
    }
  }

  return content
}

export const splitLocationParts = (locationValue = '') => {
  const raw = (locationValue || '').replace(/\s+/g, ' ').trim()
  if (!raw) {
    return { address: '', city: '', country: '', pinCode: '' }
  }

  const pinCodeMatch = raw.match(/\b\d{5,6}(?:-\d{4})?\b/)
  const pinCode = pinCodeMatch?.[0] || ''
  const withoutPin = pinCode ? raw.replace(pinCode, '').replace(/\s{2,}/g, ' ').trim() : raw

  const chunks = withoutPin
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (chunks.length === 0) {
    return { address: '', city: '', country: '', pinCode }
  }

  if (chunks.length === 1) {
    return { address: '', city: chunks[0], country: '', pinCode }
  }

  if (chunks.length === 2) {
    return { address: '', city: chunks[0], country: chunks[1], pinCode }
  }

  return {
    address: chunks.slice(0, -2).join(', '),
    city: chunks[chunks.length - 2],
    country: chunks[chunks.length - 1],
    pinCode
  }
}

const parsePersonalInfo = (text, lines) => {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/)
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[A-Za-z0-9\-_/]+/i)
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9\-_/]+/i)
  const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([A-Za-z0-9.-]+\.[A-Za-z]{2,})(?:\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]*)?/i)

  const website = (websiteMatch?.[0] || '').toLowerCase()
  const isEmailDomain = COMMON_EMAIL_DOMAINS.some((domain) => website.includes(domain))

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
  const titleCandidate = nameIndex !== -1
    ? lines.slice(nameIndex + 1, nameIndex + 4).find((line) =>
      line.trim() &&
      !isLikelySectionHeader(line) &&
      !line.includes('@') &&
      !/^\+?\d/.test(line.trim()) &&
      line.length < 100)
    : ''

  const topLines = lines.slice(0, 20)
  const locationLine = topLines.find((line) => {
    const clean = line.trim()
    if (!clean || clean.length > 120) return false
    if (clean.includes('@') || /linkedin|github|http/i.test(clean)) return false
    if (/\b(?:summary|objective|experience|education|skills|projects|certifications)\b/i.test(clean)) return false

    const locationPattern =
      /,\s*[A-Za-z]{2,}$/i.test(clean) ||
      /\b(?:street|st\.?|road|rd\.?|lane|ln\.?|avenue|ave\.?|sector|block|apartment|apt\.?|suite|city|district|state|country)\b/i.test(clean) ||
      /\b\d{5,6}(?:-\d{4})?\b/.test(clean)

    return locationPattern
  })

  const summaryLines = getSectionContent(lines, SECTION_HEADERS.summary)
  const location = locationLine || ''
  const locationParts = splitLocationParts(location)

  return {
    firstName,
    lastName,
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0]?.trim() || '',
    title: titleCandidate || '',
    summary: summaryLines.join(' '),
    location,
    address: locationParts.address,
    city: locationParts.city,
    country: locationParts.country,
    pinCode: locationParts.pinCode,
    linkedin: linkedinMatch?.[0] || '',
    github: githubMatch?.[0] || '',
    website: isEmailDomain ? '' : website
  }
}

const parseSkills = (lines) => {
  const skillSectionLines = getSectionContent(lines, SECTION_HEADERS.skills)
  const inlineSkillLines = lines
    .filter((line) => /\b(skills?|tech stack|technologies|tools)\b\s*:/i.test(line))
    .map((line) => line.split(':').slice(1).join(':').trim())
  const globalSkillHits = KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return lines.some((line) => new RegExp(`\\b${escaped}\\b`, 'i').test(line))
  })

  const sourceLines = [...skillSectionLines, ...inlineSkillLines, globalSkillHits.join(', ')].filter(Boolean)
  if (sourceLines.length === 0) return []

  const skillTokens = sourceLines
    .join(' | ')
    .split(/[|,•·\n\t;]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 50)

  const deduped = [...new Set(skillTokens)]
  const finalSkills = []
  deduped.forEach((token) => {
    const nested = token.split(/[,/]/).map((s) => s.trim()).filter(Boolean)
    finalSkills.push(...nested)
  })

  return [...new Set(finalSkills)].map((name, index) => ({ id: Date.now() + index, name, level: 'Advanced' }))
}

const parseProjects = (lines) => {
  const projectLines = getSectionContent(lines, SECTION_HEADERS.projects)
  const globalProjectLines = lines.filter((line) =>
    /\b(project|developed|built|implemented|designed|deployed|github\.com|vercel\.app|netlify\.app)\b/i.test(line)
  )
  const sourceLines = [...projectLines, ...globalProjectLines]
    .flatMap((line) => splitBulletLikeChunks(line))
    .map((line) => stripBulletPrefix(line))
    .filter(Boolean)

  const entries = []
  let currentEntry = null

  for (const line of sourceLines) {
    const clean = line.trim()
    if (!clean) continue

    const strongProjectSignal =
      /\b(project|developed|built|implemented|designed|deployed|application|platform|system|dashboard|portal|api|website|mobile app)\b/i.test(clean) ||
      /github\.com|vercel\.app|netlify\.app/i.test(clean)

    if (
      clean.length < 90 &&
      !clean.includes('  ') &&
      !/^https?:\/\//i.test(clean) &&
      !/github\.com|vercel\.app|netlify\.app/i.test(clean) &&
      (strongProjectSignal || /\s[-:|]\s/.test(clean))
    ) {
      if (currentEntry) entries.push(currentEntry)
      const splitBySeparator = clean.split(/\s[-:|]\s/)
      const candidateName = (splitBySeparator[0] || clean).trim()
      const candidateDesc = splitBySeparator.length > 1 ? splitBySeparator.slice(1).join(' - ').trim() : ''
      currentEntry = { id: Date.now() + Math.random(), name: candidateName, description: candidateDesc, link: '' }
    } else if (currentEntry) {
      const urlMatch = clean.match(/https?:\/\/[^\s]+/i)
      if (urlMatch && !currentEntry.link) {
        currentEntry.link = urlMatch[0]
      }
      currentEntry.description += (currentEntry.description ? ' ' : '') + clean
    } else if (strongProjectSignal) {
      const splitBySeparator = clean.split(/\s[-:|]\s/)
      const candidateName = (splitBySeparator[0] || clean).trim()
      const candidateDesc = splitBySeparator.length > 1 ? splitBySeparator.slice(1).join(' - ').trim() : ''
      const urlMatch = clean.match(/https?:\/\/[^\s]+/i)
      entries.push({
        id: Date.now() + Math.random(),
        name: candidateName,
        description: candidateDesc,
        link: urlMatch?.[0] || ''
      })
    }
  }

  if (currentEntry) entries.push(currentEntry)

  const seen = new Set()
  return entries.filter((entry) => {
    const key = `${(entry?.name || '').toLowerCase()}|${(entry?.description || '').toLowerCase().slice(0, 80)}|${(entry?.link || '').toLowerCase()}`
    if (!entry?.name && !entry?.description) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const parseEducation = (lines) => {
  const eduSectionLines = getSectionContent(lines, SECTION_HEADERS.education)
  const globalEduLines = lines.filter((line) =>
    /\b(education|university|college|institute|school|b\.?sc|m\.?sc|bca|mca|b\.?com|m\.?com|bachelor|master|ph\.?d|gpa|cgpa)\b/i.test(line)
  )
  const chunks = (eduSectionLines.length ? eduSectionLines : globalEduLines).filter((line) => line.trim().length > 0)
  const degreeRegex = /(b\.?tech|b\.?e|b\.?sc|m\.?sc|bca|mca|b\.?com|m\.?com|bachelor|master|m\.?tech|mba|ph\.?d|diploma|certificate|secondary|ssc|hsc)/i
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

    i += 1
  }

  return entries
}

const parseExperience = (lines) => {
  const expSectionLines = getSectionContent(lines, SECTION_HEADERS.experience)
  const chunks = expSectionLines.filter((line) => line.trim().length > 0)
  const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:\d{1,2},?\s*)?(?:19|20)\d{2})\s*(?:[-–—]|to)\s*((?:Present|Current|Till Date|Ongoing)|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:\d{1,2},?\s*)?(?:19|20)\d{2})/i

  const entries = []
  for (let i = 0; i < chunks.length; i += 1) {
    const current = chunks[i]
    if (!dateRegex.test(current)) continue

    const prev1 = chunks[i - 1] || ''
    const prev2 = chunks[i - 2] || ''

    let role = ''
    let company = ''

    if (prev1 && prev2) {
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
    for (let j = i + 1; j < chunks.length; j += 1) {
      if (dateRegex.test(chunks[j]) || isLikelySectionHeader(chunks[j])) break
      details.push(chunks[j])
      if (details.length > 5) break
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
  const globalCertLines = lines.filter((line) =>
    /\b(certification|certificate|certified|credential|license|badge|coursera|udemy|nptel|aws certified|google certified|microsoft certified)\b/i.test(line)
  )
  const sourceLines = [...certLines, ...globalCertLines]
    .flatMap((line) => splitBulletLikeChunks(line))
    .map((line) => stripBulletPrefix(line))
    .filter(Boolean)
  const entries = []

  for (let i = 0; i < sourceLines.length; i += 1) {
    let clean = sourceLines[i]?.trim()
    if (!clean) continue

    // Remove common bullet points
    clean = clean.replace(/^[•·*-]\s*/, '')
    if (!clean) continue

    // If the line looks like a date only, it's probably not a certification name
    if (/^(19|20)\d{2}$/.test(clean) || /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(clean)) {
      continue
    }

    const next = stripBulletPrefix(sourceLines[i + 1] || '')
    const splitBySep = clean.split(/\s[-:|]\s/)
    const hasKeyword = /\b(certification|certificate|certified|credential|license|badge)\b/i.test(clean)
    const certName = (splitBySep[0] || clean).trim()
    const possibleIssuer = splitBySep.length > 1 ? splitBySep.slice(1).join(' - ').trim() : ''
    const issueDateMatch = clean.match(/\b(?:19|20)\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?:19|20)\d{2}\b/i)
    const urlMatch = clean.match(/https?:\/\/[^\s]+/i)
    
    // Check if next line is likely an issuer or just another certification
    // Usually issuers are short and don't look like new certifications
    const isNextAnIssuer = next && 
                          !isLikelySectionHeader(next) && 
                          next.length < 100 && 
                          !/\b(certification|certificate|certified|credential|license|badge)\b/i.test(next)

    if (!hasKeyword && certLines.length === 0 && clean.length > 120) {
      continue
    }

    entries.push({
      id: Date.now() + i + Math.random(),
      name: certName,
      issuer: possibleIssuer || (isNextAnIssuer ? next : ''),
      issueDate: issueDateMatch?.[0] || '',
      expiryDate: '',
      credentialId: '',
      link: urlMatch?.[0] || ''
    })

    if (isNextAnIssuer) {
      i += 1
    }
  }

  const seen = new Set()
  return entries.filter((entry) => {
    const key = `${(entry?.name || '').toLowerCase()}|${(entry?.issuer || '').toLowerCase()}|${(entry?.issueDate || '').toLowerCase()}`
    if (!entry?.name) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const extractTextFromPdf = async (selectedFile) => {
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

export const extractTextFromDocx = async (selectedFile) => {
  const mammoth = await import('mammoth')
  const arrayBuffer = await selectedFile.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export const extractResumeText = async (selectedFile) => {
  const fileName = (selectedFile?.name || '').toLowerCase()
  const fileType = selectedFile?.type || ''

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

export const parseResumeText = (rawText) => {
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

export const mergeParsedResume = (baseParsed, aiParsed) => {
  const asArray = (value) => (Array.isArray(value) ? value : [])
  const asText = (value) => (typeof value === 'string' ? value.trim() : '')
  const pickRicherText = (first, second) => {
    const a = asText(first)
    const b = asText(second)
    if (!a) return b
    if (!b) return a
    return a.length >= b.length ? a : b
  }

  const mergeUniqueItems = (primary, secondary, keyBuilder) => {
    const merged = [...asArray(primary), ...asArray(secondary)]
    const seen = new Set()
    return merged.filter((item) => {
      const key = keyBuilder(item)
      if (!key) return false
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const basePersonal = baseParsed?.personalInfo || {}
  const aiPersonal = aiParsed?.personalInfo || {}
  const personalKeys = [...new Set([...Object.keys(basePersonal), ...Object.keys(aiPersonal)])]
  const personalInfo = personalKeys.reduce((acc, key) => {
    acc[key] = pickRicherText(aiPersonal[key], basePersonal[key])
    return acc
  }, {})

  return {
    personalInfo,
    experience: mergeUniqueItems(aiParsed?.experience, baseParsed?.experience, (item) => {
      const role = asText(item?.role || item?.title || item?.position)
      const company = asText(item?.company || item?.organization || item?.employer)
      const start = asText(item?.startDate || item?.from || item?.start)
      const end = asText(item?.endDate || item?.to || item?.end)
      return `${role}|${company}|${start}|${end}`.toLowerCase()
    }),
    education: mergeUniqueItems(aiParsed?.education, baseParsed?.education, (item) => {
      const school = asText(item?.school || item?.institution || item?.college || item?.university)
      const degree = asText(item?.degree || item?.qualification || item?.program)
      const end = asText(item?.endDate || item?.to || item?.end || item?.year)
      return `${school}|${degree}|${end}`.toLowerCase()
    }),
    skills: mergeUniqueItems(aiParsed?.skills, baseParsed?.skills, (item) => {
      const name = asText(typeof item === 'string' ? item : item?.name || item?.skill || item?.label)
      return name.toLowerCase()
    }),
    projects: mergeUniqueItems(aiParsed?.projects, baseParsed?.projects, (item) => {
      const name = asText(item?.name || item?.title || item?.project)
      const link = asText(item?.link || item?.url || item?.repository)
      const description = asText(item?.description || asArray(item?.highlights).join(' ')).slice(0, 80)
      return `${name}|${link}|${description}`.toLowerCase()
    }),
    certifications: mergeUniqueItems(aiParsed?.certifications, baseParsed?.certifications, (item) => {
      const name = asText(item?.name || item?.title || item?.certification)
      const issuer = asText(item?.issuer || item?.organization || item?.authority)
      const credential = asText(item?.credentialId || item?.id)
      return `${name}|${issuer}|${credential}`.toLowerCase()
    })
  }
}

export const normalizeParsedResume = (parsed) => {
  const safeText = (value) => (typeof value === 'string' ? value.trim() : '')
  const safeArray = (value) => (Array.isArray(value) ? value : [])
  const firstNonEmpty = (...values) => values.map(safeText).find(Boolean) || ''
  const now = Date.now()

  const personal = parsed?.personalInfo || {}
  const fullName = firstNonEmpty(personal.fullName, personal.name)
  const splitName = fullName ? fullName.split(/\s+/).filter(Boolean) : []
  const firstName = firstNonEmpty(personal.firstName, splitName[0])
  const lastName = firstNonEmpty(personal.lastName, splitName.slice(1).join(' '))
  const derivedLocation = firstNonEmpty(personal.location, personal.address)
  const locationParts = splitLocationParts(derivedLocation)

  const city = firstNonEmpty(personal.city, locationParts.city)
  const country = firstNonEmpty(personal.country, locationParts.country)
  const pinCode = firstNonEmpty(personal.pinCode, personal.zipCode, personal.postalCode, locationParts.pinCode)
  const address = firstNonEmpty(personal.address, locationParts.address)
  const location = firstNonEmpty(personal.location, [address, city, country].filter(Boolean).join(', '), [city, country].filter(Boolean).join(', '))

  const personalInfo = {
    firstName,
    lastName,
    email: firstNonEmpty(personal.email),
    title: firstNonEmpty(personal.title, personal.headline, personal.role),
    phone: firstNonEmpty(personal.phone, personal.mobile),
    summary: firstNonEmpty(personal.summary, parsed?.summary),
    location,
    address,
    city,
    country,
    pinCode,
    github: firstNonEmpty(personal.github),
    linkedin: firstNonEmpty(personal.linkedin),
    website: firstNonEmpty(personal.website, personal.portfolio),
    profilePhoto: firstNonEmpty(personal.profilePhoto, personal.photoUrl)
  }

  const experience = safeArray(parsed?.experience).map((item, index) => ({
    id: item?.id || now + index,
    role: firstNonEmpty(item?.role, item?.title, item?.position),
    company: firstNonEmpty(item?.company, item?.organization, item?.employer),
    location: firstNonEmpty(item?.location),
    startDate: firstNonEmpty(item?.startDate, item?.from, item?.start),
    endDate: firstNonEmpty(item?.endDate, item?.to, item?.end),
    description: firstNonEmpty(
      item?.description,
      safeArray(item?.highlights).join(' '),
      safeArray(item?.responsibilities).join(' ')
    )
  })).filter((item) => item.role || item.company || item.description)

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

  const skills = safeArray(parsed?.skills).map((item, index) => {
    if (typeof item === 'string' && item.trim()) {
      return { id: now + 1500 + index, name: item.trim(), level: 'Advanced' }
    }
    if (item && typeof item === 'object') {
      const name = firstNonEmpty(item.name, item.skill, item.label)
      if (!name) return null
      return { id: item.id || now + 1500 + index, name, level: item.level || 'Advanced' }
    }
    return null
  }).filter(Boolean)

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
