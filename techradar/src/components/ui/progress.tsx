"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-2 overflow-hidden rounded-full bg-gray-800",
        className
      )}
      {...props}
    >
      <div
        className="bg-blue-500 h-full rounded-full transition-all duration-300"
        style={{ width: `${value ?? 0}%` }}
      />
    </div>
  )
);
Progress.displayName = "Progress";

export { Progress };
