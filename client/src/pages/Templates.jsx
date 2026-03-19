import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Layout, Zap, Sparkles, Briefcase, Award } from 'lucide-react'
import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { resumeTemplates } from '../data/templates'
import EnhancedTemplateCard from '../components/templates/EnhancedTemplateCard'

export default function Templates() {
  const navigate = useNavigate()
  const { setSelectedTemplate } = useStore()
  const [filter, setFilter] = useState('all')
  const [styleFilter, setStyleFilter] = useState('All')

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
