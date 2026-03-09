import React, { useState } from "react";
import { Message } from "../../types";
import { formatTime, cn } from "../../lib/utils";
import { parseMarkdown } from "../../lib/markdown";
import { AudioPlayer } from "./AudioPlayer";
import { Volume2, Loader2, VolumeX } from "lucide-react";
import { synthesizeSpeech } from "../../lib/api";
import { Tooltip } from "../ui/Tooltip";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [ttsAudio, setTtsAudio] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState(false);

  const handleTTS = async () => {
    if (ttsAudio) return; // Already synthesized
    
    try {
      setIsSynthesizing(true);
      setTtsError(false);
      const res = await synthesizeSpeech(message.content);
      setTtsAudio(res.audio_base64);
    } catch (error) {
      console.error("TTS Error:", error);
      setTtsError(true);
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div
          className={cn(
            "px-3 py-1.5 rounded-full text-xs italic",
            message.isError
              ? "bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)]"
              : "bg-[var(--bg-surface)]/50 border border-[var(--accent-glow)] text-[var(--text-secondary)]",
          )}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full my-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] font-outfit font-bold shadow-[0_0_10px_var(--accent-glow)]">
            N
          </div>
        )}

        <div
          className={cn(
            "flex flex-col gap-1",
            isUser ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "px-4 py-3 rounded-2xl text-sm leading-relaxed",
              isUser
                ? "bg-[var(--msg-user-bg)] text-[var(--text-primary)] border border-[var(--accent)]/20 rounded-tr-sm"
                : "bg-[var(--msg-agent-bg)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-sm",
            )}
          >
            {message.image && (
              <img
                src={message.image}
                alt="Uploaded content"
                className="max-w-full h-auto max-h-60 rounded-lg mb-3 border border-[var(--border)]"
              />
            )}
            
            {message.audio && (
              <div className="mb-3">
                <AudioPlayer base64={message.audio} mimeType={message.audioMimeType} />
              </div>
            )}

            <div className="prose prose-invert max-w-none prose-p:my-1 prose-pre:my-0 prose-pre:bg-transparent prose-pre:p-0">
              {parseMarkdown(message.content)}
            </div>
            
            {ttsAudio && !isUser && (
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <AudioPlayer base64={ttsAudio} mimeType="audio/webm" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-[var(--text-muted)]">
              {formatTime(message.timestamp)}
            </span>
            {!isUser && message.thinkingTime && (
              <span className="text-[10px] text-[var(--accent)]/70">
                {message.thinkingTime.toFixed(1)}s
              </span>
            )}
            {!isUser && !ttsAudio && (
              <Tooltip content={ttsError ? "Em breve" : "Ouvir mensagem"}>
                <button 
                  onClick={handleTTS}
                  disabled={isSynthesizing}
                  className={cn(
                    "text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors ml-1",
                    ttsError && "opacity-50 cursor-not-allowed hover:text-[var(--text-muted)]"
                  )}
                >
                  {isSynthesizing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : ttsError ? (
                    <VolumeX size={12} />
                  ) : (
                    <Volume2 size={12} />
                  )}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
