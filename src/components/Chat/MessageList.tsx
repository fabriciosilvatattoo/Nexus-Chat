import React, { useEffect, useRef } from "react";
import { Message } from "../../types";
import { SSEEvent } from "../../hooks/useSSE";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  events: SSEEvent[];
  isThinking: boolean;
}

export function MessageList({
  messages,
  events,
  isThinking,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, events, isThinking]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[var(--accent)]/30 scrollbar-track-transparent">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {events.map((evt, idx) => (
        <div
          key={`event-${idx}`}
          className="flex justify-center my-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="bg-[var(--bg-surface)]/50 px-3 py-1.5 rounded-full text-xs italic text-[var(--text-secondary)]">
            [{evt.step}] {evt.detail}
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="flex justify-start my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex max-w-[85%] gap-3 flex-row">
            <div className="px-4 py-3 rounded-2xl bg-transparent flex items-center gap-1 h-[42px]">
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
