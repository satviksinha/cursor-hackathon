import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "solid";
  padding?: "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  variant = "glass",
  padding = "md",
}: CardProps) {
  const baseClasses = "rounded-2xl border";

  const variantClasses = {
    default: "bg-zinc-900/60 backdrop-blur-xl border-zinc-800/50",
    glass: "bg-zinc-900/60 backdrop-blur-xl border-zinc-800/50 shadow-lg",
    solid: "bg-zinc-800/40 border-zinc-700/50",
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={classes}
    >
      {children}
    </motion.div>
  );
}
