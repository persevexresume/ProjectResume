import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react'
import ResumeRenderer from '../resume/ResumeRenderer'

// Sample resume data for preview
const SAMPLE_RESUME_DATA = {
    personalInfo: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        title: 'Senior Product Manager',
        summary: 'Results-driven Product Manager with 5+ years of experience leading cross-functional teams to deliver innovative digital solutions. Proven track record of increasing user engagement by 40% and driving revenue growth.',
        github: 'github.com/sarahjohnson',
        linkedin: 'linkedin.com/in/sarahjohnson',
        website: 'sarahjohnson.com'
    },
    experience: [
        {
            id: 1,
            role: 'Senior Product Manager',
            company: 'TechCorp Inc.',
            location: 'San Francisco, CA',
            startDate: 'Jan 2021',
            endDate: 'Present',
            description: 'Led product strategy and roadmap for mobile application with 2M+ users. Increased daily active users by 35% through data-driven feature prioritization. Managed team of 3 product managers and coordinated with engineering, design, and marketing.'
        },
        {
            id: 2,
            role: 'Product Manager',
            company: 'Digital Solutions LLC',
            location: 'Mountain View, CA',
            startDate: 'Jun 2019',
            endDate: 'Dec 2020',
            description: 'Owned product development for customer analytics platform. Launched 5 major features generating $2M in annual recurring revenue. Improved customer retention by 28% through targeted product improvements.'
        },
        {
            id: 3,
            role: 'Associate Product Manager',
            company: 'StartUp Ventures',
            location: 'Palo Alto, CA',
            startDate: 'Aug 2018',
            endDate: 'May 2019',
            description: 'Collaborated with engineering and design to develop and launch new features. Conducted user research and competitor analysis to inform product decisions.'
        }
    ],
    education: [
        {
            id: 1,
            degree: 'Master of Business Administration (MBA)',
            school: 'Stanford Graduate School of Business',
            location: 'Stanford, CA',
            startDate: '2017',
            endDate: '2019',
            gpa: '3.9'
        },
        {
            id: 2,
            degree: 'Bachelor of Science in Computer Science',
            school: 'University of California, Berkeley',
            location: 'Berkeley, CA',
            startDate: '2014',
            endDate: '2018',
            gpa: '3.8'
        }
    ],
    skills: [
        { id: 1, name: 'Product Strategy', level: 'Expert' },
        { id: 2, name: 'User Research', level: 'Expert' },
        { id: 3, name: 'Data Analysis', level: 'Advanced' },
        { id: 4, name: 'Agile/Scrum', level: 'Advanced' },
        { id: 5, name: 'Product Roadmapping', level: 'Expert' },
        { id: 6, name: 'Stakeholder Management', level: 'Advanced' },
        { id: 7, name: 'SQL', level: 'Intermediate' },
        { id: 8, name: 'Figma', level: 'Intermediate' }
    ]
}

export default function TemplatePreview({ template, onContinue, onBack }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl mx-auto px-4 py-8"
        >
            {/* Header */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
                >
                    <Eye size={14} />
                    Live Template Preview
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                    {template?.name || 'Template Preview'}
                </h2>
                <p className="text-slate-600 text-lg font-medium max-w-2xl">
                    Below is a sample resume using the <span className="font-black text-slate-900">{template?.name}</span> template. 
                    This shows you exactly how your resume will look once you fill in your information.
                </p>
            </div>

            {/* Tips Section */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-2xl"
                >
                    <h3 className="font-bold text-blue-900 mb-2 text-sm">📋 Design Features</h3>
                    <p className="text-xs text-blue-800">
                        This template features a {template?.category} design with {template?.layout} layout for maximum impact.
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-purple-50 border border-purple-200 rounded-2xl"
                >
                    <h3 className="font-bold text-purple-900 mb-2 text-sm">⚡ ATS Optimized</h3>
                    <p className="text-xs text-purple-800">
                        All templates are optimized for Applicant Tracking Systems to ensure your resume gets past the first screen.
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-2xl"
                >
                    <h3 className="font-bold text-green-900 mb-2 text-sm">✨ Customizable</h3>
                    <p className="text-xs text-green-800">
                        Change colors, fonts, and styling to match your personal brand while maintaining professional appeal.
                    </p>
                </motion.div>
            </div>

            {/* Preview Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-2xl shadow-slate-200"
            >
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Live Preview</h3>
                        <p className="text-xs text-slate-600 font-medium mt-1">Scroll to see the full resume</p>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">Real-time</span>
                    </div>
                </div>

                <div className="p-8 bg-white overflow-auto" style={{ maxHeight: '700px' }}>
                    {template ? (
                        <div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '138.9%' }}>
                            <ResumeRenderer
                                data={SAMPLE_RESUME_DATA}
                                templateId={template.id}
                                customization={{ themeColor: template?.colors?.[0] || '#2563eb' }}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-slate-500 font-medium">Loading template preview...</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex items-center gap-4 justify-center"
            >
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors text-sm uppercase tracking-widest"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="flex-1 max-w-xs h-px bg-slate-200" />

                <button
                    onClick={onContinue}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors text-sm uppercase tracking-widest shadow-lg shadow-blue-600/30"
                >
                    Start Building
                    <ArrowRight size={16} />
                </button>
            </motion.div>

            {/* Info Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-200"
            >
                <h4 className="font-bold text-slate-900 mb-3 text-sm">💡 Pro Tips for Your Resume</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                    <li>✓ Keep your professional summary concise and impactful (2-3 sentences)</li>
                    <li>✓ Use action verbs like "Managed", "Developed", "Implemented" in your experience descriptions</li>
                    <li>✓ Include quantifiable achievements (percentages, revenue, user numbers)</li>
                    <li>✓ Tailor your resume for each job application by highlighting relevant skills</li>
                    <li>✓ Keep formatting consistent throughout (dates, formatting, capitalization)</li>
                </ul>
            </motion.div>
        </motion.div>
    )
}
