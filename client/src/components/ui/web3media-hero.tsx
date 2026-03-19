import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Cpu, FileText, ShieldCheck, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

interface FeatureIcon {
    icon: React.ReactNode;
    label: string;
    position: { x: string; y: string };
}

interface Web3MediaHeroProps {
    logo?: string;
    navigation?: Array<{
        label: string;
        onClick?: () => void;
        href?: string;
    }>;
    contactButton?: {
        label: string;
        onClick: () => void;
    };
    title: string;
    highlightedText?: string;
    subtitle: string;
    ctaButton?: {
        label: string;
        onClick: () => void;
    };
    featureIcons?: FeatureIcon[];
    trustedByText?: string;
    brands?: Array<{
        name: string;
        logo: React.ReactNode;
    }>;
    className?: string;
    children?: React.ReactNode;
}

export function Web3MediaHero({
    logo = "Persevex AI",
    navigation = [
        { label: "Templates", href: "/templates" },
        { label: "AI Builder", href: "/build" },
        { label: "Job Portal", href: "https://www.persevex.com/job-portal" },
        { label: "Support", href: "/#support" },
    ],
    contactButton,
    title = "Shaping the Future of",
    highlightedText = "High-Fidelity Resumes",
    subtitle = "Only 2% of resumes win. We make sure yours is one of them. Engineered with Neural Precision and ATS-optimized architectures.",
    ctaButton,
    featureIcons = [],
    trustedByText = "TRUSTED BY ELITE PROFESSIONALS",
    brands = [],
    className,
    children,
}: Web3MediaHeroProps) {
    // Use Resumate Blue theme
    const accentColor = "#007bff";
    const accentGlow = "rgba(0, 123, 255, 0.4)";
    const accentSubtle = "rgba(0, 123, 255, 0.1)";

    return (
        <section
            className={cn(
                "relative w-full min-h-[70vh] flex flex-col overflow-hidden",
                className
            )}
            style={{
                background: "var(--color-bg-base)", // White background as requested
            }}
            role="banner"
            aria-label="Hero section"
        >
            {/* Radial Glow Background - Enhanced for visibility */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                {/* Primary glow circle */}
                <div
                    className="absolute"
                    style={{
                        width: "1400px",
                        height: "1400px",
                        left: "50%",
                        top: "30%",
                        transform: "translate(-50%, -50%)",
                        background: `radial-gradient(circle, rgba(0, 123, 255, 0.25) 0%, rgba(0, 123, 255, 0.08) 40%, rgba(255, 255, 255, 0) 70%)`,
                        filter: "blur(80px)",
                    }}
                />
                {/* Secondary accent glow */}
                <div
                    className="absolute"
                    style={{
                        width: "800px",
                        height: "800px",
                        right: "-10%",
                        top: "60%",
                        transform: "translateY(-50%)",
                        background: `radial-gradient(circle, rgba(59, 158, 255, 0.15) 0%, rgba(59, 158, 255, 0.05) 50%, rgba(255, 255, 255, 0) 70%)`,
                        filter: "blur(60px)",
                    }}
                />
            </div>

            {/* Main Content */}
            {children ? (
                <div className="relative z-10 flex-1 flex items-center justify-center w-full">
                    {children}
                </div>
            ) : (
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-40 pb-20">
                    {/* Floating Feature Icons */}
                    {featureIcons.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="absolute hidden md:flex flex-col items-center gap-2"
                            style={{
                                left: feature.position.x,
                                top: feature.position.y,
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: [0, -15, 0],
                            }}
                            transition={{
                                opacity: { duration: 0.6, delay: 0.3 + index * 0.1 },
                                scale: { duration: 0.6, delay: 0.3 + index * 0.1 },
                                y: {
                                    duration: 4 + index * 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                },
                            }}
                        >
                            <div
                                style={{
                                    width: "70px",
                                    height: "70px",
                                    borderRadius: "20px",
                                    background: "var(--color-bg-surface)",
                                    backdropFilter: "blur(10px)",
                                    border: "1px solid var(--color-border)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: `0 10px 30px ${accentGlow.replace("0.4", "0.1")}`,
                                }}
                            >
                                {feature.icon}
                            </div>
                            <span
                                style={{
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    color: "var(--color-text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                {feature.label}
                            </span>
                        </motion.div>
                    ))}

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-col items-center justify-center max-w-4xl"
                        style={{ gap: "24px" }}
                    >
                        {/* Tagline Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50/50 flex items-center gap-2"
                        >
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                Neural Selection Active
                            </span>
                        </motion.div>

                        {/* Title */}
                        <h1
                            className="text-[var(--color-text-primary)]"
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontWeight: 900,
                                fontSize: "clamp(40px, 8vw, 84px)",
                                lineHeight: "1.1",
                                letterSpacing: "-0.02em",
                                textAlign: "center",
                                wordSpacing: "0.05em",
                                wordBreak: "keep-all",
                            }}
                        >
                            {title}
                            <br />
                            <span
                                style={{
                                    background: `linear-gradient(90deg, ${accentColor} 0%, #3b9eff 50%, ${accentColor} 100%)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                    display: "inline-block",
                                    wordSpacing: "0.05em",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {highlightedText}
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p
                            style={{
                                fontFamily: "var(--font-body)",
                                fontWeight: 500,
                                fontSize: "clamp(16px, 2.5vw, 19px)",
                                lineHeight: "1.6",
                                color: "var(--color-text-secondary)",
                                maxWidth: "600px",
                                opacity: 0.7,
                            }}
                        >
                            {subtitle}
                        </p>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="flex flex-col sm:flex-row items-center gap-4 mt-4"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={ctaButton?.onClick}
                                className="px-10 py-5 rounded-2xl transition-all flex items-center gap-3"
                                style={{
                                    background: accentColor,
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "18px",
                                    fontWeight: 900,
                                    color: "#FFFFFF",
                                    boxShadow: `0 20px 40px ${accentGlow.replace("0.4", "0.2")}`,
                                }}
                            >
                                Start Building Now <ArrowRight size={22} strokeWidth={3} />
                            </motion.button>

                            <div className="flex items-center gap-2 px-4 py-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                    Joined by <span className="text-slate-900">4,000+</span> professionals
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            )}

            {/* Brand Slider - Adapted */}
            {brands.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative z-10 w-full overflow-hidden border-t border-slate-100"
                    style={{
                        paddingTop: "20px",
                        paddingBottom: "10px",
                    }}
                >
                    {/* "Trusted by" Text */}
                    <div className="text-center mb-4">
                        <span
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "10px",
                                fontWeight: 800,
                                color: "var(--color-text-muted)",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                            }}
                        >
                            {trustedByText}
                        </span>
                    </div>

                    {/* Scrolling Brands */}
                    <motion.div
                        className="flex items-center"
                        animate={{
                            x: [0, -(brands.length * 200)],
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: brands.length * 8,
                                ease: "linear",
                            },
                        }}
                        style={{
                            gap: "100px",
                            paddingLeft: "100px",
                        }}
                    >
                        {[...brands, ...brands].map((brand, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                                style={{
                                    width: "140px",
                                    height: "40px",
                                }}
                            >
                                {brand.logo}
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
        </section>
    );
}
