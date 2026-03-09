import React, { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  active?: boolean;
  size?: "sm" | "md" | "lg";
}

export function IconButton({
  icon: Icon,
  active,
  size = "md",
  className,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      className={cn(
        "rounded-lg transition-all duration-200 flex items-center justify-center",
        active
          ? "bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/30"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <Icon size={iconSizes[size]} />
    </button>
  );
}
