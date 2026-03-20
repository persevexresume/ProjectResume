import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'

export default function CertificationsSection({ certifications = [], setCertifications }) {
  const [items, setItems] = useState(certifications || [])

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
    setCertifications(updated)
  }

  const addItem = () => {
    const newItem = { name: '', issuer: '', issueDate: '', expiryDate: '', credentialUrl: '', credentialId: '' }
    const updated = [...items, newItem]
    setItems(updated)
    setCertifications(updated)
  }

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    setCertifications(updated)
  }

  return (
    <div className="space-y-6">
      {items.map((cert, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-slate-900">Certification {idx + 1}</h3>
            <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Certification Name" value={cert.name || ''} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Issuing Organization" value={cert.issuer || ''} onChange={(e) => updateItem(idx, 'issuer', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Issue Date (MM/YYYY)" value={cert.issueDate || ''} onChange={(e) => updateItem(idx, 'issueDate', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Expiry Date (MM/YYYY)" value={cert.expiryDate || ''} onChange={(e) => updateItem(idx, 'expiryDate', e.target.value)} className="p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="url" placeholder="Credential URL (optional)" value={cert.credentialUrl || ''} onChange={(e) => updateItem(idx, 'credentialUrl', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
            <input type="text" placeholder="Credential ID (optional)" value={cert.credentialId || ''} onChange={(e) => updateItem(idx, 'credentialId', e.target.value)} className="col-span-2 p-3 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
      ))}

      <button onClick={addItem} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-700 font-bold text-sm">
        <Plus size={18} /> Add Certification
      </button>
    </div>
  )
}
