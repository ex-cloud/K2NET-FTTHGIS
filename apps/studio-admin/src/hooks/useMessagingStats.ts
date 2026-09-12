

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-compat";

export interface MessageQueueItem {
  id: string;
  message: string;
  recipient: string;
  type: "whatsapp" | "sms" | "email";
  queue: string;
  status: "sent" | "pending" | "processing" | "failed";
  sentAt: string | null;
}

export interface MessagingStats {
  queueDepth: number;
  deliveryRate24h: number;
  totalSent24h: number;
  totalDelivered24h: number;
  totalFailed24h: number;
  wabaStatus: string;
  twilioConfigured: boolean;
  smtpConfigured: boolean;
  status: string;
}

const DEFAULT_STATS: MessagingStats = {
  queueDepth: 0,
  deliveryRate24h: 0,
  totalSent24h: 0,
  totalDelivered24h: 0,
  totalFailed24h: 0,
  wabaStatus: "loading",
  twilioConfigured: false,
  smtpConfigured: false,
  status: "loading",
};

import { memoryCache } from "@/lib/memoryCache";

const CACHE_KEY = "obs:messaging_stats";

interface MessagingCacheData {
  stats: MessagingStats;
  queue: MessageQueueItem[];
}

function mapMessagingStats(data: Record<string, unknown>): MessagingStats {
  return {
    queueDepth: Number(data.queue_depth ?? data.queueDepth ?? 0),
    deliveryRate24h: Number(data.delivery_rate_24h ?? data.deliveryRate24h ?? 0),
    totalSent24h: Number(data.total_sent_24h ?? data.totalSent24h ?? 0),
    totalDelivered24h: Number(data.total_delivered_24h ?? data.totalDelivered24h ?? 0),
    totalFailed24h: Number(data.total_failed_24h ?? data.totalFailed24h ?? 0),
    wabaStatus: String(data.waba_status ?? data.wabaStatus ?? "NOT_CONFIGURED"),
    twilioConfigured: Boolean(data.twilio_configured ?? data.twilioConfigured ?? false),
    smtpConfigured: Boolean(data.smtp_configured ?? data.smtpConfigured ?? false),
    status: String(data.status ?? "healthy"),
  };
}

function mapQueueItems(rawQueue: Record<string, unknown>[]): MessageQueueItem[] {
  return rawQueue.map((m, i): MessageQueueItem => ({
    id: String(m.id ?? i),
    message: String(m.message ?? m.body ?? "—"),
    recipient: String(m.recipient ?? m.phone ?? "—"),
    type: (m.type as MessageQueueItem["type"]) ?? "whatsapp",
    queue: String(m.queue ?? "default"),
    status: (m.status as MessageQueueItem["status"]) ?? "sent",
    sentAt: m.sent_at ? String(m.sent_at) : null,
  }));
}

export function useMessagingStats() {
  const { data: session } = useSession();
  const cached = memoryCache.get<MessagingCacheData>(CACHE_KEY);
  const [stats, setStats] = useState<MessagingStats>(cached?.stats || DEFAULT_STATS);
  const [queue, setQueue] = useState<MessageQueueItem[]>(cached?.queue || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    if (!isSilent && !memoryCache.get(CACHE_KEY)) {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/v1/observability/notification-stats", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`notification-stats: ${res.status}`);
      }
      const data = await res.json();
      const mapped = mapMessagingStats(data);
      const queueItems = mapQueueItems(data.recent_queue ?? data.recentQueue ?? []);

      if (mounted.current) {
        memoryCache.set(CACHE_KEY, { stats: mapped, queue: queueItems });
        setStats(mapped);
        setQueue(queueItems);
        setError(null);
      }
    } catch {
      if (mounted.current) {
        setError("notification-gateway stats unavailable");
        setStats(DEFAULT_STATS);
        setQueue([]);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [session?.accessToken]);

  useEffect(() => {
    mounted.current = true;
    if (memoryCache.isFresh(CACHE_KEY, 15_000)) {
      fetchStats(true);
    } else {
      fetchStats(!!cached);
    }
    const interval = setInterval(() => fetchStats(true), 30_000);
    return () => { mounted.current = false; clearInterval(interval); };
  }, [fetchStats, cached]);

  return { stats, queue, loading, error, refresh: () => fetchStats(false) };
}
