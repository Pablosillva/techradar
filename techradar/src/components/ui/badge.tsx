import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5 transition-colors",
        {
          "border-cyan-400/30 bg-cyan-400/10 text-cyan-300":
            variant === "default",
          "border-white/10 bg-white/[0.05] text-slate-300":
            variant === "secondary",
          "border-line text-slate-300": variant === "outline",
          "border-emerald-400/30 bg-emerald-400/10 text-emerald-300":
            variant === "success",
          "border-amber-400/30 bg-amber-400/10 text-amber-300":
            variant === "warning",
          "border-rose-400/30 bg-rose-400/10 text-rose-300": variant === "danger",
        },
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
