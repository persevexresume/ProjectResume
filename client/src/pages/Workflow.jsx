import { motion } from 'framer-motion'
import { CheckCircle2, Zap, BarChart3, Share2, Download } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Workflow() {
    const steps = [
        {
            icon: <CheckCircle2 size={40} />,
            title: 'Sign Up',
            description: 'Create your account or get one from your admin to start building your resume.',
            color: 'emerald'
        },
        {
            icon: <Zap size={40} />,
            title: 'Choose Template',
            description: 'Browse our professionally designed resume templates and pick the one that matches your style.',
            color: 'violet'
        },
        {
            icon: <BarChart3 size={40} />,
            title: 'Fill Your Information',
            description: 'Add your personal info, work experience, education, and skills with our intuitive editor.',
            color: 'indigo'
        },
        {
            icon: <Download size={40} />,
            title: 'Download & Export',
            description: 'Download your resume as PDF, ready to send to employers or job portals.',
            color: 'amber'
        },
        {
            icon: <Share2 size={40} />,
            title: 'Share & Apply',
            description: 'Share your resume with employers and apply to jobs through our job board integration.',
            color: 'rose'
        }
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 pointer-events-none" />
                
                <div className="max-w-[1200px] mx-auto px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                            Resume Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Workflow</span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Follow these simple steps to create a professional resume in minutes.
                        </p>
                    </motion.div>

                    {/* Steps Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`relative group`}
                            >
                                {/* Step Number Badge */}
                                <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                                    {index + 1}
                                </div>

                                {/* Card */}
                                <div className={`p-8 rounded-2xl border-2 border-slate-100 hover:border-${step.color}-200 bg-white transition-all duration-300 h-full group-hover:shadow-xl`}>
                                    <div className={`text-${step.color}-600 mb-4 inline-block p-3 rounded-xl bg-${step.color}-50 group-hover:scale-110 transition-transform`}>
                                        {step.icon}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{step.description}</p>
                                </div>

                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-1 bg-gradient-to-r from-indigo-300 to-violet-300" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Key Features Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-[1200px] mx-auto px-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-black text-slate-900 mb-6">Why Choose Our Resume Builder?</h2>
                        <p className="text-xl text-slate-600">Everything you need to create a standout resume</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: 'Professional Templates', desc: 'Beautifully designed templates that pass ATS systems' },
                            { title: 'Real-time Preview', desc: 'See your resume update instantly as you type' },
                            { title: 'ATS Score', desc: 'Get feedback on how ATS-friendly your resume is' },
                            { title: 'Multiple Formats', desc: 'Download as PDF, Word, or plain text' },
                            { title: 'Cloud Storage', desc: 'Save and access your resumes anywhere' },
                            { title: 'Job Board Access', desc: 'Direct access to job opportunities' }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-8 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all"
                            >
                                <h3 className="font-black text-lg text-slate-900 mb-2">{feature.title}</h3>
                                <p className="text-slate-600">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-[800px] mx-auto px-8 text-center"
                >
                    <h2 className="text-4xl font-black text-slate-900 mb-6">
                        Ready to get started?
                    </h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Join thousands of students already building amazing resumes
                    </p>
                    <Link
                        to="/signin"
                        className="inline-block bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:shadow-lg hover:-translate-y-1 transition-all no-underline uppercase tracking-wider"
                    >
                        Start Building Now
                    </Link>
                </motion.div>
            </section>
        </div>
    )
}
