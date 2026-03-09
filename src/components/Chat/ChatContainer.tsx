import React, { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ToolBar } from "./ToolBar";
import { ChatInput } from "./ChatInput";
import { LiveVoicePanel } from "./LiveVoicePanel";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useHealthCheck } from "../../hooks/useHealthCheck";
import { useSSE } from "../../hooks/useSSE";
import { useNexusAPI } from "../../hooks/useNexusAPI";
import { useLiveVoice } from "../../hooks/useLiveVoice";
import { ChatMode, Message, ToolState } from "../../types";
import { generateId } from "../../lib/utils";
import { cn } from "../../lib/utils";
import { MessageCircle } from "lucide-react";

export function ChatContainer() {
  const [mode, setMode] = useLocalStorage<ChatMode>(
    "nexus_chat_mode",
    "bottom",
  );
  const [messages, setMessages] = useLocalStorage<Message[]>(
    "nexus_messages",
    [],
  );
  const [tools, setTools] = useLocalStorage<ToolState>("nexus_tools", {
    web_search: false,
    extended_thinking: false,
    maps: false,
    vision: false,
    memories: false,
    voice: false,
    image_generation: false,
  });

  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const health = useHealthCheck();
  const { events, clearEvents } = useSSE();
  const { sendMessage, isThinking } = useNexusAPI();
  const liveVoice = useLiveVoice();

  const handleToggleMode = () => {
    setMode((prev) =>
      prev === "bottom"
        ? "sidebar-left"
        : prev === "sidebar-left"
          ? "sidebar-right"
          : "bottom",
    );
  };

  const handleToggleTool = (tool: keyof ToolState) => {
    setTools((prev) => ({ ...prev, [tool]: !prev[tool] }));
  };

  const handleClearChat = () => {
    setMessages([]);
    clearEvents();
  };

  const handleOpenLiveVoice = () => {
    setIsLiveVoiceOpen(true);
    liveVoice.startLiveVoice();
  };

  const handleCloseLiveVoice = () => {
    liveVoice.stopLiveVoice();
    setIsLiveVoiceOpen(false);
    
    // Add transcript to messages if there are any
    if (liveVoice.transcript.length > 0) {
      setMessages(prev => [...prev, ...liveVoice.transcript]);
    }
  };

  const handleSend = async (content: string, image?: string, audio?: { base64: string; mimeType: string }) => {
    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: audio ? "Transcrevendo áudio..." : content,
      timestamp: Date.now(),
      image,
      audio: audio?.base64,
      audioMimeType: audio?.mimeType,
      tools: Object.entries(tools)
        .filter(([_, v]) => v)
        .map(([k]) => k),
    };

    setMessages((prev) => [...prev, userMsg]);
    clearEvents();

    try {
      const { responseMsg, transcribedText } = await sendMessage(content, tools, image, audio);
      
      if (audio && transcribedText) {
        setMessages((prev) => 
          prev.map(m => m.id === userMsg.id ? { ...m, content: transcribedText } : m)
        );
      }
      
      setMessages((prev) => [...prev, responseMsg]);
    } catch (error: any) {
      if (audio) {
        setMessages((prev) => 
          prev.map(m => m.id === userMsg.id ? { ...m, content: "Falha na transcrição." } : m)
        );
      }
      
      const errorMsg: Message = {
        id: generateId(),
        role: "system",
        content: error.message || "Erro desconhecido.",
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <>
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--bg-chat)] backdrop-blur-xl border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-lg hover:scale-105 hover:bg-[var(--bg-surface)] transition-all duration-300 animate-in slide-in-from-bottom-4"
        >
          <MessageCircle size={24} />
        </button>
      ) : (
        <div
          className={cn(
            "fixed transition-all duration-300 ease-in-out z-40 flex flex-col bg-[var(--bg-chat)] backdrop-blur-2xl shadow-2xl",
            mode === "bottom"
              ? cn(
                  "bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl rounded-t-2xl border-t border-x border-[var(--border)]",
                  messages.length === 0 ? "h-[180px]" : "h-[35vh] min-h-[180px]"
                )
              : mode === "sidebar-left"
                ? "top-0 left-0 w-[360px] h-full border-r border-[var(--border)]"
                : "top-0 right-0 w-[360px] h-full border-l border-[var(--border)]",
          )}
        >
          <ChatHeader
            health={health}
            mode={mode}
            onToggleMode={handleToggleMode}
            onClearChat={handleClearChat}
            tools={tools}
            onOpenLiveVoice={handleOpenLiveVoice}
            onCollapse={() => setIsCollapsed(true)}
          />

          <MessageList
            messages={messages}
            events={events}
            isThinking={isThinking}
          />

          <div className="mt-auto flex flex-col">
            <ToolBar tools={tools} onToggleTool={handleToggleTool} />
            <ChatInput onSend={handleSend} isThinking={isThinking} tools={tools} />
          </div>
        </div>
      )}

      {isLiveVoiceOpen && (
        <LiveVoicePanel
          status={liveVoice.status}
          duration={liveVoice.duration}
          audioLevel={liveVoice.audioLevel}
          error={liveVoice.error}
          onClose={handleCloseLiveVoice}
          isPaused={liveVoice.isPaused}
          onTogglePause={liveVoice.togglePause}
        />
      )}
    </>
  );
}
