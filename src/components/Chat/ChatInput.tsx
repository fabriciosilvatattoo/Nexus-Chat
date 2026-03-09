import React, { useState, useRef, useEffect } from "react";
import { Send, ImagePlus, X, Mic, Square } from "lucide-react";
import { cn } from "../../lib/utils";
import { ToolState } from "../../types";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";

interface ChatInputProps {
  onSend: (content: string, image?: string, audio?: { base64: string; mimeType: string }) => void;
  isThinking: boolean;
  tools: ToolState;
}

export function ChatInput({ onSend, isThinking, tools }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isRecording, 
    recordingTime, 
    error: audioError, 
    startRecording, 
    stopRecording, 
    cancelRecording 
  } = useAudioRecorder();

  const holdTimeoutRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);

  useEffect(() => {
    if (textareaRef.current && !isRecording) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input, isRecording]);

  const handleSend = () => {
    if ((!input.trim() && !image) || isThinking) return;
    onSend(input.trim(), image || undefined);
    setInput("");
    setImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicMouseDown = () => {
    if (isThinking) return;
    isHoldingRef.current = true;
    holdTimeoutRef.current = window.setTimeout(() => {
      if (isHoldingRef.current && !isRecording) {
        startRecording();
      }
    }, 300); // 300ms to consider it a hold
  };

  const handleMicMouseUp = async () => {
    if (isThinking) return;
    isHoldingRef.current = false;
    
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }

    if (isRecording) {
      // If we were recording (either from hold or click), stop and send
      const result = await stopRecording();
      if (result) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          onSend('', undefined, { base64, mimeType: result.mimeType });
        };
        reader.readAsDataURL(result.blob);
      }
    } else {
      // It was a short click and we weren't recording yet
      startRecording();
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  return (
    <div className="p-4 bg-[var(--bg-surface)]/80 backdrop-blur-md">
      {audioError && (
        <div className="mb-2 text-xs text-[var(--error)] bg-[var(--error)]/10 p-2 rounded-lg border border-[var(--error)]/20">
          {audioError}
        </div>
      )}
      
      {image && !isRecording && (
        <div className="mb-3 relative inline-block">
          <img
            src={image}
            alt="Upload preview"
            className="h-16 w-16 object-cover rounded-lg border border-[var(--border)]"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--error)] rounded-full p-0.5 border border-[var(--border)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {tools.vision && !isRecording && (
          <>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-xl transition-all"
              disabled={isThinking}
            >
              <ImagePlus size={20} />
            </button>
          </>
        )}

        <div className={cn(
          "flex-1 relative bg-[var(--bg-primary)] rounded-xl transition-all flex items-center border border-[var(--border)]",
          isRecording 
            ? "border-red-500/50 bg-red-500/5" 
            : "focus-within:border-[var(--accent)]/50 focus-within:ring-1 focus-within:ring-[var(--accent)]/20"
        )}>
          {isRecording ? (
            <div className="flex items-center justify-between w-full p-3 h-[46px]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-sm text-[var(--text-secondary)]">
                  {formatTime(recordingTime)}
                </span>
              </div>
              
              {/* Sound wave animation */}
              <div className="flex items-center gap-1 h-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i}
                    className="w-1 bg-red-500/60 rounded-full animate-pulse"
                    style={{ 
                      height: `${Math.max(20, Math.random() * 100)}%`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      animationDelay: `${Math.random() * 0.5}s`
                    }}
                  />
                ))}
              </div>
              
              <button 
                onClick={handleCancelRecording}
                className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Fale com o Nexus..."
              className="w-full max-h-[120px] bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] p-3 resize-none focus:outline-none"
              rows={1}
              disabled={isThinking}
            />
          )}
        </div>

        {tools.voice && !input.trim() && !image ? (
          <button
            onMouseDown={handleMicMouseDown}
            onMouseUp={handleMicMouseUp}
            onMouseLeave={() => {
              if (isHoldingRef.current) handleMicMouseUp();
            }}
            onTouchStart={handleMicMouseDown}
            onTouchEnd={handleMicMouseUp}
            disabled={isThinking}
            className={cn(
              "p-3 rounded-xl transition-all flex items-center justify-center border",
              isThinking
                ? "bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border)] cursor-not-allowed"
                : isRecording
                  ? "bg-red-500 text-white border-red-500 animate-pulse"
                  : "bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
            )}
          >
            {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !image) || isThinking}
            className={cn(
              "p-3 rounded-xl transition-all flex items-center justify-center border",
              (!input.trim() && !image) || isThinking
                ? "bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border)] cursor-not-allowed"
                : "bg-[var(--accent)] text-[var(--bg-primary)] border-[var(--accent)] hover:bg-[var(--accent-hover)]",
            )}
          >
            <Send size={20} className={isThinking ? "opacity-50" : ""} />
          </button>
        )}
      </div>
    </div>
  );
}
