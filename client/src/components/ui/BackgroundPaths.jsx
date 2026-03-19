import { motion } from "framer-motion";

export function BackgroundPaths() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -initial-z-10 bg-[var(--color-bg-base)]">
            {/* Extremely simple static gradient blobs instead of heavy SVG paths */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-rose-500/5 rounded-full blur-[100px]" />
            <div className="absolute top-[40%] left-[20%] w-[20%] h-[20%] bg-violet-500/5 rounded-full blur-[80px]" />
        </div>
    );
}
