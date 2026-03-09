import React from "react";

export function DynamicCanvas() {
  return (
    <div className="absolute inset-0 flex items-center justify-center -z-10 bg-[var(--bg-primary)]">
      <div className="text-[var(--text-muted)] opacity-30 font-outfit text-2xl tracking-widest pointer-events-none select-none">
        Nexus Core v0.9.0
      </div>
    </div>
  );
}
