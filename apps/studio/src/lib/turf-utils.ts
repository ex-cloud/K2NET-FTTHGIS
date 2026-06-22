import circle from "@turf/circle";
import { point, featureCollection } from "@turf/helpers";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";

/**
 * Generates a circular buffer (polygon) around a point with a radius in meters.
 * Uses turf circle which is more reliable than buffer for simple circular areas.
 */
export function createBuffer(
  lng: number,
  lat: number,
  radiusMeters: number,
): Feature<Polygon> {
  const center = point([lng, lat]);
  return circle(center, radiusMeters / 1000, {
    units: "kilometers",
    steps: 64,
  });
}

/**
 * Generates a grid of points for heatmap weighting based on signal attenuation.
 * This simulates a 'glow' effect around a node.
 */
export function createSignalHeatmapData(
  lng: number,
  lat: number,
  signalDb: number,
): FeatureCollection<Point> {
  const radius = 0.1; // 100 meters

  // Create a few concentric circles of points to simulate signal falloff
  const features: Feature<Point>[] = [];

  // Base point (strongest)
  features.push(point([lng, lat], { weight: Math.abs(signalDb) / 30 }));

  // Sub-points for glow
  for (let i = 1; i <= 5; i++) {
    const r = (radius / 5) * i;
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const pLng = lng + Math.cos(rad) * r * 0.0001;
      const pLat = lat + Math.sin(rad) * r * 0.0001;
      // Weighted significantly less as distance increases
      const weight = (Math.abs(signalDb) / 30) * (1 - i * 0.15);
      features.push(point([pLng, pLat], { weight: Math.max(0, weight) }));
    }
  }

  return featureCollection(features);
}
