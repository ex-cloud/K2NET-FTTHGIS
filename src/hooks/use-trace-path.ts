"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { networkApi, FiberCable } from "@/lib/api/network";
import type { Feature, FeatureCollection, LineString } from "geojson";

/**
 * Hook for fetching traced fiber route between two network nodes.
 * Uses the backend /trace-path endpoint and converts the response
 * to a GeoJSON FeatureCollection for rendering on the map.
 */
export function useTracePath() {
  const { data: session } = useSession();
  const [traceData, setTraceData] = useState<FeatureCollection<LineString> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracePath = useCallback(
    async (startNodeId: string, endNodeId: string) => {
      if (!session?.accessToken) {
        setError("Authentication required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const cables: FiberCable[] = await networkApi.tracePath(startNodeId, endNodeId, session.accessToken as string, "");

        if (cables.length === 0) {
          setError("No route found between these nodes");
          setTraceData(null);
          return null;
        }

        // Convert backend response to GeoJSON FeatureCollection
        const features: Feature<LineString>[] = cables.map((cable) => ({
          type: "Feature" as const,
          geometry: cable.geometry,
          properties: {
            id: cable.id,
            code: cable.code,
            status: cable.status,
          },
        }));

        const collection: FeatureCollection<LineString> = {
          type: "FeatureCollection",
          features,
        };

        setTraceData(collection);
        return collection;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to trace path";
        setError(message);
        setTraceData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken]
  );
  
  const fetchTraceUpstream = useCallback(
    async (nodeId: string) => {
      if (!session?.accessToken) {
        setError("Authentication required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const cables: FiberCable[] = await networkApi.traceUpstream(nodeId, session.accessToken as string, "");

        if (cables.length === 0) {
          setError("No upstream route found to OLT");
          setTraceData(null);
          return null;
        }

        const features: Feature<LineString>[] = cables.map((cable) => ({
          type: "Feature" as const,
          geometry: cable.geometry,
          properties: {
            id: cable.id,
            code: cable.code,
            status: cable.status,
          },
        }));

        const collection: FeatureCollection<LineString> = {
          type: "FeatureCollection",
          features,
        };

        setTraceData(collection);
        return collection;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to trace upstream path";
        setError(message);
        setTraceData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken]
  );

  const clearTrace = useCallback(() => {
    setTraceData(null);
    setError(null);
  }, []);

  return {
    traceData,
    loading,
    error,
    fetchTracePath,
    fetchTraceUpstream,
    clearTrace,
  };
}
