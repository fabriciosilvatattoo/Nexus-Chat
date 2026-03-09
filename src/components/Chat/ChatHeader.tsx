import React from "react";
import { PanelLeft, PanelRight, PhoneCall, Minimize2 } from "lucide-react";
import { StatusDot } from "../ui/StatusDot";
import { IconButton } from "../ui/IconButton";
import { SettingsDropdown } from "./SettingsDropdown";
import { ChatMode, NexusHealth, ToolState } from "../../types";
import { cn } from "../../lib/utils";

interface ChatHeaderProps {
  health: NexusHealth & { latency?: number };
  mode: ChatMode;
  onToggleMode: () => void;
  onClearChat: () => void;
  tools: ToolState;
  onOpenLiveVoice: () => void;
  onCollapse: () => void;
}

export function ChatHeader({
  health,
  mode,
  onToggleMode,
  onClearChat,
  tools,
  onOpenLiveVoice,
  onCollapse,
}: ChatHeaderProps) {
  const isSidebar = mode.startsWith("sidebar");
  const activeToolsCount = Object.values(tools).filter(Boolean).length;

  return (
    <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-outfit text-base sm:text-lg font-semibold text-[var(--text-primary)] tracking-wide truncate">
              Nexus Core
            </h1>
            {!isSidebar && (
              <span className="hidden sm:inline-block flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]">
                {health.version}
              </span>
            )}
          </div>
          <StatusDot status={health.status} className="flex-shrink-0" />
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {activeToolsCount > 0 && !isSidebar && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--accent-glow)] border border-[var(--accent)]/20 text-[10px] text-[var(--accent)] font-medium">
            <span className="relative flex h-1.5 w-1.5 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]"></span>
            </span>
            {activeToolsCount} tool{activeToolsCount > 1 ? "s" : ""}
          </div>
        )}

        {!isSidebar && activeToolsCount > 0 && (
          <div className="hidden sm:block h-6 w-px bg-[var(--border)] mx-1" />
        )}

        <button
          onClick={onOpenLiveVoice}
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all text-sm font-medium"
          title="Conversa ao Vivo"
        >
          <PhoneCall size={16} />
          {!isSidebar && <span className="hidden sm:inline">Ao Vivo</span>}
        </button>

        <div className="h-6 w-px bg-[var(--border)] mx-1" />

        <IconButton
          icon={isSidebar ? PanelRight : PanelLeft}
          onClick={onToggleMode}
          title="Alternar layout"
        />

        <IconButton
          icon={Minimize2}
          onClick={onCollapse}
          title="Minimizar"
        />

        <SettingsDropdown health={health} onClearChat={onClearChat} />
      </div>
    </div>
  );
}
