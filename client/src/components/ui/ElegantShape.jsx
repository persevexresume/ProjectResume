import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, rotate: rotate - 5 }}
            animate={{ opacity: 1, y: 0, rotate: rotate }}
            transition={{
                duration: 1.2,
                delay,
                ease: "easeOut",
            }}
            className={cn("absolute opacity-40", className)}
        >
            <div
                style={{
                    width,
                    height,
                }}
                className={cn(
                    "rounded-full bg-gradient-to-r to-transparent",
                    gradient,
                    "border border-white/10"
                )}
            />
        </motion.div>
    );
}
