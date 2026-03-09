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
        "relative rounded-lg transition-all duration-200 flex items-center justify-center border border-transparent",
        active
          ? "text-[var(--accent)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <Icon size={iconSizes[size]} />
      {active && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent-glow)]" />
      )}
    </button>
  );
}
