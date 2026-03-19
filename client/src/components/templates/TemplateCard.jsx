import { motion } from 'framer-motion'
import { Eye, Zap } from 'lucide-react'

export default function TemplateCard({ template, index, onSelect }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onSelect}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-300 transition-all hover:-translate-y-1 cursor-pointer"
    >
      {/* Preview Area */}
      <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        {/* Template Preview Mockup */}
        <div
          className="w-full h-full rounded-lg overflow-hidden shadow-sm"
          style={{
            background: template.colors[1] || '#ffffff',
            borderLeft: `4px solid ${template.colors[0]}`
          }}
        >
          <div className="h-1/4 p-3" style={{ background: template.colors[0] }}>
            <div className="h-3 rounded w-2/3 mb-1" style={{ background: template.colors[2], opacity: 0.3 }}></div>
            <div className="h-2 rounded w-1/2" style={{ background: template.colors[2], opacity: 0.2 }}></div>
          </div>
          <div className="h-3/4 p-3 space-y-2">
            <div className="h-2 rounded w-3/4" style={{ background: template.colors[0], opacity: 0.6 }}></div>
            <div className="h-1 rounded w-full" style={{ background: template.colors[0], opacity: 0.3 }}></div>
            <div className="h-1 rounded w-5/6" style={{ background: template.colors[0], opacity: 0.3 }}></div>
            <div className="pt-2 space-y-1">
              <div className="h-1 rounded w-1/2" style={{ background: template.colors[2], opacity: 0.4 }}></div>
              <div className="h-1 rounded w-2/3" style={{ background: template.colors[2], opacity: 0.3 }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">
              {template.name}
            </h3>
            <p className="text-xs text-slate-500">{template.description}</p>
          </div>
        </div>

        {/* Color Dots */}
        <div className="flex gap-2 mb-4">
          {template.colors.map((color, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-slate-200 shadow-sm"
              style={{ background: color }}
              title={color}
            />
          ))}
        </div>

        {/* Style Badge */}
        <div className="flex gap-2 mb-4">
          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded">
            {template.style}
          </span>
        </div>

        {/* Action Buttons */}
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
          <Zap size={16} />
          Use Template
        </button>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none rounded-xl" />
    </motion.div>
  )
}
