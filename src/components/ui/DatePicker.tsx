import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./Input";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  label,
  min,
  className,
  disabled = false,
}: DatePickerProps) {
  const formattedDate = React.useMemo(() => {
    if (!value) return "---";
    try {
      const d = parseISO(value);
      return isNaN(d.getTime()) ? "---" : format(d, "dd/MM");
    } catch {
      return "---";
    }
  }, [value]);

  return (
    <div
      className={cn(
        "relative group flex flex-col gap-1 p-2 bg-background border border-border/50 rounded-button-sm hover:border-primary/50 transition-colors cursor-pointer",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
        <Calendar size={11} className="text-muted-foreground" />
        {label}
      </label>
      <div className="text-xs font-bold text-foreground truncate pl-1">
        {formattedDate}
      </div>
      <Input
        type="date"
        value={value || ""}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onClick={(e) => {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (!isMobile && "showPicker" in e.currentTarget) {
            try {
              (e.currentTarget as any).showPicker();
            } catch (err) {
              console.warn(err);
            }
          }
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 shadow-none ring-offset-transparent focus-visible:ring-0"
      />
    </div>
  );
}
