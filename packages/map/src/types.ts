export type CableType = "BACKBONE" | "DISTRIBUTION" | "DROP_CORE";
export type NodeType = "OLT" | "ODC" | "ODP" | "FAT" | "POLE" | "CLOSURE";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface CableFeatureProperties {
  id: string;
  code: string;
  name: string;
  cableType: CableType;
  coreCount: number;
  lengthMeters: number;
  status: "ACTIVE" | "MAINTENANCE" | "DAMAGED" | "PLAN";
  opticalLossDb?: number;
}

export interface NodeFeatureProperties {
  id: string;
  code: string;
  name: string;
  nodeType: NodeType;
  totalPorts: number;
  usedPorts: number;
  status: "ACTIVE" | "MAINTENANCE" | "DEGRADED" | "PLAN";
  rxPowerDbm?: number;
}

export interface AttenuationBudgetParams {
  fiberLengthKm: number;
  fiberAttenuationDbPerKm?: number; // default 0.35 dB/km @ 1310nm or 0.22 dB/km @ 1490nm/1550nm
  spliceCount?: number;            // 0.05 dB per fusion splice
  connectorCount?: number;         // 0.3 dB per SC/UPC or SC/APC connector
  splitterRatios?: (1 | 2 | 4 | 8 | 16 | 32 | 64)[]; // e.g. 1:4 (7.2dB), 1:8 (10.5dB), 1:16 (13.8dB)
}
