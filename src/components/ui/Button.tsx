"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  destructive: "bg-red-500 text-white shadow-sm hover:bg-red-500/90",
  outline: "border border-input bg-background hover:bg-muted hover:text-foreground",
  secondary: "bg-muted text-muted-foreground shadow-sm hover:bg-muted/80",
  ghost: "hover:bg-muted hover:text-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const buttonSizes = {
  default: "h-10 rounded-[calc(var(--radius)*0.625)] px-4 py-2",
  sm: "h-9 rounded-[calc(var(--radius)*0.5625)] px-3",
  lg: "h-11 rounded-[calc(var(--radius)*0.6875)] px-8",
  xl: "h-14 rounded-[calc(var(--radius)*0.875)] px-10 text-base",
  "2xl": "h-16 rounded-[calc(var(--radius)*1.0)] px-12 text-lg",
  icon: "h-10 w-10 rounded-[calc(var(--radius)*0.625)]",
  "icon-lg": "h-11 w-11 rounded-[calc(var(--radius)*0.6875)]",
  "icon-sm": "h-9 w-9 rounded-[calc(var(--radius)*0.5625)]",
  "icon-xs": "h-8 w-8 rounded-[calc(var(--radius)*0.5)]",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonSizes };
