import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

interface AlertProps {
  children: ReactNode;
  type?: "success" | "error" | "warning" | "info";
  className?: string;
  onClose?: () => void;
}

export function Alert({
  children,
  type = "info",
  className = "",
  onClose,
}: AlertProps) {
  const baseClasses = "rounded-2xl p-4 flex items-center space-x-3";

  const typeClasses = {
    success: "bg-green-900/20 border border-green-500/30",
    error: "bg-red-900/20 border border-red-500/30",
    warning: "bg-yellow-900/20 border border-yellow-500/30",
    info: "bg-blue-900/20 border border-blue-500/30",
  };

  const iconClasses = {
    success: "text-green-400",
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
  };

  const textClasses = {
    success: "text-green-300",
    error: "text-red-300",
    warning: "text-yellow-300",
    info: "text-blue-300",
  };

  const classes = `${baseClasses} ${typeClasses[type]} ${className}`;

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  }[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={classes}
      >
        <IconComponent className={`w-5 h-5 ${iconClasses[type]}`} />
        <span className={`font-medium ${textClasses[type]}`}>{children}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-zinc-700/50 rounded-lg transition-colors duration-200"
          >
            <X className="w-4 h-4 text-zinc-400 hover:text-zinc-300" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
