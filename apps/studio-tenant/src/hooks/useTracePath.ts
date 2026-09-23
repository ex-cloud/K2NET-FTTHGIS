import { useState, useCallback } from "react";
import { networkApi, type FiberCable } from "../lib/api/network";
import { useMapStore } from "../store/map-store";
import type { Feature, FeatureCollection, LineString } from "geojson";

/**
 * Hook for fetching traced fiber route between two network nodes.
 * Uses the backend /trace-path and /trace-upstream endpoints and converts
 * the response to a GeoJSON FeatureCollection for rendering on MapLibre.
 */
export function useTracePath() {
  const [traceData, setTraceData] = useState<FeatureCollection<LineString> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeProjectId = useMapStore((state) => state.activeProjectId);

  const fetchTracePath = useCallback(
    async (startNodeId: string, endNodeId: string) => {
      setLoading(true);
      setError(null);

      try {
        const cables: FiberCable[] = await networkApi.tracePath(startNodeId, endNodeId, activeProjectId || undefined);

        if (!cables || cables.length === 0) {
          setError("Tidak ditemukan rute fiber antara kedua node ini");
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
            lengthMeters: cable.lengthMeters,
            coreCount: cable.coreCount,
          },
        }));

        const collection: FeatureCollection<LineString> = {
          type: "FeatureCollection",
          features,
        };

        setTraceData(collection);
        return collection;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal melakukan trace path fiber";
        setError(message);
        setTraceData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [activeProjectId]
  );

  const fetchTraceUpstream = useCallback(
    async (nodeId: string) => {
      setLoading(true);
      setError(null);

      try {
        const cables: FiberCable[] = await networkApi.traceUpstream(nodeId, activeProjectId || undefined);

        if (!cables || cables.length === 0) {
          setError("Tidak ditemukan jalur upstream ke OLT");
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
            lengthMeters: cable.lengthMeters,
            coreCount: cable.coreCount,
          },
        }));

        const collection: FeatureCollection<LineString> = {
          type: "FeatureCollection",
          features,
        };

        setTraceData(collection);
        return collection;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal melakukan trace upstream ke OLT";
        setError(message);
        setTraceData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [activeProjectId]
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
