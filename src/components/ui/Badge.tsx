import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "danger" | "warning" | "neutral";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "neutral", size = "md", children, ...props }: BadgeProps) {
  const variants = {
    primary: "bg-blue-50 text-blue-700 border-blue-200/60",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    danger: "bg-red-50 text-red-700 border-red-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    neutral: "bg-gray-100 text-gray-700 border-gray-200/80",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
