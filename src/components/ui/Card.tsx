import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, children, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 p-5 shadow-sm transition-all duration-200",
        hoverable && "hover:shadow-md hover:border-gray-300 dark:hover:border-slate-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-gray-900 dark:text-slate-100 tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-gray-500 dark:text-slate-400", className)} {...props}>
      {children}
    </p>
  );
}
