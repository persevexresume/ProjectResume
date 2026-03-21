import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Layout, Zap, Sparkles, Briefcase, Award } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import useStore from '../store/useStore'
import { resumeTemplates } from '../data/templates'
import EnhancedTemplateCard from '../components/templates/EnhancedTemplateCard'
import { supabase } from '../supabase'
import { getDbUserId } from '../lib/userIdentity'

export default function Templates() {
  const navigate = useNavigate()
  const { user, resumeData, setSelectedTemplate, setEditingResumeId, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications } = useStore()
  const [filter, setFilter] = useState('all')
  const [styleFilter, setStyleFilter] = useState('All')

  useEffect(() => {
    const hydrateFromMasterProfile = async () => {
      if (!user) return

      // Do not overwrite parsed upload data that is already present in store.
      const hasExistingResumeData = Boolean(
        resumeData?.personalInfo?.firstName ||
        resumeData?.personalInfo?.lastName ||
        resumeData?.personalInfo?.email ||
        resumeData?.personalInfo?.summary ||
        (resumeData?.experience?.length || 0) > 0 ||
        (resumeData?.education?.length || 0) > 0 ||
        (resumeData?.skills?.length || 0) > 0 ||
        (resumeData?.projects?.length || 0) > 0 ||
        (resumeData?.certifications?.length || 0) > 0
      )
      if (hasExistingResumeData) return

      const dbUserId = getDbUserId(user)
      if (!dbUserId) return

      const tableCandidates = ['profiles', 'master_profiles']
      for (const tableName of tableCandidates) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', dbUserId)
          .maybeSingle()

        if (data) {
          const city = data.city || data.location?.split(',')[0]?.trim() || ''
          const country = data.country || data.location?.split(',')[1]?.trim() || ''

          updatePersonalInfo({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            location: data.location || [city, country].filter(Boolean).join(', '),
            title: data.title || '',
            summary: data.summary || ''
          })

          setExperience(Array.isArray(data.experience_data) ? data.experience_data : [])
          setEducation(Array.isArray(data.education_data) ? data.education_data : [])
          setSkills(Array.isArray(data.skills_data) ? data.skills_data : [])
          setProjects(Array.isArray(data.projects_data) ? data.projects_data : [])
          setCertifications(Array.isArray(data.certifications_data) ? data.certifications_data : [])
          return
        }

        if (!error) continue

        const fullMessage = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
        const relationMissing = error.code === 'PGRST205' || /relation .* does not exist|schema cache|not found|404/i.test(fullMessage)
        const noRows = error.code === 'PGRST116' || /0 rows|no rows/i.test(fullMessage)
        if (relationMissing || noRows) continue
      }
    }

    hydrateFromMasterProfile()
  }, [user, resumeData, updatePersonalInfo, setExperience, setEducation, setSkills, setProjects, setCertifications])

  // Derive categories and counts from the templates data
  const categories = useMemo(() => {
    const counts = resumeTemplates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1
      return acc
    }, {})

    const base = [{ id: 'all', label: `All Templates (${resumeTemplates.length})`, icon: Layout }]
    const dynamic = Object.entries(counts).map(([cat, count]) => ({
      id: cat,
      label: `${cat} (${count})`,
      icon: cat === 'Tech' ? Zap : cat === 'Creative' ? Sparkles : cat === 'Executive' ? Briefcase : Layout
    }))
    return [...base, ...dynamic]
  }, [])

  const stylesList = useMemo(() => {
    const list = ['All', ...new Set(resumeTemplates.map(t => t.style === t.id ? 'Custom' : t.style))]
    return list
  }, [])

  const filtered = useMemo(() => {
    return resumeTemplates.filter((t) => {
      const matchesCategory = filter === 'all' || t.category === filter
      const tStyle = t.style === t.id ? 'Custom' : t.style
      const matchesStyle = styleFilter === 'All' || tStyle === styleFilter
      return matchesCategory && matchesStyle
    })
  }, [filter, styleFilter])

  const handleSelectTemplate = (templateId) => {
    // Selecting from template gallery is always a new resume flow.
    setEditingResumeId(null)
    setSelectedTemplate(templateId)
    navigate(`/build?template=${encodeURIComponent(templateId)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-16 overflow-y-auto">
      {/* Sticky Header + Filters */}
      <div className="sticky top-20 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 space-y-3">
          {/* Category Filter */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Category</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1 ${
                      filter === cat.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon size={12} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Style Filter */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Style</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {stylesList.map((style) => (
                <button
                  key={style}
                  onClick={() => setStyleFilter(style)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    styleFilter === style
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-slate-600">No templates found</p>
            <p className="text-sm text-slate-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-600 mb-6">
              Showing {filtered.length} of {resumeTemplates.length} templates
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filtered.map((template, i) => (
                  <EnhancedTemplateCard
                    key={template.id}
                    template={template}
                    index={i}
                    onSelect={() => handleSelectTemplate(template.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
