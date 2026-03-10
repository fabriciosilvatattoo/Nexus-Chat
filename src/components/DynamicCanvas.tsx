import React from "react";
import { CanvasContent } from "../types";
import { Layout } from "lucide-react";
import { parseMarkdown } from "../lib/markdown";
import { cn } from "../lib/utils";

interface DynamicCanvasProps {
  content: CanvasContent | null;
}

export function DynamicCanvas({ content }: DynamicCanvasProps) {
  if (!content) {
    return (
      <div className="absolute inset-0 flex items-center justify-center -z-10 bg-[var(--bg-primary)] overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="text-[var(--text-muted)] opacity-20 font-outfit text-2xl tracking-widest pointer-events-none select-none">
          Nexus Core v0.9.0
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (content.content_type === "markdown") {
      return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: parseMarkdown(content.content) }} />;
    }
    // For html and react (for now), render as HTML
    return <div dangerouslySetInnerHTML={{ __html: content.content }} />;
  };

  const getPositionClasses = () => {
    switch (content.position) {
      case "top":
        return "top-0 left-0 w-full p-8";
      case "bottom":
        return "bottom-0 left-0 w-full p-8";
      case "fill":
        return "inset-0 p-8";
      case "center":
      default:
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8";
    }
  };

  return (
    <div className="absolute inset-0 -z-10 bg-[var(--bg-primary)] overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div 
        key={content.id}
        className={cn(
          "absolute animate-in fade-in zoom-in-95 duration-300 ease-out",
          getPositionClasses()
        )}
      >
        {content.title && (
          <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)] font-outfit text-xs opacity-70">
            <Layout size={14} />
            <span className="uppercase tracking-wider font-medium">{content.title}</span>
          </div>
        )}
        <div className="w-full h-full overflow-auto custom-scrollbar">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
