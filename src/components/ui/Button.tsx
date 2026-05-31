"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  destructive: "bg-red-500 text-white shadow-sm hover:bg-red-500/90",
  outline: "border border-input bg-background hover:bg-muted hover:text-foreground",
  "outline-primary": "border border-primary bg-transparent text-primary hover:bg-primary hover:text-white shadow-sm",
  secondary: "bg-muted text-muted-foreground shadow-sm hover:bg-muted/80",
  ghost: "hover:bg-muted hover:text-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const buttonSizes = {
  default: "h-10 rounded-button px-fluid-md py-fluid-xs",
  sm: "h-9 rounded-button-sm px-fluid-sm",
  lg: "h-11 rounded-button-lg px-fluid-lg",
  xl: "h-14 rounded-button-xl px-fluid-xl text-fluid-lg",
  "2xl": "h-16 rounded-button-2xl px-fluid-2xl text-fluid-xl",
  icon: "h-10 w-10 rounded-button",
  "icon-lg": "h-11 w-11 rounded-button-lg",
  "icon-sm": "h-9 w-9 rounded-button-sm",
  "icon-xs": "h-8 w-8 rounded-button-sm",
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
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-fluid-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
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
