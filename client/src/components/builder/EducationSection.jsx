import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'

export default function EducationSection({ education = [], setEdu }) {
  const [items, setItems] = useState(education || [])

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
    setEdu(updated)
  }

  const addItem = () => {
    const newItem = { school: '', degree: '', field: '', startDate: '', endDate: '', grade: '', activities: '' }
    const updated = [...items, newItem]
    setItems(updated)
    setEdu(updated)
  }

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    setEdu(updated)
  }

  return (
    <div className="space-y-6">
      {items.map((edu, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-slate-900">Education {idx + 1}</h3>
            <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="School/University" value={edu.school || ''} onChange={(e) => updateItem(idx, 'school', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Degree (e.g., Bachelor's)" value={edu.degree || ''} onChange={(e) => updateItem(idx, 'degree', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Field of Study" value={edu.field || ''} onChange={(e) => updateItem(idx, 'field', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Start Date (MM/YYYY)" value={edu.startDate || ''} onChange={(e) => updateItem(idx, 'startDate', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="End Date (MM/YYYY)" value={edu.endDate || ''} onChange={(e) => updateItem(idx, 'endDate', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Grade/GPA (optional)" value={edu.grade || ''} onChange={(e) => updateItem(idx, 'grade', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
          </div>

          <textarea placeholder="Activities, societies, honors..." value={edu.activities || ''} onChange={(e) => updateItem(idx, 'activities', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm h-20 resize-none" />
        </div>
      ))}

      <button onClick={addItem} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-700 font-bold text-sm">
        <Plus size={18} /> Add Education
      </button>
    </div>
  )
}
