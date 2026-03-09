import React from "react";
import { ChatContainer } from "./components/Chat/ChatContainer";
import { DynamicCanvas } from "./components/DynamicCanvas";

export default function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-inter">
      <DynamicCanvas />
      <ChatContainer />
    </div>
  );
}
