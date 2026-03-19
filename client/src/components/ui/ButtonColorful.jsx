import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";

export function ButtonColorful({
    className,
    label = "Get Started",
    ...props
}) {
    return (
        <button
            className={cn(
                "relative h-12 px-6 overflow-hidden rounded-xl font-bold transition-all duration-300 group",
                "bg-[var(--color-text-primary)] text-[var(--color-bg-base)] active:scale-95",
                className
            )}
            {...props}
        >
            {/* Gradient background effect */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500",
                    "opacity-0 group-hover:opacity-100",
                    "blur transition-opacity duration-300"
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2 z-10">
                <span>{label}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
        </button>
    );
}
