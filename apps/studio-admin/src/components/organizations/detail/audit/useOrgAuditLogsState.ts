import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "@/lib/auth-compat";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantAuditEvent, RawTenantAuditEvent, AuditSeverity } from "./types";

function parseJsonSafe(str?: string): Record<string, unknown> {
  if (!str) return {};
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function getCategory(action: string, resType: string): TenantAuditEvent["category"] {
  const act = (action + " " + resType).toUpperCase();
  if (act.includes("AUTH") || act.includes("LOGIN") || act.includes("IAM") || act.includes("KEYCLOAK")) return "AUTH";
  if (act.includes("GIS") || act.includes("NODE") || act.includes("ODP") || act.includes("OLT") || act.includes("TOPOLOGY")) return "GIS_TOPOLOGY";
  if (act.includes("SECURITY") || act.includes("NUCLEAR") || act.includes("PERMISSION")) return "SECURITY";
  return "CONFIG";
}

export function useOrgAuditLogsState(org: EnrichedOrganization) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<TenantAuditEvent | null>(null);

  // Fetch real audit events from backend
  const { data: rawEvents = [], refetch, isRefetching } = useQuery<RawTenantAuditEvent[]>({
    queryKey: ["tenant-audit-events", org.slug, session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return [];
      const baseUrl = getBackendBaseUrl();
      try {
        const res = await httpClient(`${baseUrl}/organizations/${org.slug}/audit-events?_limit=50`, {
          token: session.accessToken,
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn("Could not fetch tenant audit events:", e);
      }
      return [];
    },
    enabled: !!session?.accessToken,
  });

  const events: TenantAuditEvent[] = useMemo(() => {
    return rawEvents.map((r, idx: number) => {
      const beforeState = parseJsonSafe(r.oldValueJson);
      const afterState = parseJsonSafe(r.newValueJson);
      const meta = parseJsonSafe(r.metadataJson);
      const act = r.action || "SYSTEM_EVENT";
      const res = r.resourceType || "ORGANIZATION";

      let severity: AuditSeverity = "INFO";
      if (act.includes("NUCLEAR") || act.includes("DELETE") || act.includes("FAILED") || act.includes("DENIED")) {
        severity = "CRITICAL";
      } else if (act.includes("UPDATE") || act.includes("SOFT_DELETE") || act.includes("WARN")) {
        severity = "WARN";
      }

      const description = typeof meta.description === "string" ? meta.description : undefined;

      return {
        id: r.id || `evt-${idx + 1}`,
        timestamp: r.occurredAt
          ? new Date(r.occurredAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
          : "Recently",
        actorUsername: r.actorId ? r.actorId.split("@")[0] : "system",
        actorEmail: r.actorId || r.actorEmail || "system@kdua.net",
        ipAddress: r.actorIp || r.clientIp || "127.0.0.1",
        action: act,
        category: getCategory(act, res),
        targetEntity: res,
        targetId: r.resourceId || org.slug,
        severity,
        status: "SUCCESS",
        details: description || `Audit event ${act} on ${res} (${r.resourceId || org.slug})`,
        beforeState,
        afterState,
      };
    });
  }, [rawEvents, org.slug]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast.success("Log audit organisasi berhasil disinkronkan.");
  }, [refetch]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch =
        evt.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.actorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.targetEntity.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = selectedSeverity === "ALL" || evt.severity === selectedSeverity;
      const matchesCategory = selectedCategory === "ALL" || evt.category === selectedCategory;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [events, searchQuery, selectedSeverity, selectedCategory]);

  return {
    searchQuery,
    setSearchQuery,
    selectedSeverity,
    setSelectedSeverity,
    selectedCategory,
    setSelectedCategory,
    selectedEvent,
    setSelectedEvent,
    isRefetching,
    filteredEvents,
    handleRefresh,
  };
}
