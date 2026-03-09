import React, { useState } from "react";
import { Settings, Trash2, Activity } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { NexusHealth } from "../../types";

interface SettingsDropdownProps {
  health: NexusHealth & { latency?: number };
  onClearChat: () => void;
}

export function SettingsDropdown({
  health,
  onClearChat,
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState(
    () => localStorage.getItem("nexus_url") || "https://product-larger-hold-relate.trycloudflare.com",
  );
  const [wsUrl, setWsUrl] = useState(
    () => localStorage.getItem("nexus_ws_url") || "wss://involvement-mandate-needed-unable.trycloudflare.com/live",
  );

  const handleSaveUrl = () => {
    localStorage.setItem("nexus_url", url);
    localStorage.setItem("nexus_ws_url", wsUrl);
    window.location.reload();
  };

  return (
    <div className="relative">
      <IconButton
        icon={Settings}
        onClick={() => setIsOpen(!isOpen)}
        active={isOpen}
      />

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="text-[var(--text-primary)] font-outfit font-medium mb-4">
              Configurações
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  URL do Backend
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  URL do WebSocket (Live Voice)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <button
                  onClick={handleSaveUrl}
                  className="w-full mt-3 bg-[var(--accent)] text-[var(--bg-primary)] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Salvar URLs
                </button>
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1">
                    <Activity size={14} /> Status
                  </span>
                  <span
                    className={
                      health.status === "alive"
                        ? "text-[var(--success)]"
                        : "text-[var(--error)]"
                    }
                  >
                    {health.status === "alive" ? "Conectado" : "Desconectado"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[var(--text-secondary)]">Latência</span>
                  <span className="text-[var(--text-primary)]">
                    {health.latency ? `${health.latency}ms` : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Versão</span>
                  <span className="text-[var(--text-primary)]">
                    {health.version}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <button
                  onClick={() => {
                    onClearChat();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-[var(--error)] hover:bg-[var(--error)]/10 py-2 rounded-lg transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Limpar conversa
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
