import React from "react";

export function parseMarkdown(text: string): React.ReactNode[] {
  // A simple markdown parser that handles bold, italic, inline code, code blocks, lists, and links.
  const elements: React.ReactNode[] = [];
  let currentText = text;

  // This is a very basic implementation. In a real app, you'd use a robust library like react-markdown.
  // We'll split by code blocks first.
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  const processInline = (str: string, keyPrefix: string) => {
    // Handle bold, italic, inline code, links
    const parts: React.ReactNode[] = [];
    let i = 0;

    // Very naive inline parsing
    const tokens = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);

    tokens.forEach((token, index) => {
      if (!token) return;
      const key = `${keyPrefix}-${index}`;

      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={key} className="font-bold text-[var(--text-primary)]">
            {token.slice(2, -2)}
          </strong>,
        );
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <em key={key} className="italic text-[var(--text-primary)]">
            {token.slice(1, -1)}
          </em>,
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code
            key={key}
            className="bg-[var(--bg-surface)] text-[var(--accent)] px-1.5 py-0.5 rounded text-sm font-mono border border-[var(--border)]"
          >
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.match(/\[(.*?)\]\((.*?)\)/)) {
        const [, text, url] = token.match(/\[(.*?)\]\((.*?)\)/) || [];
        parts.push(
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2"
          >
            {text}
          </a>,
        );
      } else {
        parts.push(<span key={key}>{token}</span>);
      }
    });

    return parts;
  };

  let blockIndex = 0;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      elements.push(
        <div key={`text-${blockIndex}`} className="mb-2 whitespace-pre-wrap">
          {processInline(beforeText, `inline-${blockIndex}`)}
        </div>,
      );
    }

    const language = match[1];
    const code = match[2];

    elements.push(
      <div
        key={`code-${blockIndex}`}
        className="relative my-3 rounded-lg overflow-hidden border border-[var(--accent-glow)] bg-[#1a1a2e]"
      >
        <div className="flex justify-between items-center px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            {language || "code"}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Copiar
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono text-[var(--text-primary)]">
          <code>{code}</code>
        </pre>
      </div>,
    );

    lastIndex = match.index + match[0].length;
    blockIndex++;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    // Handle lists in remaining text
    const lines = remainingText.split("\n");
    const processedLines: React.ReactNode[] = [];

    let inList = false;
    let listItems: React.ReactNode[] = [];
    let listType: "ul" | "ol" = "ul";

    lines.forEach((line, i) => {
      const ulMatch = line.match(/^-\s+(.*)/);
      const olMatch = line.match(/^\d+\.\s+(.*)/);

      if (ulMatch || olMatch) {
        if (!inList) {
          inList = true;
          listType = ulMatch ? "ul" : "ol";
        }
        const content = ulMatch ? ulMatch[1] : olMatch ? olMatch[1] : "";
        listItems.push(
          <li key={`li-${i}`} className="ml-4 mb-1">
            {processInline(content, `li-inline-${i}`)}
          </li>,
        );
      } else {
        if (inList) {
          const ListTag = listType === "ul" ? "ul" : "ol";
          processedLines.push(
            <ListTag
              key={`list-${i}`}
              className={
                listType === "ul"
                  ? "list-disc ml-4 mb-2"
                  : "list-decimal ml-4 mb-2"
              }
            >
              {listItems}
            </ListTag>,
          );
          inList = false;
          listItems = [];
        }
        if (line.trim() !== "") {
          processedLines.push(
            <div key={`line-${i}`} className="mb-2">
              {processInline(line, `line-inline-${i}`)}
            </div>,
          );
        }
      }
    });

    if (inList) {
      const ListTag = listType === "ul" ? "ul" : "ol";
      processedLines.push(
        <ListTag
          key={`list-end`}
          className={
            listType === "ul" ? "list-disc ml-4 mb-2" : "list-decimal ml-4 mb-2"
          }
        >
          {listItems}
        </ListTag>,
      );
    }

    elements.push(
      <div key={`text-end`} className="whitespace-pre-wrap">
        {processedLines}
      </div>,
    );
  }

  return elements.length > 0 ? elements : [<span key="empty">{text}</span>];
}
