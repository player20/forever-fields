"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { pageTransitionVariants } from "./variants";

interface PageTransitionProps extends HTMLMotionProps<"main"> {
  className?: string;
}

export function PageTransition({
  children,
  className,
  ...props
}: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.main
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={pageTransitionVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
