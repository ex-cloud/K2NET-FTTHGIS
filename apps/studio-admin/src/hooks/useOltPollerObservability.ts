"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export interface OltDeviceLive {
  code: string;
  hostname: string;
  ip: string;
  vendor: string;
  snmpStatus: "UP" | "DOWN" | "SLOW";
  responseTimeMs: number | null;
  lastPolledAt: string | null;
  location: string;
  isLive: boolean;
}

export interface PollerInfo {
  status: string;
  deviceCount: number;
  pollInterval: string;
  redisStatus: string;
  time: string | null;
}

export interface OltPollerSummary {
  totalDevices: number;
  onlineCount: number;
  snmpSuccessRate: number;
  lastPolledAt: string | null;
}

interface OltPollerData {
  pollerInfo: PollerInfo;
  devices: OltDeviceLive[];
  summary: OltPollerSummary;
}

const DEFAULT_POLLER_INFO: PollerInfo = {
  status: "loading",
  deviceCount: 0,
  pollInterval: "—",
  redisStatus: "unknown",
  time: null,
};

const DEFAULT_SUMMARY: OltPollerSummary = {
  totalDevices: 0,
  onlineCount: 0,
  snmpSuccessRate: 0,
  lastPolledAt: null,
};

export function useOltPollerObservability() {
  const { data: session } = useSession();
  const [data, setData] = useState<OltPollerData>({
    pollerInfo: DEFAULT_POLLER_INFO,
    devices: [],
    summary: DEFAULT_SUMMARY,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) { setLoading(false); return; }

    try {
      const res = await fetch("/api/observability/olt-poller", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`olt-poller stats: ${res.status}`);
      const json: OltPollerData = await res.json();

      if (mounted.current) {
        setData(json);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (mounted.current) {
        setError("OLT Poller telemetry unavailable");
        setData({
          pollerInfo: { status: "offline", deviceCount: 0, pollInterval: "—", redisStatus: "unknown", time: null },
          devices: [],
          summary: { totalDevices: 0, onlineCount: 0, snmpSuccessRate: 0, lastPolledAt: null },
        });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => { mounted.current = false; clearInterval(interval); };
  }, [fetchData]);

  const formatLastPolled = (iso: string | null): string => {
    if (!iso) return "—";
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } catch {
      return iso;
    }
  };

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
    formatLastPolled,
  };
}
