"use client";

import React from "react";
import { type IsometricFigureMeta } from "./iso-utils";
import { LinearPurposeBuiltFigure } from "./figures/fig-01-purpose-built";
import { LinearAgentClusterFigure } from "./figures/fig-02-agent-cluster";
import { LinearSpeedArrayFigure } from "./figures/fig-03-speed-array";
import { LinearSpatialTopologyFigure } from "./figures/fig-04-spatial-topology";
import { LinearVectorMatrixFigure } from "./figures/fig-05-vector-matrix";
import { LinearMicroserviceBusFigure } from "./figures/fig-06-microservice-bus";

export const ISOMETRIC_FIGURES_LIST: IsometricFigureMeta[] = [
  {
    id: "fig-01",
    fig: "FIG 0.1",
    tag: "PURPOSE-BUILT",
    title: "Purpose-built architecture",
    desc: "Engineered from the ground up with zero bloat. Layered solid modularity for mission-critical enterprise telecom operations.",
    component: <LinearPurposeBuiltFigure />,
  },
  {
    id: "fig-02",
    fig: "FIG 0.2",
    tag: "AUTONOMOUS",
    title: "Powered by intelligent agents",
    desc: "Multi-cluster agent pods running parallel vector queries, real-time spatial triangulation, and automated diagnostics.",
    component: <LinearAgentClusterFigure />,
  },
  {
    id: "fig-03",
    fig: "FIG 0.3",
    tag: "HIGH VELOCITY",
    title: "Designed for sub-millisecond speed",
    desc: "Streamlined synchronous pipeline reducing latency and network jitter to ship telemetry updates with maximum velocity.",
    component: <LinearSpeedArrayFigure />,
  },
  {
    id: "fig-04",
    fig: "FIG 0.4",
    tag: "SPATIAL GIS",
    title: "Spatial FTTH network topology",
    desc: "Real-time PostGIS topological graphs linking OLT central offices, optical splitters, and distribution points.",
    component: <LinearSpatialTopologyFigure />,
  },
  {
    id: "fig-05",
    fig: "FIG 0.5",
    tag: "PGVECTOR",
    title: "Vector embedding retrieval matrix",
    desc: "500-token chunk vector embeddings stored in PostgreSQL pgvector with cosine similarity distance lookups.",
    component: <LinearVectorMatrixFigure />,
  },
  {
    id: "fig-06",
    fig: "FIG 0.6",
    tag: "MICROSERVICES",
    title: "High-throughput event bus",
    desc: "Decoupled Go microservice gateways processing asynchronous notification queues, payment webhooks, and SNMP telemetry.",
    component: <LinearMicroserviceBusFigure />,
  },
];

// Helper to render by ID for Login or Hero viewports
export function renderIsometricFigureById(id: string, size: "card" | "hero" = "hero") {
  switch (id) {
    case "fig-02":
      return <LinearAgentClusterFigure size={size} interactive={true} />;
    case "fig-03":
      return <LinearSpeedArrayFigure size={size} interactive={true} />;
    case "fig-04":
      return <LinearSpatialTopologyFigure size={size} interactive={true} />;
    case "fig-05":
      return <LinearVectorMatrixFigure size={size} interactive={true} />;
    case "fig-06":
      return <LinearMicroserviceBusFigure size={size} interactive={true} />;
    case "fig-01":
    default:
      return <LinearPurposeBuiltFigure size={size} interactive={true} />;
  }
}
