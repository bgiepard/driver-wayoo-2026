import { ReactNode } from "react";

type BadgeColor = "brand" | "success" | "warning" | "error" | "info" | "gray";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  brand: "bg-brand-500/15 text-brand-400",
  success: "bg-success-500/15 text-success-400",
  warning: "bg-warning-500/15 text-warning-400",
  error: "bg-error-500/15 text-error-400",
  info: "bg-info-500/15 text-info-400",
  gray: "bg-white/5 text-white/80",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-theme-xs px-2 py-0.5",
  md: "text-theme-sm px-2.5 py-0.5",
};

export function Badge({ children, color = "brand", size = "sm", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-full font-medium ${sizeStyles[size]} ${colorStyles[color]} ${className}`}
    >
      {children}
    </span>
  );
}
