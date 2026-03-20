import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'

export default function ExperienceSection({ experience = [], setExp }) {
  const [items, setItems] = useState(experience || [])

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
    setExp(updated)
  }

  const addItem = () => {
    const newItem = { company: '', position: '', startDate: '', endDate: '', description: '', isCurrently: false }
    const updated = [...items, newItem]
    setItems(updated)
    setExp(updated)
  }

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    setExp(updated)
  }

  return (
    <div className="space-y-6">
      {items.map((exp, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-slate-900">Experience {idx + 1}</h3>
            <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Company" value={exp.company || ''} onChange={(e) => updateItem(idx, 'company', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Position" value={exp.position || ''} onChange={(e) => updateItem(idx, 'position', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Start Date (MM/YYYY)" value={exp.startDate || ''} onChange={(e) => updateItem(idx, 'startDate', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <div className="flex items-center gap-2">
              <input type="text" placeholder="End Date (MM/YYYY)" value={exp.endDate || ''} onChange={(e) => updateItem(idx, 'endDate', e.target.value)} className="flex-1 p-3 border border-slate-200 rounded-lg text-sm" disabled={exp.isCurrently} />
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input type="checkbox" checked={exp.isCurrently || false} onChange={(e) => updateItem(idx, 'isCurrently', e.target.checked)} />
                Current
              </label>
            </div>
          </div>

          <textarea placeholder="Job description and achievements..." value={exp.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm h-20 resize-none" />
        </div>
      ))}

      <button onClick={addItem} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-700 font-bold text-sm">
        <Plus size={18} /> Add Experience
      </button>
    </div>
  )
}
