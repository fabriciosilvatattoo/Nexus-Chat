import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full mb-2 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {content}
        </div>
      )}
    </div>
  );
}
