import { useState, useEffect } from 'react'

export default function SummarySection({ data = {}, update }) {
  const [summary, setSummary] = useState(data.summary || '')
  const [title, setTitle] = useState(data.title || '')

  useEffect(() => {
    setSummary(data.summary || '')
    setTitle(data.title || '')
  }, [data])

  const handleSummaryChange = (value) => {
    setSummary(value)
    update({ summary: value })
  }

  const handleTitleChange = (value) => {
    setTitle(value)
    update({ title: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">Professional Title</label>
        <input
          type="text"
          placeholder="e.g., Senior Software Engineer, Product Manager"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">Professional Summary</label>
        <textarea
          placeholder="Write a brief paragraph about yourself, your key skills, and career goals. Keep it to 3-5 sentences."
          value={summary}
          onChange={(e) => handleSummaryChange(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-lg text-sm h-32 resize-none outline-none focus:border-blue-600"
          maxLength={500}
        />
        <div className="mt-2 text-right text-xs text-slate-500">
          {summary.length}/500 characters
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>Pro tip:</strong> A strong professional summary highlights your top 2-3 achievements, shows your career direction, and matches keywords from the job description. Keep it concise and impactful!
          </p>
        </div>
      </div>
    </div>
  )
}
