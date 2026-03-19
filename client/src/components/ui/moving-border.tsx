"use client";
import React from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface MovingBorderProps extends MotionProps {
  children: React.ReactNode;
  duration?: number;
  borderRadius?: string;
  as?: string;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  [key: string]: any;
}

export function MovingBorder({
  children,
  duration = 2000,
  borderRadius = "1.75rem",
  className,
  containerClassName,
  borderClassName,
  ...otherProps
}: MovingBorderProps) {
  return (
    <div
      className={cn(
        "relative h-fit w-fit overflow-hidden rounded-[calc(var(--radius)-1px)]",
        containerClassName
      )}
      style={{
        "--radius": borderRadius,
      } as React.CSSProperties}
    >
      <motion.div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[calc(var(--radius)-1px)]",
          borderClassName
        )}
        style={{
          "--radius": borderRadius,
        } as React.CSSProperties}
        initial={{ backgroundPosition: "0% 50%" }}
        animate={{ backgroundPosition: "100% 50%" }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.button
        className={cn(
          "relative inline-block px-6 py-2.5 font-semibold text-white",
          className
        )}
        {...otherProps}
      >
        {children}
      </motion.button>
    </div>
  );
}
