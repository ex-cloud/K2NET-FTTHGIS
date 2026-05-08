"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useMapStore } from "@/store/map-store";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface NetworkEvent {
  assetCode: string;
  status: string;
}

type ConnectionStatus = "connecting" | "connected" | "error" | "disconnected";

/**
 * Global hook to listen for real-time network events.
 * Implements industry-standard "Alert Suppression" and "Event Categorization".
 */
export function useRealTimeUpdates() {
  const { updateStatusOverride } = useMapStore();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [reconnectCount, setReconnectCount] = useState(0);

  // Refs for logic
  const lastNotificationRef = useRef<Record<string, number>>({});
  const globalCooldownRef = useRef<number>(0);
  const massiveOutageCountRef = useRef<number>(0);
  const massiveOutageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eventBufferRef = useRef<Array<{ assetCode: string; status: string }>>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const flushEvents = useCallback(() => {
    if (eventBufferRef.current.length === 0) return;

    const batch = [...eventBufferRef.current];
    eventBufferRef.current = [];

    // Legacy manual dispatch
    window.dispatchEvent(
      new CustomEvent("network-batch-update", {
        detail: { events: batch },
      }),
    );
    
    // React Query Cache Invalidation
    queryClient.invalidateQueries({ queryKey: ["networkStats"] });
    // Also invalidate nodes cache if we add one later
    queryClient.invalidateQueries({ queryKey: ["networkNodes"] });
  }, [queryClient]);

  const handleUpdate = useCallback(
    (data: NetworkEvent, severity: "CRITICAL" | "MINOR" | "INFO" | "SILENT") => {
      const { assetCode, status } = data;
      const now = Date.now();

      if (!assetCode.startsWith("AREA-")) {
        updateStatusOverride(assetCode, status);
      }

      eventBufferRef.current.push({ assetCode, status });

      if (eventBufferRef.current.length > 500) {
        flushEvents();
      } else if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushEvents();
          flushTimerRef.current = null;
        }, 300);
      }

      if (severity === "SILENT") return;

      if (
        lastNotificationRef.current[assetCode] &&
        now - lastNotificationRef.current[assetCode] < 60000
      ) {
        return;
      }

      lastNotificationRef.current[assetCode] = now;

      if (severity === "CRITICAL") {
        const isMassive = assetCode.includes("MASSIVE-OUTAGE");
        massiveOutageCountRef.current += 1;

        if (massiveOutageTimerRef.current) clearTimeout(massiveOutageTimerRef.current);
        massiveOutageTimerRef.current = setTimeout(() => {
          massiveOutageCountRef.current = 0;
        }, 2000);

        if (massiveOutageCountRef.current > 3 && !isMassive) {
          if (now - globalCooldownRef.current > 5000) {
            toast.error("🚨 HIGH VOLUME ALERT", {
              description: "Multiple critical failures detected. Checking for massive outage...",
              duration: 5000,
              id: "massive-outage-warning",
            });
            globalCooldownRef.current = now;
          }
          return;
        }

        if (now - globalCooldownRef.current < 300) return;
        globalCooldownRef.current = now;

        toast.error(
          isMassive ? "🚨 MASSIVE OUTAGE DETECTED" : `NETWORK CRITICAL: ${assetCode}`,
          {
            description: isMassive
              ? `Multiple failures reported in area. Likely a massive fiber cut.`
              : status === "DOWN" ? "Root node failed. Major area outage likely." : "Root connectivity restored.",
            duration: 10000,
            id: `toast-${assetCode}`,
          }
        );
      } else if (severity === "MINOR") {
        toast.warning(`Minor Alert: ${assetCode}`, {
          description: `Device is ${status}. Localised impact only.`,
          duration: 5000,
        });
      } else if (severity === "INFO") {
        console.info(`[Net Log] ${assetCode} changed to ${status}`);
      }
    },
    [updateStatusOverride, flushEvents]
  );

  useEffect(() => {
    let eventSource: EventSource | null = null;
    const baseUrl = getBackendBaseUrl();
    const sseUrl = `${baseUrl}/network/notifications/map-updates`;

    const connect = () => {
      if (eventSource) eventSource.close();
      
      setConnectionStatus("connecting");
      
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setConnectionStatus("connected");
        setReconnectCount(0);
      };

      eventSource.addEventListener("STATUS_CHANGE", (e) => handleUpdate(JSON.parse(e.data), "CRITICAL"));
      eventSource.addEventListener("MINOR_STATUS_CHANGE", (e) => handleUpdate(JSON.parse(e.data), "MINOR"));
      eventSource.addEventListener("CUSTOMER_STATUS_CHANGE", (e) => handleUpdate(JSON.parse(e.data), "INFO"));
      eventSource.addEventListener("SILENT_STATUS_CHANGE", (e) => handleUpdate(JSON.parse(e.data), "SILENT"));

      eventSource.onerror = () => {
        setConnectionStatus("error");
        eventSource?.close();
        
        // Exponential backoff (max 30s)
        const delay = Math.min(1000 * Math.pow(2, reconnectCount), 30000);
        setReconnectCount(prev => prev + 1);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (massiveOutageTimerRef.current) clearTimeout(massiveOutageTimerRef.current);
    };
  }, [handleUpdate, reconnectCount]);

  return { connectionStatus };
}
