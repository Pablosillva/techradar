import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200":
            variant === "default",
          "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200":
            variant === "secondary",
          "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300":
            variant === "outline",
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
            variant === "success",
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200":
            variant === "warning",
        },
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
