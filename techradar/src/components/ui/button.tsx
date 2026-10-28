import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild, href, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500":
          variant === "default",
        "border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800":
          variant === "outline",
        "hover:bg-gray-100 focus-visible:ring-gray-500 dark:hover:bg-gray-800":
          variant === "ghost",
        "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700":
          variant === "secondary",
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500":
          variant === "destructive",
        "h-10 px-4 py-2": size === "default",
        "h-8 rounded-md px-3 text-xs": size === "sm",
        "h-11 rounded-md px-8": size === "lg",
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
