import { cn } from "../../lib/utils";
import {
    CheckCircle,
    Cpu,
    Zap,
    TrendingUp,
    ShieldCheck,
    Globe,
} from "lucide-react";

const itemsSample = [
    {
        title: "AI Analysis",
        meta: "V2 Smart Engine",
        description:
            "Our AI scans your resume against thousands of job descriptions to find perfect keywords.",
        icon: <Cpu className="w-5 h-5 text-blue-500" />,
        status: "Powerful",
        tags: ["AI", "Parsing", "ATS"],
        colSpan: 2,
    },
    {
        title: "Real-time Sync",
        meta: "Fast Save",
        description: "Your changes are saved instantly across all devices.",
        icon: <Zap className="w-5 h-5 text-amber-500" />,
        status: "Active",
        tags: ["Cloud", "Auto-save"],
    },
    {
        title: "Premium Templates",
        meta: "100+ Designs",
        description: "Professionally designed templates that guarantee a second look from recruiters.",
        icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
        tags: ["Design", "PDF"],
        colSpan: 1,
    },
    {
        title: "Privacy First",
        meta: "Secure Storage",
        description: "Your data is encrypted and never shared without your permission.",
        icon: <ShieldCheck className="w-5 h-5 text-rose-500" />,
        status: "Secure",
        tags: ["Security", "Encryption"],
        colSpan: 2,
    },
];

export function BentoGrid({ items = itemsSample }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 max-w-7xl mx-auto">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        "group relative p-8 rounded-2xl overflow-hidden transition-all duration-300",
                        "border border-[var(--color-border)] bg-[var(--color-bg-surface)]",
                        "hover:shadow-lg",
                        "hover:-translate-y-1",
                        item.colSpan === 2 ? "md:col-span-2" : "col-span-1"
                    )}
                >
                    <div className="relative flex flex-col h-full space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--color-bg-elevated)] border border-[var(--color-border)] group-hover:bg-blue-600 transition-all duration-300">
                                <div className="group-hover:text-white transition-colors duration-300">
                                    {item.icon}
                                </div>
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-bold px-3 py-1 rounded-full border border-[var(--color-border)]",
                                    "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]",
                                    "transition-all duration-300 group-hover:bg-blue-500/10 group-hover:text-blue-600"
                                )}
                            >
                                {item.status || "Active"}
                            </span>
                        </div>

                        <div className="space-y-3 flex-grow">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                {item.title}
                                <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal">
                                    {item.meta}
                                </span>
                            </h3>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm opacity-80">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex items-center space-x-2">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                Learn More →
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
