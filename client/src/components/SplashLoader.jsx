import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

const Particle = ({ delay }) => {
    const [props] = useState(() => ({
        size: Math.random() * 6 + 2,
        startX: Math.random() * 100,
        startY: Math.random() * 100,
        targetY: Math.random() * 100,
        duration: Math.random() * 3 + 2
    }))

    return (
        <motion.div
            className="absolute rounded-full bg-blue-500 opacity-0"
            style={{
                width: `${props.size}px`,
                height: `${props.size}px`,
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
            }}
            initial={{
                x: `${props.startX}vw`,
                y: `${props.startY}vh`,
                scale: 0
            }}
            animate={{
                y: [`${props.startY}vh`, `${props.targetY}vh`],
                opacity: [0, 0.4, 0],
                scale: [0, 1, 0]
            }}
            transition={{
                duration: props.duration,
                repeat: Infinity,
                delay: delay
            }}
        />
    )
}

export default function SplashLoader() {
    const [progress, setProgress] = useState(0)
    const [loadingText, setLoadingText] = useState("Initializing Engine...")

    useEffect(() => {
        const textPhases = ["Initializing Engine...", "Parsing ATS Algorithms...", "Loading Templates...", "Almost Ready..."]
        let phaseIndex = 0;

        const interval = setInterval(() => {
            setProgress(p => {
                const nav = p + Math.random() * 2.5;
                if (nav >= 100) return 100;

                // Change text based on progress
                if (nav > 25 && phaseIndex === 0) { phaseIndex++; setLoadingText(textPhases[phaseIndex]); }
                if (nav > 50 && phaseIndex === 1) { phaseIndex++; setLoadingText(textPhases[phaseIndex]); }
                if (nav > 80 && phaseIndex === 2) { phaseIndex++; setLoadingText(textPhases[phaseIndex]); }

                return nav;
            })
        }, 35)
        return () => clearInterval(interval)
    }, [])

    return (
        <motion.div
            className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-base)] z-[9999] overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {[...Array(20)].map((_, i) => <Particle key={i} delay={i * 0.2} />)}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-[50vw] h-[50vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <div className="z-10 flex flex-col items-center">
                {/* Logo Animation */}
                <motion.div
                    className="w-24 h-24 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-4 flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/10 backdrop-blur-xl shrink-0"
                    initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.1 }}
                >
                    <img
                        src="/logo.png"
                        alt="Persevex"
                        className="w-full h-full object-contain rounded-xl"
                    />
                </motion.div>

                <div className="text-center mb-12">
                    <motion.h1
                        className="text-5xl font-black text-[var(--color-text-primary)] mb-2 tracking-tighter"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        Persevex
                    </motion.h1>
                    <motion.div
                        className="text-[var(--color-text-muted)] text-[10px] font-black tracking-[0.4em] uppercase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                    >
                        Next-Gen Ecosystem
                    </motion.div>
                </div>

                {/* Loading Bar Container */}
                <motion.div
                    className="w-64 space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={loadingText}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-blue-600"
                            >
                                {loadingText}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-[var(--color-text-secondary)]">{Math.floor(progress)}%</span>
                    </div>

                    <div className="h-1.5 w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-full overflow-hidden relative shadow-inner">
                        <motion.div
                            className="h-full bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "circOut", duration: 0.2 }}
                        />
                        {/* Shimmer effect */}
                        <motion.div
                            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            animate={{ x: ['-100%', '300%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}
