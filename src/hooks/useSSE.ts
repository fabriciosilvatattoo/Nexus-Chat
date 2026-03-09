import { useState, useEffect } from "react";
import { getBaseUrl } from "../lib/api";

export interface SSEEvent {
  step: string;
  status: string;
  detail: string;
  timestamp: number;
}

export function useSSE() {
  const [events, setEvents] = useState<SSEEvent[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`${getBaseUrl()}/api/stream/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents((prev) => [...prev, { ...data, timestamp: Date.now() }]);
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE Connection Error");
      eventSource.close();
      // Reconnect logic could be added here
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const clearEvents = () => setEvents([]);

  return { events, clearEvents };
}
