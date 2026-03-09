import React, { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ToolBar } from "./ToolBar";
import { ChatInput } from "./ChatInput";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useHealthCheck } from "../../hooks/useHealthCheck";
import { useSSE } from "../../hooks/useSSE";
import { useNexusAPI } from "../../hooks/useNexusAPI";
import { ChatMode, Message, ToolState } from "../../types";
import { generateId } from "../../lib/utils";
import { cn } from "../../lib/utils";

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
  });

  const health = useHealthCheck();
  const { events, clearEvents } = useSSE();
  const { sendMessage, isThinking } = useNexusAPI();

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
    <div
      className={cn(
        "fixed transition-all duration-300 ease-in-out z-50 flex flex-col bg-[var(--bg-chat)] backdrop-blur-xl border-[var(--border)] shadow-2xl",
        mode === "bottom"
          ? "bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[50vh] min-h-[400px] rounded-t-2xl border-t border-x"
          : mode === "sidebar-left"
            ? "top-0 left-0 w-[400px] h-full border-r border-r-[var(--accent-glow)]"
            : "top-0 right-0 w-[400px] h-full border-l border-l-[var(--accent-glow)]",
      )}
    >
      <ChatHeader
        health={health}
        mode={mode}
        onToggleMode={handleToggleMode}
        onClearChat={handleClearChat}
        tools={tools}
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
  );
}
