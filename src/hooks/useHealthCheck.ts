import { useState, useEffect } from "react";
import { fetchHealth } from "../lib/api";
import { NexusHealth } from "../types";

export function useHealthCheck(intervalMs: number = 30000) {
  const [health, setHealth] = useState<NexusHealth & { latency?: number }>({
    status: "offline",
    version: "unknown",
    heartBeating: false,
    oodaRunning: false,
  });

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const data = await fetchHealth();
        if (mounted) setHealth(data);
      } catch (e) {
        if (mounted) setHealth((prev) => ({ ...prev, status: "offline" }));
      }
    };

    check();
    const interval = setInterval(check, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return health;
}
