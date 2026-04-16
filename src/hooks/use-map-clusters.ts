"use client";

import { useState, useEffect, useCallback } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import type { FeatureCollection, Point } from "geojson";

export interface MapClusterNode {
  id: string;
  code: string;
  type: string;
  lng: number;
  lat: number;
  status: string;
}

export function useMapClusters() {
  const { data: session } = useSession();
  const [geoJSON, setGeoJSON] = useState<FeatureCollection<Point> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAllNodes = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/network/assets/all-nodes`, {
        token: session.accessToken,
      });

      if (!res.ok) throw new Error("Failed to fetch cluster nodes");
      const nodes: MapClusterNode[] = await res.json();
      
      // Convert to GeoJSON
      const featureCollection: FeatureCollection<Point> = {
        type: "FeatureCollection",
        features: nodes.map(node => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [node.lng, node.lat],
          },
          properties: {
            id: node.id,
            code: node.code,
            type: node.type,
            status: node.status,
          },
        })),
      };
      
      setGeoJSON(featureCollection);
    } catch (err) {
      console.error("Cluster fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchAllNodes();
  }, [fetchAllNodes]);

  return { geoJSON, loading, refresh: fetchAllNodes };
}
