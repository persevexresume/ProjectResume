export const RESUME_CONTENT_LIMITS = {
  personal: {
    firstName: 40,
    lastName: 40,
    title: 80,
    email: 120,
    phone: 30,
    location: 100,
    website: 140,
    linkedin: 140,
    github: 140,
    summaryMax: 520
  },
  experience: {
    maxItems: 6,
    role: 90,
    company: 90,
    startDate: 24,
    endDate: 24,
    description: 520
  },
  education: {
    maxItems: 5,
    school: 100,
    degree: 100,
    endDate: 24,
    year: 24
  },
  skills: {
    maxItems: 18,
    itemMax: 36
  },
  projects: {
    maxItems: 5,
    name: 100,
    role: 80,
    link: 180,
    startDate: 24,
    endDate: 24,
    description: 420
  },
  certifications: {
    maxItems: 5,
    name: 100,
    issuer: 100,
    issueDate: 24,
    expiryDate: 24,
    credentialId: 60,
    link: 180
  }
}

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const clampText = (value, max) => {
  const raw = value == null ? '' : String(value)
  if (!Number.isFinite(max) || max <= 0) return raw
  return raw.slice(0, max)
}

const sanitizeSkills = (skills = []) => {
  const maxItems = RESUME_CONTENT_LIMITS.skills.maxItems
  const itemMax = RESUME_CONTENT_LIMITS.skills.itemMax

  return ensureArray(skills)
    .slice(0, maxItems)
    .map((skill, index) => {
      if (typeof skill === 'string') {
        const name = clampText(skill, itemMax)
        return name ? { id: Date.now() + index, name, level: 'Advanced' } : null
      }

      if (skill && typeof skill === 'object') {
        const name = clampText(skill.name || '', itemMax)
        if (!name) return null
        return {
          ...skill,
          id: skill.id || Date.now() + index,
          name,
          level: skill.level || 'Advanced'
        }
      }

      return null
    })
    .filter(Boolean)
}

export const applyResumeConstraints = (resumeData = {}) => {
  const source = resumeData && typeof resumeData === 'object' ? resumeData : {}
  const personal = source.personalInfo && typeof source.personalInfo === 'object' ? source.personalInfo : {}
  const limits = RESUME_CONTENT_LIMITS

  const summary = clampText(personal.summary || source.summary || '', limits.personal.summaryMax)

  const personalInfo = {
    ...personal,
    firstName: clampText(personal.firstName || '', limits.personal.firstName),
    lastName: clampText(personal.lastName || '', limits.personal.lastName),
    title: clampText(personal.title || '', limits.personal.title),
    email: clampText(personal.email || '', limits.personal.email),
    phone: clampText(personal.phone || '', limits.personal.phone),
    location: clampText(personal.location || '', limits.personal.location),
    website: clampText(personal.website || '', limits.personal.website),
    linkedin: clampText(personal.linkedin || '', limits.personal.linkedin),
    github: clampText(personal.github || '', limits.personal.github),
    summary
  }

  const experience = ensureArray(source.experience)
    .slice(0, limits.experience.maxItems)
    .map((item = {}) => ({
      ...item,
      role: clampText(item.role || '', limits.experience.role),
      company: clampText(item.company || '', limits.experience.company),
      startDate: clampText(item.startDate || '', limits.experience.startDate),
      endDate: clampText(item.endDate || '', limits.experience.endDate),
      description: clampText(item.description || '', limits.experience.description)
    }))

  const education = ensureArray(source.education)
    .slice(0, limits.education.maxItems)
    .map((item = {}) => ({
      ...item,
      school: clampText(item.school || item.institution || '', limits.education.school),
      institution: clampText(item.institution || item.school || '', limits.education.school),
      degree: clampText(item.degree || '', limits.education.degree),
      endDate: clampText(item.endDate || '', limits.education.endDate),
      year: clampText(item.year || '', limits.education.year)
    }))

  const projects = ensureArray(source.projects)
    .slice(0, limits.projects.maxItems)
    .map((item = {}) => ({
      ...item,
      name: clampText(item.name || '', limits.projects.name),
      role: clampText(item.role || '', limits.projects.role),
      link: clampText(item.link || '', limits.projects.link),
      startDate: clampText(item.startDate || '', limits.projects.startDate),
      endDate: clampText(item.endDate || '', limits.projects.endDate),
      description: clampText(item.description || '', limits.projects.description)
    }))

  const certifications = ensureArray(source.certifications)
    .slice(0, limits.certifications.maxItems)
    .map((item = {}) => ({
      ...item,
      name: clampText(item.name || '', limits.certifications.name),
      issuer: clampText(item.issuer || '', limits.certifications.issuer),
      issueDate: clampText(item.issueDate || '', limits.certifications.issueDate),
      expiryDate: clampText(item.expiryDate || '', limits.certifications.expiryDate),
      credentialId: clampText(item.credentialId || '', limits.certifications.credentialId),
      link: clampText(item.link || '', limits.certifications.link)
    }))

  return {
    ...source,
    personalInfo,
    summary,
    experience,
    education,
    skills: sanitizeSkills(source.skills),
    projects,
    certifications
  }
}
