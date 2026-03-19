import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, XCircle, Zap, Copy } from 'lucide-react'

export default function ATSChecker({ onClose }) {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [instantChecks, setInstantChecks] = useState({
    emailPresent: false,
    phonePresent: false,
    wordCountValid: false,
    noTables: false,
    issues: []
  })

  // Instant client-side checks
  const runInstantChecks = (resume) => {
    const issues = []
    const checks = {
      emailPresent: false,
      phonePresent: false,
      wordCountValid: false,
      noTables: false,
      issues: []
    }

    // Check for email
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/
    checks.emailPresent = emailRegex.test(resume)
    if (!checks.emailPresent) issues.push('❌ No email address found')

    // Check for phone
    const phoneRegex = /(\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?[2-9]\d{2}[-.\s]?\d{4}/
    checks.phonePresent = phoneRegex.test(resume)
    if (!checks.phonePresent) issues.push('❌ No phone number found')

    // Check word count (150-800 words)
    const wordCount = resume.trim().split(/\s+/).length
    checks.wordCountValid = wordCount >= 150 && wordCount <= 800
    if (!checks.wordCountValid) {
      issues.push(`❌ Word count ${wordCount} is outside recommended range (150-800)`)
    }

    // Check for tables
    checks.noTables = !/(<table|<tr|<td)/i.test(resume)
    if (!checks.noTables) issues.push('❌ Tables detected - ATS systems struggle with table formatting')

    checks.issues = issues
    setInstantChecks(checks)
    return checks
  }

  const handleCheckATS = async () => {
    setError('')
    setResults(null)

    // Run instant checks
    const checks = runInstantChecks(resumeText)
    
    if (!resumeText.trim()) {
      setError('Please enter your resume text')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please enter the job description')
      return
    }

    setLoading(true)
    const stages = ['Analyzing resume structure...', 'Scanning for keywords...', 'Evaluating formatting...', 'Generating ATS score...']
    let stageIndex = 0

    // Stage animation loop
    const stageInterval = setInterval(() => {
      setStage(stages[stageIndex % stages.length])
      stageIndex++
    }, 800)

    try {
      const response = await fetch('/api/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'ATS check failed')
      }

      const data = await response.json()
      
      // Merge instant checks into formatting_issues
      const mergedData = {
        ...data.data,
        formatting_issues: [...(data.data.formatting_issues || []), ...checks.issues].filter(Boolean)
      }

      setResults(mergedData)
    } catch (err) {
      setError(err.message || 'Failed to check ATS score')
    } finally {
      clearInterval(stageInterval)
      setLoading(false)
      setStage('')
    }
  }

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'Excellent': return '#10b981'
      case 'Good': return '#3b82f6'
      case 'Needs Improvement': return '#f59e0b'
      case 'Weak': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getSectionStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 size={18} style={{ color: '#10b981' }} />
      case 'warning':
        return <AlertCircle size={18} style={{ color: '#f59e0b' }} />
      case 'fail':
        return <XCircle size={18} style={{ color: '#ef4444' }} />
      default:
        return null
    }
  }

  const Container = ({ children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {children}
      </div>
    </motion.div>
  )

  return (
    <Container>
      <div style={{ padding: '2rem', background: 'white' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={28} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>ATS Checker</h1>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {!results ? (
          // Input Section
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {/* Resume Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Your Resume
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  boxSizing: 'border-box',
                  fontColor: '#1f2937',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                Word count: {resumeText.trim().split(/\s+/).filter(w => w).length}
              </div>
            </div>

            {/* Job Description Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  boxSizing: 'border-box',
                  color: '#1f2937',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Check Button */}
            <motion.button
              onClick={handleCheckATS}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                padding: '0.875rem 1.5rem',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%'
                    }}
                  />
                  {stage}
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Check ATS Score
                </>
              )}
            </motion.button>
          </div>
        ) : (
          // Results Section
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Overall Score */}
            <div style={{ textAlign: 'center', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 1rem' }}>
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={getVerdictColor(results.verdict)}
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    initial={{ strokeDashoffset: `${2 * Math.PI * 45}` }}
                    animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - results.overall_score / 100)}` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: getVerdictColor(results.verdict) }}>
                    {results.overall_score}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>out of 100</div>
                </motion.div>
              </div>

              {/* Verdict Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1.5rem',
                  backgroundColor: getVerdictColor(results.verdict) + '20',
                  color: getVerdictColor(results.verdict),
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}
              >
                {results.verdict}
              </motion.div>

              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                Estimated Pass Rate: <strong>{results.estimated_pass_rate}</strong>
              </p>
            </div>

            {/* Keyword Analysis */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', margin: '0 0 1rem' }}>
                Keyword Match: {results.keyword_analysis.match_percent}%
              </h3>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#e5e7eb',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${results.keyword_analysis.match_percent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #0ea5e9)',
                    borderRadius: '999px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Matched Keywords */}
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981', margin: '0 0 0.75rem' }}>
                    ✓ Matched Keywords ({results.keyword_analysis.matched.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {results.keyword_analysis.matched.slice(0, 8).map((keyword, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          borderRadius: '16px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {keyword}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ef4444', margin: '0 0 0.75rem' }}>
                    ✗ Missing Keywords ({results.keyword_analysis.missing.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {results.keyword_analysis.missing.slice(0, 8).map((keyword, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          borderRadius: '16px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {keyword}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section Scores */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem' }}>Section Analysis</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(results.sections || {}).map(([section, data]) => (
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textTransform: 'capitalize', fontWeight: 700 }}>
                        {getSectionStatusIcon(data.status)}
                        {section}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6b7280' }}>
                        {data.score}/100
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: data.status === 'pass' ? '#10b981' : data.status === 'warning' ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    {data.issues && data.issues.length > 0 && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        {data.issues.join(', ')}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            {results.strengths && results.strengths.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem', color: '#10b981' }}>
                  ✓ Strengths
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {results.strengths.map((strength, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#dcfce7',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#166534',
                        borderLeft: '4px solid #10b981'
                      }}
                    >
                      {strength}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues & Formatting */}
            {results.formatting_issues && results.formatting_issues.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem', color: '#ef4444' }}>
                  ✗ Formatting Issues
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {results.formatting_issues.map((issue, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#fee2e2',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#991b1b',
                        borderLeft: '4px solid #ef4444'
                      }}
                    >
                      {issue}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {results.recommendations && results.recommendations.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem', color: '#3b82f6' }}>
                  💡 Top Recommendations
                </h3>
                <ol style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {results.recommendations.slice(0, 5).map((rec, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#eff6ff',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#1e40af',
                        borderLeft: '4px solid #3b82f6'
                      }}
                    >
                      {rec}
                    </motion.li>
                  ))}
                </ol>
              </div>
            )}

            {/* Back Button */}
            <motion.button
              onClick={() => setResults(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '1rem'
              }}
            >
              ← Check Another Resume
            </motion.button>
          </motion.div>
        )}
      </div>
    </Container>
  )
}
