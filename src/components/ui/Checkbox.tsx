"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onChange, disabled, ...props }, ref) => {
    // Internal state if not controlled
    const [internalChecked, setInternalChecked] = React.useState(!!props.defaultChecked);
    
    const isChecked = checked !== undefined ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (checked === undefined) {
        setInternalChecked(e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <label
        className={cn(
          "relative flex items-center justify-center w-5 h-5 rounded-sm border border-primary ring-offset-background transition-colors",
          isChecked ? "bg-primary text-primary-foreground" : "bg-transparent",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-primary/10",
          className
        )}
      >
        <input
          type="checkbox"
          className="absolute opacity-0 w-0 h-0"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          ref={ref}
          {...props}
        />
        {isChecked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, type: "spring", stiffness: 300, damping: 20 }}
          >
            <Check className="h-3.5 w-3.5" />
          </motion.div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
