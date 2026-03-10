export interface Message {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: number;
  image?: string; // base64 se tiver imagem
  audio?: string; // base64 se tiver áudio
  audioMimeType?: string;
  tools?: string[]; // ferramentas ativas quando enviou
  thinkingTime?: number; // tempo de resposta em segundos
  isError?: boolean;
}

export type ChatMode = "bottom" | "sidebar-left" | "sidebar-right";

export interface ToolState {
  web_search: boolean;
  extended_thinking: boolean;
  maps: boolean;
  vision: boolean;
  memories: boolean;
  voice: boolean;
  image_generation: boolean;
  canvas: boolean;
}

export interface CanvasContent {
  id: string;
  content_type: 'html' | 'react' | 'markdown';
  content: string;
  title: string;
  position: 'center' | 'top' | 'bottom' | 'fill';
  timestamp: number;
}

export interface NexusHealth {
  status: "alive" | "offline";
  version: string;
  heartBeating: boolean;
  oodaRunning: boolean;
}
