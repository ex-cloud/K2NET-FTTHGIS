

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-compat";

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

import { memoryCache } from "@/lib/memoryCache";

const CACHE_KEY = "obs:olt_poller";

export function useOltPollerObservability() {
  const { data: session } = useSession();
  const cached = memoryCache.get<OltPollerData>(CACHE_KEY);
  const [data, setData] = useState<OltPollerData>(cached || {
    pollerInfo: DEFAULT_POLLER_INFO,
    devices: [],
    summary: DEFAULT_SUMMARY,
  });
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(cached ? new Date() : null);
  const mounted = useRef(true);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!session?.accessToken) { setLoading(false); return; }
    if (!isSilent && !memoryCache.get(CACHE_KEY)) setLoading(true);

    try {
      const res = await fetch("/api/v1/observability/olt-poller", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`olt-poller stats: ${res.status}`);
      const json: OltPollerData = await res.json();

      if (mounted.current) {
        memoryCache.set(CACHE_KEY, json);
        setData(json);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch {
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
    if (memoryCache.isFresh(CACHE_KEY, 15_000)) {
      fetchData(true);
    } else {
      fetchData(!!cached);
    }
    const interval = setInterval(() => fetchData(true), 30_000);
    return () => { mounted.current = false; clearInterval(interval); };
  }, [fetchData, cached]);

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
    refresh: () => fetchData(false),
    formatLastPolled,
  };
}
