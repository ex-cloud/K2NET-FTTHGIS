"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export interface KeycloakEvent {
  time: number;
  type: string;
  userId: string;
  clientId: string;
  details?: { ipAddress?: string; [key: string]: string | undefined };
}

export interface ServiceConnection {
  service: string;
  status: "CONNECTED" | "DISCONNECTED";
  latency: string;
  detail: string;
}

export interface KeycloakStats {
  totalUsers: number;
  activeSessions: number;
  failedLogins24h: number;
  status: string;
  realm: string;
  connections: ServiceConnection[];
}

const DEFAULT_STATS: KeycloakStats = {
  totalUsers: 0,
  activeSessions: 0,
  failedLogins24h: 0,
  status: "loading",
  realm: "ftth-realm",
  connections: [],
};

export function useKeycloakObservability() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<KeycloakEvent[]>([]);
  const [stats, setStats] = useState<KeycloakStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };

      const [eventsRes, statsRes] = await Promise.all([
        fetch("/api/v1/system/keycloak/events", { headers, cache: "no-store" }),
        fetch("/api/v1/system/keycloak/stats", { headers, cache: "no-store" }),
      ]);

      if (!eventsRes.ok || !statsRes.ok) {
        throw new Error("Keycloak observability API unavailable");
      }

      const eventsData = await eventsRes.json();
      const statsData = await statsRes.json();

      if (mounted.current) {
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setStats(statsData);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Keycloak API unavailable — showing estimates");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  // Format event type to readable label
  function formatEventType(type: string): { label: string; severity: "success" | "error" | "warning" | "info" } {
    const map: Record<string, { label: string; severity: "success" | "error" | "warning" | "info" }> = {
      LOGIN:           { label: "Login Success",           severity: "success" },
      LOGOUT:          { label: "Logout",                  severity: "info"    },
      REFRESH_TOKEN:   { label: "Token Refresh",           severity: "info"    },
      CODE_TO_TOKEN:   { label: "Code-to-Token Exchange",  severity: "info"    },
      LOGIN_ERROR:     { label: "Login Failed",            severity: "error"   },
      CLIENT_LOGIN:    { label: "Client Login",            severity: "info"    },
      INTROSPECT_TOKEN:{ label: "Token Introspection",     severity: "info"    },
      REGISTER:        { label: "New User Registration",   severity: "success" },
    };
    return map[type] ?? { label: type, severity: "info" };
  }

  // Format unix timestamp to readable string
  function formatEventTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString("id-ID", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  return { events, stats, loading, error, refresh: fetchData, formatEventType, formatEventTime };
}
