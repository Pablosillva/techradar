import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "glow";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild, href, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b12] disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_10px_30px_-12px_rgba(34,211,238,0.65)] hover:from-cyan-300 hover:to-blue-400":
          variant === "default",
        "border border-line bg-white/[0.03] text-slate-200 hover:border-cyan-500/40 hover:bg-white/[0.06] hover:text-white":
          variant === "outline",
        "text-slate-300 hover:bg-white/[0.06] hover:text-white":
          variant === "ghost",
        "border border-line bg-panel-2 text-slate-200 hover:bg-[#162235]":
          variant === "secondary",
        "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400":
          variant === "destructive",
        "bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 text-slate-950 shadow-[0_12px_34px_-14px_rgba(139,92,246,0.75)] hover:brightness-110":
          variant === "glow",
        "h-10 px-4 py-2": size === "default",
        "h-8 rounded-lg px-3 text-xs": size === "sm",
        "h-11 rounded-lg px-6": size === "lg",
        "h-10 w-10": size === "icon",
      },
      className
    );

    if (asChild && href) {
      return (
        <Link href={href} className={classes} ref={ref as React.Ref<HTMLAnchorElement>}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
