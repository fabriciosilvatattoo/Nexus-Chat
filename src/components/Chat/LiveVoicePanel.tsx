import React, { useEffect, useState } from 'react';
import { PhoneOff, Mic, Pause } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LiveVoiceStatus } from '../../hooks/useLiveVoice';

interface LiveVoicePanelProps {
  status: LiveVoiceStatus;
  duration: number;
  audioLevel: number;
  error: string | null;
  onClose: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export function LiveVoicePanel({ status, duration, audioLevel, error, onClose, isPaused, onTogglePause }: LiveVoicePanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (error) return error;
    if (isPaused) return 'Pausado';
    switch (status) {
      case 'connecting': return 'Conectando...';
      case 'listening': return 'Ao vivo';
      case 'speaking': return 'Nexus falando...';
      case 'error': return 'Erro na conexão';
      default: return 'Ao vivo';
    }
  };

  return (
    <div 
      className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-3 rounded-full bg-[var(--bg-chat)] backdrop-blur-2xl border border-[var(--border)] shadow-2xl transition-all duration-300",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
    >
      {/* Audio Visualizer */}
      <div className="flex items-center justify-center gap-[3px] h-6 w-12">
        {[1, 2, 3, 4, 5].map((i) => {
          const isActive = !isPaused && (status === 'listening' || status === 'speaking');
          const height = isActive ? Math.max(20, audioLevel * 100 * (Math.random() * 0.5 + 0.5)) : 20;
          
          return (
            <div 
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-75",
                isPaused ? "bg-[var(--text-muted)]" : 
                status === 'speaking' ? "bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" : "bg-[var(--accent)]"
              )}
              style={{ 
                height: `${height}%`,
                opacity: isPaused ? 0.5 : 0.5 + (audioLevel * 0.5)
              }}
            />
          );
        })}
      </div>

      {/* Status Text & Timer */}
      <div className="flex flex-col min-w-[120px]">
        <span className={cn(
          "text-sm font-medium transition-colors duration-300",
          error ? "text-[var(--error)]" : "text-[var(--text-primary)]"
        )}>
          {getStatusText()}
        </span>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
        <button
          onClick={onTogglePause}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-105 active:scale-95",
            isPaused 
              ? "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]" 
              : "bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
          )}
        >
          {isPaused ? <Pause size={18} /> : <Mic size={18} />}
        </button>

        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
