import { motion } from "framer-motion";
import { Circle, ArrowRight, CheckCircle, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { ElegantShape } from "./ElegantShape";

export function HeroGeometric({
    badge = "Neural Selection Enabled",
    title1 = "Create an impressive",
    title2 = "resume with a free resume builder.",
}) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1],
            },
        }),
    };

    return (
        <div className="relative min-h-[70vh] w-full flex items-center justify-center overflow-hidden bg-[var(--color-bg-base)] pt-20">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="from-indigo-500/[0.12]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="from-rose-500/[0.12]"
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-violet-500/[0.12]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6">
                {/* Visual Graphics - Left Side (Pure CSS Graphic) */}
                <div className="hidden lg:block absolute left-[-15%] xl:left-[-10%] top-1/2 -translate-y-1/2 w-[300px] pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, x: -100, rotate: -20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, rotate: -10, scale: 1 }}
                        transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                        className="relative"
                    >
                        {/* CSS Abstract Resume Graphic */}
                        <div className="w-full aspect-[3/4] bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] p-6 space-y-4">
                            <div className="flex gap-3 items-center border-b border-[var(--color-border)] pb-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-1/2 bg-indigo-500/20 rounded-full" />
                                    <div className="h-2 w-1/3 bg-[var(--color-border)] rounded-full" />
                                </div>
                            </div>
                            <div className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-[var(--color-bg-elevated)] rounded-full" />
                                    <div className="h-2 w-full bg-[var(--color-bg-elevated)] rounded-full" />
                                    <div className="h-2 w-3/4 bg-[var(--color-bg-elevated)] rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-1/4 bg-indigo-500/30 rounded-full mb-4" />
                                    <div className="h-2 w-full bg-[var(--color-bg-elevated)] rounded-full" />
                                    <div className="h-2 w-5/6 bg-[var(--color-bg-elevated)] rounded-full" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="h-6 bg-indigo-500/10 rounded-md" />
                                    <div className="h-6 bg-indigo-500/10 rounded-md" />
                                    <div className="h-6 bg-indigo-500/10 rounded-md" />
                                </div>
                            </div>
                        </div>

                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="absolute -top-6 -right-6 p-4 bg-blue-600 rounded-xl shadow-xl shadow-blue-600/20"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                                    <Cpu className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white">AI Analysis</p>
                                    <p className="text-[8px] text-white/70 font-bold uppercase tracking-widest">Optimizing...</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Visual Graphics - Right Side */}
                <div className="hidden lg:block absolute right-[-10%] xl:right-[-5%] top-1/2 -translate-y-1/2 w-[280px] pointer-events-none opacity-50">
                    <motion.div
                        initial={{ opacity: 0, x: 50, rotate: 10, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, rotate: 5, scale: 1 }}
                        transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                        className="relative space-y-4"
                    >
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                </div>
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full" />
                                <div className="h-1.5 w-3/4 bg-slate-50 dark:bg-slate-800 rounded-full" />
                                <div className="h-1.5 w-1/2 bg-blue-500/10 rounded-full" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 md:mb-12"
                        style={{ willChange: "transform, opacity" }}
                    >
                        <Circle className="h-2 w-2 fill-blue-500/80" />
                        <span className="text-sm text-[var(--color-text-secondary)] tracking-wide">
                            {badge}
                        </span>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        style={{ willChange: "transform, opacity" }}
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 md:mb-8 tracking-tighter leading-[0.9]">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[var(--color-text-primary)] to-[var(--color-text-secondary)]">
                                {title1}
                            </span>
                            <br />
                            <span
                                className={cn(
                                    "bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-600 to-blue-400"
                                )}
                            >
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        style={{ willChange: "transform, opacity" }}
                    >
                        <p className="text-base sm:text-lg text-[var(--color-text-secondary)] mb-10 leading-relaxed font-medium tracking-wide max-w-xl mx-auto px-4 opacity-70">
                            The first step to a better job? A better resume. Only 2% of resumes win,
                            and yours will be one of them. Engineered with Neural Precision.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/build" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2">
                                    Start Building <ArrowRight size={20} />
                                </button>
                            </Link>

                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-transparent to-transparent pointer-events-none" />
        </div>
    );
}
