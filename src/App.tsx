import React from "react";
import { ChatContainer } from "./components/Chat/ChatContainer";
import { DynamicCanvas } from "./components/DynamicCanvas";
import { useSSE } from "./hooks/useSSE";

export default function App() {
  const { events, clearEvents, canvasContent, clearCanvas } = useSSE();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-inter">
      <DynamicCanvas content={canvasContent} />
      <ChatContainer 
        events={events} 
        clearEvents={clearEvents} 
        hasCanvas={!!canvasContent}
        onClearCanvas={clearCanvas}
      />
    </div>
  );
}
