import React from "react";
import { PanelLeft, PanelRight } from "lucide-react";
import { StatusDot } from "../ui/StatusDot";
import { IconButton } from "../ui/IconButton";
import { SettingsDropdown } from "./SettingsDropdown";
import { ChatMode, NexusHealth, ToolState } from "../../types";

interface ChatHeaderProps {
  health: NexusHealth & { latency?: number };
  mode: ChatMode;
  onToggleMode: () => void;
  onClearChat: () => void;
  tools: ToolState;
}

export function ChatHeader({
  health,
  mode,
  onToggleMode,
  onClearChat,
  tools,
}: ChatHeaderProps) {
  const isSidebar = mode.startsWith("sidebar");
  const activeToolsCount = Object.values(tools).filter(Boolean).length;

  return (
    <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-md rounded-t-2xl">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-lg font-semibold text-[var(--text-primary)] tracking-wide">
              Nexus Core
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]">
              {health.version}
            </span>
          </div>
          <StatusDot status={health.status} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeToolsCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--accent-glow)] border border-[var(--accent)]/20 text-[10px] text-[var(--accent)] font-medium">
            <span className="relative flex h-1.5 w-1.5 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]"></span>
            </span>
            {activeToolsCount} tool{activeToolsCount > 1 ? "s" : ""}
          </div>
        )}

        <div className="h-6 w-px bg-[var(--border)] mx-1" />

        <IconButton
          icon={isSidebar ? PanelRight : PanelLeft}
          onClick={onToggleMode}
          title="Alternar layout"
        />

        <SettingsDropdown health={health} onClearChat={onClearChat} />
      </div>
    </div>
  );
}
