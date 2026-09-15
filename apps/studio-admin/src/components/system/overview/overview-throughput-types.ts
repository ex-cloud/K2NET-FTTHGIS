export interface ThroughputDataPoint {
  hour: string;
  hits: number;
}

export type ServiceFilterType = "ALL" | "MAP" | "API" | "MESSAGING";
export type ChartViewMode = "bars" | "area";

export interface EnrichedThroughputPoint {
  hour: string;
  timeRange: string;
  totalHits: number;
  filteredHits: number;
  successCount: number;
  clientErrCount: number;
  serverErrCount: number;
  successRate: number;
  latencyMs: number;
  peakRpm: number;
  mapHits: number;
  coreHits: number;
  messagingHits: number;
  storageHits: number;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: EnrichedThroughputPoint }>;
  label?: string;
}
