"use client";

import { useEffect, useCallback, useRef } from "react";
import { useMapStore } from "@/store/map-store";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";

interface NetworkEvent {
  assetCode: string;
  status: string;
}

/**
 * Global hook to listen for real-time network events.
 * Implements industry-standard "Alert Suppression" and "Event Categorization".
 */
export function useRealTimeUpdates() {
  const { updateStatusOverride } = useMapStore();

  // Ref to track last notifications to prevent duplicate/spam (simple throttling)
  const lastNotificationRef = useRef<Record<string, number>>({});
  // Global cooldown to prevent toast storms (e.g. 50 alerts in 1 sec)
  const globalCooldownRef = useRef<number>(0);
  const massiveOutageCountRef = useRef<number>(0);
  const massiveOutageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Event Batching State
  const eventBufferRef = useRef<Array<{ assetCode: string; status: string }>>(
    [],
  );
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const flushEvents = useCallback(() => {
    if (eventBufferRef.current.length === 0) return;

    const batch = [...eventBufferRef.current];
    eventBufferRef.current = []; // Clear buffer

    // Dispatch BATCH event
    console.log(`🚀 Dispatching batch update: ${batch.length} events`);
    window.dispatchEvent(
      new CustomEvent("network-batch-update", {
        detail: { events: batch },
      }),
    );
  }, []);

  const handleUpdate = useCallback(
    (
      data: NetworkEvent,
      severity: "CRITICAL" | "MINOR" | "INFO" | "SILENT",
    ) => {
      const { assetCode, status } = data;
      const now = Date.now();

      // 1. ALWAYS Update Global Map State (UI Consistency)
      // Special check: skip updating map if it's a virtual "AREA-OUTAGE" code
      if (!assetCode.startsWith("AREA-")) {
        updateStatusOverride(assetCode, status);
      }

      // 2. Buffer events for batch dispatch (Prevent UI Storms)
      eventBufferRef.current.push({ assetCode, status });

      // If buffer gets too large, flush immediately to prevent memory growth
      if (eventBufferRef.current.length > 500) {
        flushEvents();
      } else if (!flushTimerRef.current) {
        // Schedule flush
        flushTimerRef.current = setTimeout(() => {
          flushEvents();
          flushTimerRef.current = null;
        }, 300); // 300ms batch window
      }

      // 3. Smart Notification Logic
      if (severity === "SILENT") return;

      // Anti-Spam: Don't show toast for the same asset within 1 minute
      if (
        lastNotificationRef.current[assetCode] &&
        now - lastNotificationRef.current[assetCode] < 60000
      ) {
        return;
      }

      lastNotificationRef.current[assetCode] = now;

      if (severity === "CRITICAL") {
        const isMassive = assetCode.includes("MASSIVE-OUTAGE");

        // MASSIVE OUTAGE DETECTION / STORM PROTECTION
        // If we get many critical alerts in short time, suppress individual ones
        massiveOutageCountRef.current += 1;

        // Reset counter after 2 seconds of silence
        if (massiveOutageTimerRef.current)
          clearTimeout(massiveOutageTimerRef.current);
        massiveOutageTimerRef.current = setTimeout(() => {
          massiveOutageCountRef.current = 0;
        }, 2000);

        // If we have more than 3 critical alerts in 2 seconds, show summary only
        if (massiveOutageCountRef.current > 3 && !isMassive) {
          // Throttle the "Massive Outage" generic warning too (once every 5s)
          if (now - globalCooldownRef.current > 5000) {
            toast.error("🚨 HIGH VOLUME ALERT", {
              description:
                "Multiple critical failures detected. Checking for massive outage...",
              duration: 5000,
              id: "massive-outage-warning",
            });
            globalCooldownRef.current = now;
          }
          return;
        }

        // Global rate limit: Max 1 toast every 300ms to allow UI to breathe
        if (now - globalCooldownRef.current < 300) {
          return;
        }
        globalCooldownRef.current = now;

        toast.error(
          isMassive
            ? "🚨 MASSIVE OUTAGE DETECTED"
            : `NETWORK CRITICAL: ${assetCode}`,
          {
            description: isMassive
              ? `Multiple failures reported in area. Likely a massive fiber cut.`
              : status === "DOWN"
                ? "Root node failed. Major area outage likely."
                : "Root connectivity restored.",
            duration: 10000,
            id: `toast-${assetCode}`,
          },
        );
      } else if (severity === "MINOR") {
        toast.warning(`Minor Alert: ${assetCode}`, {
          description: `Device is ${status}. Localised impact only.`,
          duration: 5000,
        });
      } else if (severity === "INFO") {
        // Just log to console or a silent notification center (placeholder)
        console.info(`[Net Log] ${assetCode} changed to ${status}`);
      }
    },
    [updateStatusOverride, flushEvents],
  );

  useEffect(() => {
    const baseUrl = getBackendBaseUrl();
    const sseUrl = `${baseUrl}/network/notifications/map-updates`;

    console.log("Connecting to Enterprise Real-time Stream:", sseUrl);

    const eventSource = new EventSource(sseUrl);

    // Severity: CRITICAL
    eventSource.addEventListener("STATUS_CHANGE", (event) => {
      try {
        const data = JSON.parse(event.data) as NetworkEvent;
        handleUpdate(data, "CRITICAL");
      } catch (err) {
        console.error("Failed to parse event", err);
      }
    });

    // Severity: MINOR
    eventSource.addEventListener("MINOR_STATUS_CHANGE", (event) => {
      try {
        const data = JSON.parse(event.data) as NetworkEvent;
        handleUpdate(data, "MINOR");
      } catch (err) {
        console.error("Failed to parse minor event", err);
      }
    });

    // Severity: INFO (Customers)
    eventSource.addEventListener("CUSTOMER_STATUS_CHANGE", (event) => {
      try {
        const data = JSON.parse(event.data) as NetworkEvent;
        handleUpdate(data, "INFO");
      } catch (err) {
        console.error("Failed to parse customer event", err);
      }
    });

    // Severity: SILENT (Domino updates)
    eventSource.addEventListener("SILENT_STATUS_CHANGE", (event) => {
      try {
        const data = JSON.parse(event.data) as NetworkEvent;
        handleUpdate(data, "SILENT");
      } catch (err) {
        console.error("Failed to parse silent event", err);
      }
    });

    eventSource.onerror = () => {
      console.warn("SSE Connection lost. Retrying...");
    };

    return () => {
      eventSource.close();
    };
  }, [handleUpdate]);
}
