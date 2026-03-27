import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, ArrowLeft, FileText, CheckCircle2, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { exportElementToPaginatedPdf } from '../lib/pdfExport'
import { useToast } from '../context/ToastContext'

export default function ProjectUpdateReportPDF() {
  const reportRef = useRef(null)
  const { success, error } = useToast()

  const handleDownload = async () => {
    try {
      if (!reportRef.current) {
        error('Could not find report element')
        return
      }
      
      // Wait for render to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await exportElementToPaginatedPdf(reportRef.current, 'Persevex_Project_Update_Report.pdf')
      success('PDF downloaded successfully!')
    } catch (err) {
      console.error('PDF Export Error:', err)
      error('Failed to generate PDF. ' + (err.message || 'Please try again.'))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Download size={20} />
            Download PDF
          </button>
        </div>

        {/* Report Preview */}
        <div 
          ref={reportRef}
          className="bg-white p-12 rounded-[2rem] shadow-xl border border-slate-100 prose prose-slate max-w-none"
        >
          <h1 className="text-4xl font-black text-slate-900 mb-8 border-b pb-6">
            PROJECT REPORT: PERSEVEX RESUME
          </h1>
          <div className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-widest">
            Engineering the Future of Digital Careers
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12 text-sm text-slate-500">
            <div>
              <span className="block font-black text-slate-900">DATE:</span>
              March 24, 2026
            </div>
            <div>
              <span className="block font-black text-slate-900">SCOPE:</span>
              Comprehensive Platform Overview
            </div>
            <div>
              <span className="block font-black text-slate-900">PREPARED FOR:</span>
              Strategic Stakeholders & Users
            </div>
            <div>
              <span className="block font-black text-slate-900">STATUS:</span>
              Confidential / Professional
            </div>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-black text-indigo-600 mb-6 flex items-center gap-3">
              1. Executive Summary
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              In an increasingly competitive global job market, the traditional resume has evolved from a simple static document into a sophisticated digital asset. <strong>Persevex Resume</strong> is a next-generation career infrastructure platform designed to bridge the gap between high-potential candidates and elite corporate opportunities.
            </p>
            <p className="text-slate-700 leading-relaxed">
              The platform leverages advanced neural parsing architectures and ATS (Applicant Tracking System) optimization engines to ensure that professionals don't just "apply" for jobs, but "win" interviews. With only 2% of resumes typically passing initial automated screenings, Persevex provides the tools necessary to place users in that top tier.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-black text-indigo-600 mb-6">
              2. Introduction
            </h2>
            <h3 className="text-lg font-bold text-slate-800 mb-4">2.1 Background</h3>
            <p className="text-slate-700 leading-relaxed mb-6">
              The digital transformation of the recruitment industry has introduced significant barriers for job seekers. Automated systems now handle the vast majority of initial resume screenings, often discarding qualified candidates due to formatting nuances or keyword mismatches.
            </p>
            <h3 className="text-lg font-bold text-slate-800 mb-4">2.2 Problem Statement</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Traditional resume-building tools focus primarily on aesthetics while ignoring the underlying "logic" required by modern recruitment software. This gap results in high rejection rates and inconsistent professional data across fragmented documents.
            </p>
            <h3 className="text-lg font-bold text-slate-800 mb-4">2.3 The Persevex Vision</h3>
            <p className="text-slate-700 leading-relaxed">
              Persevex was envisioned as a "Neural Career Engine"—a platform that understands the professional's story and translates it into the language of recruitment algorithms. The goal is to maximize efficiency, precision, and visual impact.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-black text-indigo-600 mb-6">
              3. Platform Ecosystem & Core Features
            </h2>
            
            <div className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-amber-500" /> Neural Parser & Smart Suggestions
                </h3>
                <p className="text-slate-700 mb-4">
                  One of the cornerstone features of Persevex is its intelligent parsing engine. This module serves as the primary interface between raw professional data and optimized career assets.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2 text-sm">
                  <li><strong>Semantic Classification:</strong> Categorizes achievements into standardized professional competencies.</li>
                  <li><strong>Expert-Crafted Phrases:</strong> Provides a vast library of high-impact, action-oriented bullet points statistically mapped to successful hires.</li>
                  <li><strong>Dynamic Context Awareness:</strong> Identifies gaps in professional narratives and provides real-time prompts to strengthen the profile.</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-500" /> ATS Verification & Precision Scoring
                </h3>
                <p className="text-slate-700 mb-4">
                  Our proprietary ATS Checker mimics the behavior of major corporate recruitment software to ensure maximum interview conversion.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2 text-sm">
                  <li><strong>Neural Precision Scoring:</strong> Evaluates documents through a proprietary scoring engine for specific job role alignment.</li>
                  <li><strong>Keyword Optimization:</strong> Identifies and naturally integrates critical keywords from target job descriptions.</li>
                  <li><strong>Formatting Hygiene:</strong> Stress-tests templates for 100% readability across all major ATS platforms.</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-500" /> Master Profile Architecture
                </h3>
                <p className="text-slate-700 mb-4">
                  The "Golden Record" architecture solves the problem of data fragmentation by centralizing professional history.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2 text-sm">
                  <li><strong>Centralized Repository:</strong> Maintain one comprehensive record of every project and certification.</li>
                  <li><strong>Selective Synchronization:</strong> Rapidly build role-specific resumes by picking and choosing validated components.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-black text-indigo-600 mb-6">
              4. User Experience & Design Philosophy
            </h2>
            <p className="text-slate-700 leading-relaxed mb-6">
              The design of Persevex was guided by the principle of "Invisible Engineering." While the underlying logic is complex, the user experience is designed to be effortless and premium.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="font-black text-indigo-900 mb-2">Visual Excellence</h4>
                <p className="text-xs text-indigo-700 leading-relaxed">Sleek, modern aesthetic using glassmorphism and vibrant precision for a high-end feel.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-black text-slate-900 mb-2">3-Step Workflow</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Simplified journey from Architecture Selection to Intelligence Input and final Validation.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-black text-indigo-600 mb-6">
              5. Administrative & Operations
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Persevex is built to support large-scale career ecosystems, including university career centers and recruitment agencies.
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-3">
              <li><strong>Institutional Bulk Provisioning:</strong> Manage thousands of profiles simultaneously via secure data imports.</li>
              <li><strong>Success Analytics & Reporting:</strong> aggregate talent readiness scores and cohort performance insights.</li>
              <li><strong>Role-Based Access Control:</strong> Distinct layers for candidates, counselors, and administrative staff.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-black text-indigo-600 mb-6">
              6. Data Privacy & Occupational Security
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              In an era where professional data is a primary target for digital threats, Persevex prioritizes the security and privacy of its users' career assets through:
            </p>
            <div className="space-y-4 text-sm text-slate-600 italic">
              <p>"Encrypted Profile Management using industry-standard protocols."</p>
              <p>"Secure Cloud Synchronization to ensure data integrity across all devices."</p>
              <p>"Privacy-First Design ensuring zero third-party data sharing without explicit consent."</p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-black text-indigo-600 mb-6">
              7. Strategic Impact & Roadmap
            </h2>
            <p className="text-slate-700 leading-relaxed mb-6">
              Early data from pilot cohorts suggests a <strong>+412% average boost</strong> in interview shortlisting through the use of Neural Precision tools.
            </p>
            <div className="bg-slate-900 text-white p-8 rounded-[2rem]">
              <h4 className="font-black text-indigo-400 uppercase tracking-widest text-xs mb-4">Future Enhancements</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  AI-Powered Interview Simulation & Feedback
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Enhanced Job Marketplace Integration
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Interactive Professional Microsites
                </li>
              </ul>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t text-center text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">
            Generated by Persevex Professional Infrastructure
          </div>
        </div>
      </div>
    </div>
  )
}
