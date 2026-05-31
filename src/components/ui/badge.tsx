import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "error" | "ai" | "gold" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-indigo/20 text-indigo border-indigo/30",
    secondary: "bg-white/10 text-text-muted border-white/20",
    success: "bg-success/20 text-success border-success/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    error: "bg-error/20 text-error border-error/30",
    ai: "bg-ai/20 text-ai border-ai/30",
    gold: "bg-accent/20 text-accent border-accent/30",
    outline: "bg-transparent text-text-muted border-white/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
