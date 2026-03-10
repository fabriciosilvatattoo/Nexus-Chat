import { useState, useEffect, useRef } from "react";
import { getBaseUrl } from "../lib/api";
import { CanvasContent } from "../types";
import { useLocalStorage } from "./useLocalStorage";

export interface SSEEvent {
  step: string;
  status: string;
  detail: string;
  timestamp: number;
}

export function useSSE() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [canvasContent, setCanvasContent] = useLocalStorage<CanvasContent | null>("nexus_canvas_content", null);
  const [canvasHistory, setCanvasHistory] = useLocalStorage<CanvasContent[]>("nexus_canvas_history", []);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: number | null = null;

    const connect = () => {
      const baseUrl = getBaseUrl();
      
      // Prevent mixed content errors from spamming if on HTTPS and URL is HTTP
      if (window.location.protocol === 'https:' && baseUrl.startsWith('http:')) {
        console.warn("SSE disabled: Cannot connect to HTTP from HTTPS. Configure an HTTPS URL in settings.");
        return;
      }

      try {
        eventSource = new EventSource(`${baseUrl}/api/stream/events`);

        eventSource.onopen = () => {
          retryCountRef.current = 0; // Reset retries on successful connection
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Check for canvas_update event
            if (data.event === "canvas_update" || data.type === "canvas_update") {
              const newCanvasContent: CanvasContent = {
                id: data.data?.id || data.id || Math.random().toString(36).substring(7),
                content_type: data.data?.content_type || data.content_type || 'html',
                content: data.data?.content || data.content || '',
                title: data.data?.title || data.title || '',
                position: data.data?.position || data.position || 'center',
                timestamp: Date.now()
              };
              
              setCanvasContent(newCanvasContent);
              setCanvasHistory(prev => {
                const newHistory = [newCanvasContent, ...prev].slice(0, 10);
                return newHistory;
              });
              return; // Don't add canvas updates to regular events
            }
            
            setEvents((prev) => [...prev, { ...data, timestamp: Date.now() }]);
          } catch (e) {
            console.error("Error parsing SSE data", e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          
          if (retryCountRef.current < maxRetries) {
            const timeout = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
            retryCountRef.current += 1;
            reconnectTimeout = window.setTimeout(connect, timeout);
          } else {
            console.warn("SSE Connection failed after maximum retries.");
          }
        };
      } catch (e) {
        console.error("Failed to initialize SSE", e);
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const clearEvents = () => setEvents([]);
  const clearCanvas = () => setCanvasContent(null);

  return { events, clearEvents, canvasContent, canvasHistory, clearCanvas };
}
