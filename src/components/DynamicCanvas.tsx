import React from "react";

export function DynamicCanvas() {
  return (
    <div className="absolute inset-0 flex items-center justify-center -z-10 bg-[var(--bg-primary)] overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="text-[var(--text-muted)] opacity-20 font-outfit text-2xl tracking-widest pointer-events-none select-none">
        Nexus Core v0.9.0
      </div>
    </div>
  );
}
