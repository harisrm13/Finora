import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100 or above
  max?: number;
  color?: "primary" | "success" | "danger" | "warning" | "auto";
  height?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color = "auto",
  height = "md",
  className,
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  let barColor = "bg-[#2563EB]";
  if (color === "auto") {
    if (percentage > 90) barColor = "bg-[#DC2626]";
    else if (percentage > 75) barColor = "bg-[#F59E0B]";
    else barColor = "bg-[#16A34A]";
  } else if (color === "primary") {
    barColor = "bg-[#2563EB]";
  } else if (color === "success") {
    barColor = "bg-[#16A34A]";
  } else if (color === "danger") {
    barColor = "bg-[#DC2626]";
  } else if (color === "warning") {
    barColor = "bg-[#F59E0B]";
  }

  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-gray-500">
          <span>{percentage}%</span>
          <span>{value > max ? "Melebihi target" : `${percentage}% dari batas`}</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-gray-100", heights[height])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
