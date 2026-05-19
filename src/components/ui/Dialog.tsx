"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogVariant = "default" | "fullscreen-mobile" | "bottom-sheet";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  hideCloseButton?: boolean;
  variant?: DialogVariant;
  noScroll?: boolean;
}

const Dialog = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
  hideCloseButton = false,
  variant = "default",
  noScroll = false,
}: DialogProps) => {
  // Prevent scrolling when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Framer Motion Variants for each layout type
  const getMotionVariants = () => {
    switch (variant) {
      case "fullscreen-mobile":
        return {
          initial: { 
            opacity: 0, 
            y: "100%", 
            scale: 1 
          },
          animate: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: "spring" as const, damping: 30, stiffness: 300 }
          },
          exit: { 
            opacity: 0, 
            y: "100%", 
            scale: 1,
            transition: { duration: 0.25 }
          }
        };
      case "bottom-sheet":
        return {
          initial: { 
            y: "100%", 
            opacity: 0.5 
          },
          animate: { 
            y: 0, 
            opacity: 1,
            transition: { type: "spring" as const, damping: 25, stiffness: 250 }
          },
          exit: { 
            y: "100%", 
            opacity: 0,
            transition: { duration: 0.2 }
          }
        };
      case "default":
      default:
        return {
          initial: { 
            opacity: 0, 
            scale: 0.95, 
            y: 10 
          },
          animate: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { type: "spring" as const, duration: 0.4, bounce: 0.15 }
          },
          exit: { 
            opacity: 0, 
            scale: 0.95, 
            y: 10,
            transition: { duration: 0.2 }
          }
        };
    }
  };

  const motionVariants = getMotionVariants();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-6">
          {/* Backdrop with backdrop-blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[8px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden w-full",
              // Layout specific styles
              variant === "default" && "max-w-lg rounded-[calc(var(--radius)*1.5)] max-h-[90vh] mx-4 border border-border/50",
              variant === "fullscreen-mobile" && "h-[100dvh] md:h-[90vh] md:max-w-[90vw] rounded-none md:rounded-[calc(var(--radius)*1.5)] border-none md:border border-border/50 md:border-border mt-0 md:mt-0 shadow-2xl bg-card",
              variant === "bottom-sheet" && "h-[85vh] md:h-[90vh] rounded-t-[calc(var(--radius)*1.5)] md:rounded-[calc(var(--radius)*1.5)] mt-auto md:mt-0 md:max-w-[90vw] border-t border-border/50 md:border",
              className
            )}
          >
            {/* Drawer/Sheet Indicator on Mobile (for bottom sheet visual drag handle) */}
            {variant === "bottom-sheet" && (
              <div className="mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20 md:hidden" />
            )}

            {/* Header */}
            {(title || !hideCloseButton) && (
              <div className="flex flex-col space-y-1.5 p-6 pb-4 border-b border-border/50 select-none">
                <div className="flex items-center justify-between">
                  {title && (
                    <h2 className="text-lg font-black leading-none tracking-tight">
                      {title}
                    </h2>
                  )}
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="rounded-[calc(var(--radius)*0.75)] p-2 opacity-70 transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border border-transparent hover:border-border"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            )}
            
            {/* Scrollable Content Area */}
            {noScroll ? (
              children
            ) : (
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {children}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { Dialog };
export type { DialogVariant };
