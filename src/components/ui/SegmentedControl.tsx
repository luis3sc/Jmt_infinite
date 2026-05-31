"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  subLabel?: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  gridCols?: string; // e.g. "grid-cols-2", "grid-cols-3"
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  gridCols = "grid-cols-2",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "grid gap-3 w-full",
        gridCols,
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex flex-col items-center justify-center p-3 rounded-input border transition-all gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
              isSelected
                ? "border-primary bg-primary/5 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {Icon && (
              <div
                className={cn(
                  "p-2 rounded-button-sm transition-colors",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}
              >
                <Icon size={18} />
              </div>
            )}
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-tight leading-none">
                {option.label}
              </p>
              {option.subLabel && (
                <p className="text-[8px] opacity-60 mt-0.5 leading-none">
                  {option.subLabel}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
