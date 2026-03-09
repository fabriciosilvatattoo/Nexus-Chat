import { useState, useEffect, useRef } from "react";
import { getBaseUrl } from "../lib/api";

export interface SSEEvent {
  step: string;
  status: string;
  detail: string;
  timestamp: number;
}

export function useSSE() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
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

  return { events, clearEvents };
}
