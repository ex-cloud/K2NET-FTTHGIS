import { useState, useEffect, useCallback } from "react";
import {
  fetchAgentPermissionsCatalog,
  saveAgentAuthorization,
  revokeAgentAuthorization,
  type AgentAuthorizationData,
  type PermissionCatalogData,
} from "@/lib/actions/gateways";
import type { PermTier } from "../ai-drawer-permissions";
import { toast } from "sonner";

export function useAssistantPermissions(
  view: string,
  agentAuth: AgentAuthorizationData | null,
  setAgentAuth: (auth: AgentAuthorizationData | null) => void,
  setView: (v: "chat" | "onboarding" | "permissions" | "settings") => void
) {
  const [permCatalog, setPermCatalog] = useState<PermissionCatalogData | null>(null);
  const [permLoading, setPermLoading] = useState(false);
  const [permTier, setPermTier] = useState<PermTier>("FULL");
  const [permSelected, setPermSelected] = useState<Set<string>>(new Set());
  const [permSearch, setPermSearch] = useState("");
  const [permExpandedDomains, setPermExpandedDomains] = useState<Set<string>>(new Set());
  const [permSaving, setPermSaving] = useState(false);
  const [permRevoking, setPermRevoking] = useState(false);

  useEffect(() => {
    if ((view !== "permissions" && view !== "settings") || permCatalog) return;
    setPermLoading(true);
    fetchAgentPermissionsCatalog("PLATFORM_INTERNAL")
      .then((cat) => {
        setPermCatalog(cat);
        setPermExpandedDomains(new Set(cat.domains.map((d) => d.id)));
        const existing = agentAuth?.granted_permissions;
        setPermSelected(
          existing?.length
            ? new Set(existing)
            : new Set(cat.domains.flatMap((d) => d.permissions.map((p) => p.id)))
        );
        setPermTier((agentAuth?.access_tier as PermTier) || "FULL");
      })
      .catch(console.error)
      .finally(() => setPermLoading(false));
  }, [view, permCatalog, agentAuth]);

  const applyTier = useCallback(
    (tier: PermTier) => {
      setPermTier(tier);
      if (!permCatalog) return;
      if (tier === "FULL") {
        setPermSelected(new Set(permCatalog.domains.flatMap((d) => d.permissions.map((p) => p.id))));
      } else if (tier === "READ_ONLY") {
        setPermSelected(
          new Set(
            permCatalog.domains.flatMap((d) =>
              d.permissions.filter((p) => p.scope === "Read").map((p) => p.id)
            )
          )
        );
      }
    },
    [permCatalog]
  );

  const togglePerm = useCallback((id: string) => {
    setPermTier("CUSTOM");
    setPermSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDomain = useCallback((id: string) => {
    setPermExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAuthorize = useCallback(async () => {
    try {
      setPermSaving(true);
      const res = await saveAgentAuthorization({
        agent_name: "K2 Agent",
        user_scope: "PLATFORM_INTERNAL",
        access_tier: permTier,
        granted_permissions: Array.from(permSelected),
      });
      setAgentAuth(res);
      setView("chat");
      toast.success("K2 Agent berhasil diotorisasi!");
    } catch {
      toast.error("Gagal menyimpan otorisasi");
    } finally {
      setPermSaving(false);
    }
  }, [permTier, permSelected, setAgentAuth, setView]);

  const handleRevoke = useCallback(async () => {
    if (!confirm("Cabut akses K2 Agent?")) return;
    try {
      setPermRevoking(true);
      await revokeAgentAuthorization();
      setAgentAuth(null);
      setPermCatalog(null);
      setView("onboarding");
      toast.success("Otorisasi berhasil dicabut");
    } catch {
      toast.error("Gagal mencabut otorisasi");
    } finally {
      setPermRevoking(false);
    }
  }, [setAgentAuth, setView]);

  const permSharedProps = {
    catalog: permCatalog,
    loading: permLoading,
    tier: permTier,
    selected: permSelected,
    search: permSearch,
    expandedDomains: permExpandedDomains,
    onSetTier: applyTier,
    onTogglePermission: togglePerm,
    onToggleDomain: toggleDomain,
    onSearchChange: setPermSearch,
  };

  return {
    permSharedProps,
    permSaving,
    permRevoking,
    setPermSearch,
    handleAuthorize,
    handleRevoke,
  };
}
