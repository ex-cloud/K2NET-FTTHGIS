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

export const ESRI_BASEMAP_URLS = {
  light: [
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  ],
  dark: [
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  ],
};

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

export const ESRI_ATTRIBUTION =
  '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

export const PROTOMAPS_ATTRIBUTION =
  '&copy; <a href="https://protomaps.com" target="_blank" rel="noopener">Protomaps</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

export interface BasemapOptions {
  theme?: "light" | "dark";
  provider?: "esri" | "carto" | "pmtiles";
  cartoApiKey?: string;
  pmtilesUrl?: string;
  glyphsUrl?: string;
  spriteUrl?: string;
}

/**
 * Returns a robust, production-grade MapLibre StyleSpecification.
 * Defaults to Esri World Dark/Light Gray Canvas which provides high-contrast
 * styling for FTTH fiber cables with zero watermarks and zero 403 blocks.
 * Supports CARTO (with optional API key) and self-hosted PMTiles archives.
 */
export function getBasemapStyle(options: BasemapOptions = {}): StyleSpecification {
  const {
    theme = "dark",
    provider = "esri",
    cartoApiKey,
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

  if (provider === "carto") {
    const rawTiles = theme === "dark" ? CARTO_BASEMAP_URLS.dark : CARTO_BASEMAP_URLS.light;
    const tiles = cartoApiKey
      ? rawTiles.map((url) => `${url}?api_key=${encodeURIComponent(cartoApiKey)}`)
      : rawTiles;

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

  // Default: Esri World Dark / Light Gray Canvas (Zero Watermark, High Performance)
  const tiles = theme === "dark" ? ESRI_BASEMAP_URLS.dark : ESRI_BASEMAP_URLS.light;

  return {
    version: 8,
    name: theme === "dark" ? "Esri World Dark Gray Canvas" : "Esri World Light Gray Canvas",
    sources: {
      "esri-basemap": {
        type: "raster",
        tiles,
        tileSize: 256,
        attribution: ESRI_ATTRIBUTION,
        maxzoom: 16,
      },
    },
    layers: [
      {
        id: "esri-basemap-tiles",
        type: "raster",
        source: "esri-basemap",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}
