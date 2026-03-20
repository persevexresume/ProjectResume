import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'

export default function SkillsSection({ skills = [], setSkills }) {
  const [items, setItems] = useState(skills || [])
  const [inputValue, setInputValue] = useState('')

  const addSkill = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      const updated = [...items, inputValue.trim()]
      setItems(updated)
      setSkills(updated)
      setInputValue('')
    }
  }

  const removeSkill = (index) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    setSkills(updated)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addSkill} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a skill (e.g., JavaScript, Project Management, Graphic Design)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 p-3 border border-slate-200 rounded-lg text-sm"
        />
        <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700">
          Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {items.map((skill, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
            <span className="text-sm font-bold text-slate-900">{skill}</span>
            <button onClick={() => removeSkill(idx)} className="text-slate-500 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">No skills added yet. Start by typing a skill above!</p>
        </div>
      )}
    </div>
  )
}
