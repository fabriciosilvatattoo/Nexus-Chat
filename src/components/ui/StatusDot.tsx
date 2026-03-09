import React from "react";
import { cn } from "../../lib/utils";

interface StatusDotProps {
  status: "alive" | "offline";
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-2 w-2">
        {status === "alive" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            status === "alive" ? "bg-[var(--success)]" : "bg-[var(--error)]",
          )}
        ></span>
      </div>
      <span className="text-xs text-[var(--text-muted)]">
        {status === "alive" ? "Conectado" : "Offline"}
      </span>
    </div>
  );
}
