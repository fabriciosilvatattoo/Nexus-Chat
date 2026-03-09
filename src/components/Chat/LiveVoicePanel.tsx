import React, { useEffect, useState } from 'react';
import { PhoneOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LiveVoiceStatus } from '../../hooks/useLiveVoice';

interface LiveVoicePanelProps {
  status: LiveVoiceStatus;
  duration: number;
  audioLevel: number;
  error: string | null;
  onClose: () => void;
}

export function LiveVoicePanel({ status, duration, audioLevel, error, onClose }: LiveVoicePanelProps) {
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
    switch (status) {
      case 'connecting': return 'Conectando...';
      case 'listening': return 'Ouvindo...';
      case 'speaking': return 'Nexus está falando...';
      case 'error': return 'Erro na conexão';
      default: return 'Ao vivo';
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-[30px] transition-opacity duration-300",
        mounted ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md p-6">
        
        {/* Main Avatar Circle */}
        <div className="relative flex items-center justify-center w-32 h-32 mb-8">
          {/* Speaking Rings Animation */}
          {status === 'speaking' && (
            <>
              <div className="absolute inset-0 rounded-full border border-[var(--accent)]/40 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-[-20px] rounded-full border border-[var(--accent)]/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              <div className="absolute inset-[-40px] rounded-full border border-[var(--accent)]/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </>
          )}

          {/* Core Circle */}
          <div className={cn(
            "relative z-10 flex items-center justify-center w-full h-full rounded-full bg-[var(--bg-surface)] border-2 transition-all duration-300",
            status === 'speaking' ? "border-[var(--accent)] shadow-[0_0_30px_var(--accent-glow)]" : "border-[var(--accent)]/50"
          )}>
            <span className="text-5xl font-outfit font-bold text-[var(--accent)]">N</span>
          </div>

          {/* Listening Spectrum */}
          {status === 'listening' && (
            <div className="absolute -bottom-8 flex items-end justify-center gap-1 h-8 w-full">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div 
                  key={i}
                  className="w-1.5 bg-[var(--accent)] rounded-full transition-all duration-75"
                  style={{ 
                    height: `${Math.max(4, audioLevel * 100 * (Math.random() * 0.5 + 0.5))}%`,
                    opacity: 0.5 + (audioLevel * 0.5)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className={cn(
          "text-lg font-medium mb-2 transition-colors duration-300 text-center",
          error ? "text-[var(--error)]" : "text-[var(--text-secondary)]"
        )}>
          {getStatusText()}
        </div>

        {/* Timer */}
        <div className="font-mono text-2xl text-[var(--text-muted)] mb-12">
          {formatTime(duration)}
        </div>

      </div>

      {/* End Call Button */}
      <div className="pb-12">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}
