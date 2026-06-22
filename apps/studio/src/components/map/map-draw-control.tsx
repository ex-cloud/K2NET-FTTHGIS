/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useControl } from "react-map-gl/maplibre";
import type { IControl } from "react-map-gl/maplibre";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

import type { Feature } from "geojson";

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onCreate?: (evt: { features: Feature[] }) => void;
  onUpdate?: (evt: { features: Feature[]; action: string }) => void;
  onDelete?: (evt: { features: Feature[] }) => void;
};

const DRAW_STYLES = [
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": ["case", ["==", ["get", "active"], "true"], "#10b981", "#0ea5e9"],
      "fill-opacity": 0.1,
    },
  },
  {
    id: "gl-draw-lines",
    type: "line",
    filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["case", ["==", ["get", "active"], "true"], "#10b981", "#0ea5e9"],
      "line-dasharray": [
        "case",
        ["==", ["get", "active"], "true"],
        ["literal", [0.2, 2]],
        ["literal", [2, 0]],
      ],
      "line-width": 2,
    },
  },
  {
    id: "gl-draw-point-outer",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 7, 5],
      "circle-color": "#fff",
    },
  },
  {
    id: "gl-draw-point-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 5, 3],
      "circle-color": ["case", ["==", ["get", "active"], "true"], "#10b981", "#0ea5e9"],
    },
  },
  {
    id: "gl-draw-vertex-outer",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"], ["!=", "mode", "simple_select"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 7, 5],
      "circle-color": "#fff",
    },
  },
  {
    id: "gl-draw-vertex-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"], ["!=", "mode", "simple_select"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 5, 3],
      "circle-color": "#10b981",
    },
  },
  {
    id: "gl-draw-midpoint",
    type: "circle",
    filter: ["all", ["==", "meta", "midpoint"]],
    paint: { "circle-radius": 3, "circle-color": "#fbb03b" },
  },
];

export const MapDrawControl = React.forwardRef<MapboxDraw, DrawControlProps>((props, ref) => {
  const draw = useControl<IControl>(
    () => new MapboxDraw({ ...props, styles: DRAW_STYLES as any }) as unknown as IControl,
    ({ map }) => {
      map.on("draw.create" as any, props.onCreate || (() => {}));
      map.on("draw.update" as any, props.onUpdate || (() => {}));
      map.on("draw.delete" as any, props.onDelete || (() => {}));
    },
    ({ map }) => {
      map.off("draw.create" as any, props.onCreate || (() => {}));
      map.off("draw.update" as any, props.onUpdate || (() => {}));
      map.off("draw.delete" as any, props.onDelete || (() => {}));
    },
    {
      position: props.position || "top-left",
    }
  );

  React.useImperativeHandle(ref, () => draw as unknown as MapboxDraw, [draw]);

  return null;
});

MapDrawControl.displayName = "MapDrawControl";
