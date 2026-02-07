"use client";

import { useEffect } from "react";
import { useMapStore } from "@/store/map-store";
import { useSelectionStore } from "@/store/selection-store";
import { getBackendBaseUrl } from "@/lib/api-config";

export function useMapNotifications() {
  const { updateStatusOverride } = useMapStore();
  const { selectedAsset, setSelectedAsset } = useSelectionStore();

  useEffect(() => {
    const baseUrl = getBackendBaseUrl();
    const sseUrl = `${baseUrl}/network/notifications/map-updates`;

    console.log("Connecting to GIS Real-time Stream:", sseUrl);

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log("GIS Real-time Stream Connected");
    };

    eventSource.addEventListener("STATUS_CHANGE", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Real-time Status Change Received:", data);

        const { assetCode, status } = data;

        // 1. Update Global Map Overrides
        updateStatusOverride(assetCode, status);

        // 2. Update current selection if it matches the changed asset
        if (selectedAsset && selectedAsset.code === assetCode) {
          setSelectedAsset({
            ...selectedAsset,
            status: status,
          });
        }
      } catch (err) {
        console.error("Failed to parse map update event", err);
      }
    });

    eventSource.addEventListener("INIT", (event) => {
      console.log("SSE Init:", event.data);
    });

    eventSource.onerror = (err) => {
      console.error("SSE Connection Error:", err);
      // EventSource automatically retries, no need for manual reconnect logic here
    };

    return () => {
      console.log("Closing GIS Real-time Stream");
      eventSource.close();
    };
  }, [updateStatusOverride, selectedAsset, setSelectedAsset]);
}
