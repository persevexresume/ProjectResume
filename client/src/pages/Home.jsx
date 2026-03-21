import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    CheckCircle2,
    Zap,
    ArrowRight,
    ShieldCheck,
    Cpu,
    ArrowUpRight,
    MessageSquare,
    Sparkles,
    FileText
} from 'lucide-react'
import { Header } from '../components/ui/header-3'
import { Web3MediaHero } from '../components/ui/web3media-hero'
import { BentoGrid } from '../components/ui/BentoGrid'
import { BackgroundPaths } from '../components/ui/BackgroundPaths'
import { cn } from '../lib/utils'

// Helper component for floating mockup cards
const FloatingCard = ({ children, style, delay = 0 }) => (
    <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay }}
        style={{
            position: 'absolute',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            padding: '1.2rem',
            zIndex: 10,
            ...style
        }}
    >
        {children}
    </motion.div>
)

export default function Home() {
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{ background: 'var(--color-bg-base)', overflowX: 'hidden', position: 'relative' }}
        >
            <BackgroundPaths />

            {/* 1. New High-Fidelity Hero Section */}
            <Web3MediaHero
                title="Engineering the Future"
                highlightedText="of Digital Careers"
                subtitle="Only 2% of resumes win. We make sure yours is one of them. Engineered with Neural Precision and ATS-optimized architectures for elite roles."
                featureIcons={[
                    {
                        icon: <Cpu size={32} className="text-blue-500" />,
                        label: "Neural Parser",
                        position: { x: "12%", y: "25%" },
                    },
                    {
                        icon: <ShieldCheck size={32} className="text-emerald-500" />,
                        label: "ATS Verified",
                        position: { x: "15%", y: "65%" },
                    },
                    {
                        icon: <FileText size={32} className="text-amber-500" />,
                        label: "PDF Engine",
                        position: { x: "82%", y: "30%" },
                    },
                    {
                        icon: <Sparkles size={32} className="text-violet-500" />,
                        label: "AI Suggest",
                        position: { x: "78%", y: "70%" },
                    },
                ]}
                trustedByText="TRUSTED BY ELITE PROFESSIONALS AT"
                brands={[
                    {
                        name: "Google",
                        logo: <div className="text-xl font-black text-slate-300">Google</div>
                    },
                    {
                        name: "Netflix",
                        logo: <div className="text-xl font-black text-slate-300">Netflix</div>
                    },
                    {
                        name: "Meta",
                        logo: <div className="text-xl font-black text-slate-300">Meta</div>
                    },
                    {
                        name: "Amazon",
                        logo: <div className="text-xl font-black text-slate-300">Amazon</div>
                    },
                    {
                        name: "Tesla",
                        logo: <div className="text-xl font-black text-slate-300">Tesla</div>
                    },
                ]}
                ctaButton={{
                    label: "Start Building Now",
                    onClick: () => window.location.href = "/signin",
                }}
            />

            {/* 2. Feature/Bento Section */}
            <section id="features" style={{ padding: '4rem 5% 2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative', zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full border border-blue-100"
                    >
                        Features
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, color: 'var(--color-text-primary)', letterSpacing: '-0.04em', marginBottom: '1.5rem', lineHeight: 1 }}
                    >
                        Smart Tools for <span className="text-blue-600">Smart Careers</span>
                    </motion.h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', opacity: 0.7 }}>
                        Everything you need to build, test, and ship your job-winning resume.
                    </p>
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <BentoGrid />
                </div>
            </section>

            {/* 3. Toolkit Section */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1 }}
                className="py-12 px-[5%] flex flex-col lg:flex-row items-center gap-16 max-w-[1300px] mx-auto relative z-10"
            >
                <div className="flex-1 relative order-2 lg:order-1">
                    <div className="bg-[var(--color-bg-surface)] w-full aspect-square rounded-[2rem] border border-[var(--color-border)] relative overflow-hidden shadow-2xl shadow-blue-500/5">
                        <div className="absolute inset-0 bg-[var(--color-bg-base)]" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                            <motion.div
                                className="w-[70%] h-[80%] bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 flex flex-col gap-6 relative z-10"
                                animate={{ y: [-5, 5, -5] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <div className="flex gap-4 items-center border-b-2 border-slate-50 pb-6">
                                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="w-1/2 h-4 bg-slate-800 rounded-full" />
                                        <div className="w-1/3 h-2.5 bg-slate-300 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="w-1/4 h-3 bg-blue-500/80 rounded-full" />
                                    <div className="space-y-2">
                                        <div className="w-full h-2 bg-slate-100 rounded-full" />
                                        <div className="w-full h-2 bg-slate-100 rounded-full" />
                                        <div className="w-3/4 h-2 bg-slate-100 rounded-full" />
                                    </div>
                                </div>
                                <motion.div
                                    className="absolute -bottom-4 -right-4 bg-emerald-500 text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-xl shadow-emerald-500/20 tracking-tighter"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5, type: 'spring' }}
                                >
                                    <CheckCircle2 size={16} strokeWidth={3} /> ATS VERIFIED
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 order-1 lg:order-2 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="inline-block px-4 py-1.5 mb-6 text-xs font-black tracking-widest text-blue-600 uppercase bg-blue-50 rounded-lg border border-blue-100"
                    >
                        Precision Tools
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] mb-8 leading-[0.9] tracking-tighter">
                        Everything you <br className="hidden md:block" />need to <span className="text-blue-600">win.</span>
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-lg mb-12 leading-relaxed opacity-70 font-medium">
                        Crafting a resume shouldn't be a struggle. We've built an all-one-one career infrastructure that handles the engineering while you focus on the story.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            "Direct Links to Job Boards",
                            "AI Keyword Analysis",
                            "Ultra High-Res PDF Exports",
                            "90+ Premium Architectures",
                            "Cloud Dashboard Sync"
                        ].map((text, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 p-4 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] hover:border-blue-500/30 transition-colors"
                            >
                                <CheckCircle2 className="text-blue-500" size={18} />
                                <span className="text-[var(--color-text-primary)] font-bold text-sm tracking-tight">{text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* 4. Stats Ribbon */}
            <section className="py-12 bg-[var(--color-bg-surface)] border-y border-[var(--color-border)] relative z-10">
                <div className="flex flex-col md:flex-row justify-around max-w-6xl mx-auto text-center gap-12 px-6">
                    {[
                        { val: '+412%', label: 'ATS SCORE BOOST', sub: 'Neural Precision applied' },
                        { val: '90+', label: 'RESUME ARCHITECTURES', sub: 'Pixel-perfect templates' },
                        { val: '2%', label: 'ELITE PASS RATE', sub: 'Top-tier selection' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="text-5xl md:text-7xl font-black text-[var(--color-text-primary)] mb-2 tracking-tighter">{stat.val}</div>
                            <div className="text-[var(--color-text-muted)] font-black text-xs tracking-widest uppercase mb-1">{stat.label}</div>
                            <div className="text-[var(--color-text-secondary)] text-[10px] font-bold opacity-40 uppercase tracking-widest">{stat.sub}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 4.5 Why Choose Resume Builder (Neural Architecture) */}
            <section id="why-us" className="py-24 px-[5%] relative z-10 bg-white">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] mb-16 tracking-tighter">
                        Why choose <span className="text-blue-600">Persevex?</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { title: "Expert-Crafted Phrases", desc: "Don't know what to write? Use our ready-made text suggestions powered by AI.", icon: MessageSquare, bg: "bg-amber-50", color: "text-amber-600" },
                            { title: "ATS-Optimized Formatting", desc: "Pass the screening robots with layouts designed for tracking systems.", icon: ShieldCheck, bg: "bg-emerald-50", color: "text-emerald-600" },
                            { title: "Lightning Fast Builder", desc: "Go from blank page to perfect resume in less than 5 minutes.", icon: Zap, bg: "bg-blue-50", color: "text-blue-600" }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center gap-6 p-8 rounded-3xl hover:bg-slate-50 transition-colors"
                            >
                                <div className={cn("size-16 rounded-2xl flex items-center justify-center", item.bg, item.color)}>
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">{item.title}</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4.6 Simplified Workflow */}
            <section className="py-24 px-[5%] relative z-10 bg-slate-50">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] mb-6 tracking-tighter">
                        Build your resume in <span className="text-blue-600">3 simple steps.</span>
                    </h2>
                    <p className="text-slate-500 font-medium mb-16">Our intuitive platform handles the heavy lifting so you can focus on landing the job.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Pick a template", desc: "Choose from our vast library of premium architectures." },
                            { step: "02", title: "Fill in details", desc: "Add your experience and skills with smart suggestions." },
                            { step: "03", title: "Improve and Download", desc: "Fine-tune your resume and export in high-res PDF." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm text-left relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 text-8xl font-black text-slate-50 group-hover:text-blue-50/50 transition-colors">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-4 relative z-10">{item.title}</h3>
                                <p className="text-slate-500 font-medium text-sm relative z-10">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. FAQs Section */}
            <motion.section
                id="faq"
                className="py-24 px-[5%] relative z-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
            >
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] mb-4 tracking-tighter">
                            Got <span className="text-blue-600">Questions?</span>
                        </h2>
                        <p className="text-[var(--color-text-secondary)] opacity-60 font-medium">Everything you need to know about Persevex.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: "How do I get my account details?", a: "Account verification is instant. Once you sign up, your dashboard is ready to use immediately with secure cloud sync." },
                            { q: "How does the Resume Checker work?", a: "We use a proprietary analysis engine that mimics recruitment software (ATS) to score your resume's effectiveness." },
                            { q: "Can I save more than one resume?", a: "Absolutely. Our platform supports multiple active resumes so you can tailor your application to different roles." },
                            { q: "What is the direct job apply feature?", a: "We provide deep links to major job boards like Naukri and Indeed, pre-formatted for your specific resume profile." }
                        ].map((faq, i) => (
                            <motion.div
                                key={i}
                                className={cn(
                                    "p-6 rounded-2xl border transition-all duration-300 cursor-pointer",
                                    openFaq === i
                                        ? "bg-[var(--color-bg-surface)] border-blue-500/30 shadow-xl shadow-blue-500/5"
                                        : "bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-gray-300"
                                )}
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <h4 className="font-bold text-lg text-[var(--color-text-primary)] tracking-tight">
                                        {faq.q}
                                    </h4>
                                    <motion.div
                                        animate={{ rotate: openFaq === i ? 180 : 0 }}
                                        className="text-blue-600"
                                    >
                                        <ArrowRight size={20} className="rotate-90" />
                                    </motion.div>
                                </div>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="pt-4 text-[var(--color-text-secondary)] leading-relaxed opacity-70 font-medium">
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* 6. CTA Section */}
            <section className="py-24 px-[5%] relative overflow-hidden bg-[var(--color-bg-surface)] border-y border-[var(--color-border)]">
                <div className="absolute inset-0 bg-blue-500/[0.02] bg-[radial-gradient(circle_at_center,blue-500_1px,transparent_1px)] bg-[length:32px_32px]" />
                <motion.div
                    className="max-w-4xl mx-auto text-center relative z-10 p-12 md:p-16 rounded-[2.5rem] bg-blue-600 shadow-2xl shadow-blue-500/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                >
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
                        Ready to elevate <br />your <span className="text-blue-200">digital presence?</span>
                    </h2>
                    <p className="text-blue-500 text-lg md:text-xl mb-12 opacity-80 font-medium max-w-2xl mx-auto brightness-200">
                        Join the elite community of job seekers landing roles at top-tier companies. Efficiency starts here.
                    </p>
                    <div className="flex justify-center">
                        <Link to="/signin">
                            <button className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-xl hover:bg-blue-50 transition-all active:scale-95 shadow-xl shadow-black/10 flex items-center gap-3 group">
                                Start Building Now <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* 7. Footer */}
            <footer id="support" className="bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] py-12 px-[5%] relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-[var(--color-border)] pb-12 mb-6">
                    <div className="col-span-1 md:col-span-2 space-y-8">
                        <Link to="/" className="flex items-center gap-4">
                            <img src="/logo.png" alt="Logo" className="w-20 h-20 rounded-2xl shadow-lg border border-[var(--color-border)]" />
                            <span className="text-2xl font-black tracking-tighter text-[var(--color-text-primary)] uppercase">Resume Builder</span>
                        </Link>
                        <p className="text-[var(--color-text-secondary)] opacity-60 font-medium max-w-md leading-relaxed">
                            The advanced career engine designed to help high-performers build resumes that secure interviews. Precision engineered for the modern job market.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[var(--color-text-primary)] font-black text-xs tracking-widest uppercase">Ecosystem</h4>
                        <div className="flex flex-col gap-4">
                            <Link to="/templates" className="text-sm font-bold text-[var(--color-text-secondary)] hover:text-blue-600 transition-colors">Templates</Link>
                            <Link to="/build" className="text-sm font-bold text-[var(--color-text-secondary)] hover:text-blue-600 transition-colors">Build Tool</Link>
                            <Link to="/signin" className="text-sm font-bold text-[var(--color-text-secondary)] hover:text-blue-600 transition-colors">Sign In</Link>
                            <a href="https://www.persevex.com/job-portal" className="text-sm font-bold text-[var(--color-text-secondary)] hover:text-blue-600 transition-colors">Job Portal</a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[var(--color-text-primary)] font-black text-xs tracking-widest uppercase">Connect</h4>
                        <div className="space-y-4 text-sm font-bold text-[var(--color-text-secondary)]">
                            <p className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                support@persevex.com
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                +91 86601 28339
                            </p>
                            <p className="opacity-40 leading-relaxed font-medium">
                                Sector 5a, 1A Cross Rd, <br />
                                Matrix Scheme Colony, BTM 1st, <br />
                                Bengaluru, KA 560068 (IN)
                            </p>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-0">
                    <p className="text-[var(--color-text-muted)] text-[10px] font-black tracking-widest uppercase text-center w-full">
                        © 2026 Persevex Ecosystem. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </motion.div>
    )
}
