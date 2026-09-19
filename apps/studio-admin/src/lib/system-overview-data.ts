import type { ThroughputDataPoint } from "@/components/system/overview/overview-throughput-types";

/**
 * Menghasilkan urutan 24 jam dinamis berdasarkan jam saat ini dengan initial value 0 hits.
 * Digunakan sebagai fallback aman sebelum response riil dari backend diterima via API.
 */
export function generateInitial24hTimeline(): ThroughputDataPoint[] {
  const points: ThroughputDataPoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = `${String(d.getHours()).padStart(2, "0")}:00`;
    points.push({
      hour,
      hits: 0,
      mapHits: 0,
      coreHits: 0,
      messagingHits: 0,
      storageHits: 0,
      iamHits: 0,
      successCount: 0,
      clientErrCount: 0,
      serverErrCount: 0,
      avgLatency: 0,
    });
  }
  return points;
}

export const throughputData: ThroughputDataPoint[] = generateInitial24hTimeline();

