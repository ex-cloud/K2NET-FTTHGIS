import maplibregl, { type StyleSpecification } from "maplibre-gl";
import { Protocol } from "pmtiles";

let pmtilesProtocolInstance: Protocol | null = null;

/**
 * Initializes and registers PMTiles protocol in MapLibre GL JS (Singleton).
 * Safe to call multiple times across React component mounts.
 */
export function initPMTilesProtocol(): Protocol {
  if (!pmtilesProtocolInstance) {
    pmtilesProtocolInstance = new Protocol();
    maplibregl.addProtocol("pmtiles", pmtilesProtocolInstance.tile);
  }
  return pmtilesProtocolInstance;
}

export const CARTO_BASEMAP_URLS = {
  light: [
    "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  ],
  dark: [
    "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  ],
};

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

export const PROTOMAPS_ATTRIBUTION =
  '&copy; <a href="https://protomaps.com" target="_blank" rel="noopener">Protomaps</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

export interface BasemapOptions {
  theme?: "light" | "dark";
  provider?: "carto" | "pmtiles";
  pmtilesUrl?: string;
  glyphsUrl?: string;
  spriteUrl?: string;
}

/**
 * Returns a robust, production-grade MapLibre StyleSpecification.
 * Defaults to CARTO Positron (light) and CARTO Dark Matter (dark) which
 * provide high-contrast styling for FTTH fiber cables with zero 403 blocks.
 * Seamlessly switches to PMTiles self-hosted archive if provider is 'pmtiles'.
 */
export function getBasemapStyle(options: BasemapOptions = {}): StyleSpecification {
  const {
    theme = "dark",
    provider = "carto",
    pmtilesUrl,
    glyphsUrl = "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    spriteUrl = "https://demotiles.maplibre.org/sprites/osm-liberty",
  } = options;

  if (provider === "pmtiles" && pmtilesUrl) {
    initPMTilesProtocol();

    return {
      version: 8,
      name: `K2NET Protomaps Basemap (${theme})`,
      glyphs: glyphsUrl,
      sprite: spriteUrl,
      sources: {
        "pmtiles-basemap": {
          type: "vector",
          url: `pmtiles://${pmtilesUrl}`,
          attribution: PROTOMAPS_ATTRIBUTION,
        },
      },
      layers: [
        {
          id: "background",
          type: "background",
          paint: {
            "background-color": theme === "dark" ? "#111827" : "#f3f4f6",
          },
        },
      ],
    };
  }

  // Default: CARTO Positron or Dark Matter
  const tiles = theme === "dark" ? CARTO_BASEMAP_URLS.dark : CARTO_BASEMAP_URLS.light;

  return {
    version: 8,
    name: theme === "dark" ? "CARTO Dark Matter" : "CARTO Positron",
    sources: {
      "carto-basemap": {
        type: "raster",
        tiles,
        tileSize: 256,
        attribution: OSM_ATTRIBUTION,
        maxzoom: 20,
      },
    },
    layers: [
      {
        id: "carto-basemap-tiles",
        type: "raster",
        source: "carto-basemap",
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  };
}
