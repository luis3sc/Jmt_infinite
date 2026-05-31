import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export type AlertVariant = "info" | "destructive" | "success" | "warning";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  info: "bg-primary/5 border-primary/20 text-foreground",
  destructive: "bg-red-500/5 border-red-500/20 text-foreground",
  success: "bg-emerald-500/5 border-emerald-500/20 text-foreground",
  warning: "bg-amber-500/5 border-amber-500/20 text-foreground",
};

const iconStyles: Record<AlertVariant, string> = {
  info: "text-primary bg-primary/10",
  destructive: "text-red-500 bg-red-500/10",
  success: "text-emerald-500 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
};

const defaultIcons: Record<AlertVariant, React.ComponentType<{ className?: string; size?: number }>> = {
  info: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, icon, children, ...props }, ref) => {
    const DefaultIcon = defaultIcons[variant];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex items-start gap-3 p-4 rounded-input border text-sm transition-all",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className={cn("p-1.5 rounded-button-sm shrink-0", iconStyles[variant])}>
          {icon || <DefaultIcon size={16} />}
        </div>
        <div className="flex-grow space-y-1">
          {title && <h5 className="font-bold leading-none tracking-tight">{title}</h5>}
          <div className="text-muted-foreground text-xs leading-relaxed font-medium">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";
