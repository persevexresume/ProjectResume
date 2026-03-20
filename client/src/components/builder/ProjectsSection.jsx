import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'

export default function ProjectsSection({ projects = [], setProjects }) {
  const [items, setItems] = useState(projects || [])

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
    setProjects(updated)
  }

  const addItem = () => {
    const newItem = { title: '', description: '', technologies: '', startDate: '', endDate: '', link: '' }
    const updated = [...items, newItem]
    setItems(updated)
    setProjects(updated)
  }

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    setProjects(updated)
  }

  return (
    <div className="space-y-6">
      {items.map((proj, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-slate-900">Project {idx + 1}</h3>
            <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Project Title" value={proj.title || ''} onChange={(e) => updateItem(idx, 'title', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Start Date (MM/YYYY)" value={proj.startDate || ''} onChange={(e) => updateItem(idx, 'startDate', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="End Date (MM/YYYY)" value={proj.endDate || ''} onChange={(e) => updateItem(idx, 'endDate', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Technologies Used (comma-separated)" value={proj.technologies || ''} onChange={(e) => updateItem(idx, 'technologies', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="url" placeholder="Project Link (optional)" value={proj.link || ''} onChange={(e) => updateItem(idx, 'link', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
          </div>

          <textarea placeholder="Project description and key achievements..." value={proj.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm h-20 resize-none" />
        </div>
      ))}

      <button onClick={addItem} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-700 font-bold text-sm">
        <Plus size={18} /> Add Project
      </button>
    </div>
  )
}
