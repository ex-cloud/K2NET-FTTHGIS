"use client";

import { useEffect, useRef } from "react";
import { useMapStore } from "@/store/map-store";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";

const MAX_RETRY_DELAY = 30000; // Max 30s between retries
const INITIAL_RETRY_DELAY = 2000; // Start at 2s

export function useMapNotifications() {
  const { updateStatusOverride } = useMapStore();
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const updateStatusOverrideRef = useRef(updateStatusOverride);

  useEffect(() => {
    updateStatusOverrideRef.current = updateStatusOverride;
  }, [updateStatusOverride]);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const baseUrl = getBackendBaseUrl();
      const sseUrl = `${baseUrl}/network/notifications/map-updates`;

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        retryCountRef.current = 0; // Reset backoff on successful connection
        console.log("GIS Real-time Stream Connected");
      };

      eventSource.addEventListener("STATUS_CHANGE", (event) => {
        try {
          const data = JSON.parse(event.data);
          const { assetCode, status } = data;

          updateStatusOverrideRef.current(assetCode, status);

          if (status === "DOWN") {
            toast.error(`Device ${assetCode} is DOWN`, {
              description: "Connection to device lost. Please check power and network.",
              duration: 8000,
            });
          } else if (status === "UP") {
            toast.success(`Device ${assetCode} is UP`, {
              description: "Connection restored successfully.",
              duration: 5000,
            });
          }
        } catch (err) {
          console.error("Failed to parse map update event", err);
        }
      });

      eventSource.addEventListener("INIT", (event) => {
        console.log("SSE Init:", event.data);
      });

      eventSource.onerror = () => {
        // Close the failed connection and manage our own retry with backoff
        eventSource.close();

        if (!isMounted) return;

        const delay = Math.min(
          INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
          MAX_RETRY_DELAY
        );
        retryCountRef.current += 1;

        if (retryCountRef.current <= 3) {
          console.warn(`SSE disconnected. Retrying in ${delay / 1000}s...`);
        }

        retryTimeoutRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []); // Empty deps — refs handle updates
}
