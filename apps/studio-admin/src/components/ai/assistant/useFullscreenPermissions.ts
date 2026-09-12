import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  fetchAgentPermissionsCatalog,
  saveAgentAuthorization,
  revokeAgentAuthorization,
  type PermissionCatalogData,
  type AgentAuthorizationData,
} from "@/lib/actions/gateways";
import type { PermTier } from "../ai-drawer-permissions";

export function useFullscreenPermissions(
  rightPanelOpen: boolean,
  rightPanelView: "summary" | "permissions",
  setRightPanelView: (v: "summary" | "permissions") => void,
  agentAuth: AgentAuthorizationData | null
) {
  const [permCatalog, setPermCatalog] = useState<PermissionCatalogData | null>(null);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permRevoking, setPermRevoking] = useState(false);
  const [permTier, setPermTier] = useState<PermTier>(
    agentAuth?.access_tier === "READ_ONLY"
      ? "READ_ONLY"
      : agentAuth?.access_tier === "CUSTOM"
      ? "CUSTOM"
      : "FULL"
  );
  const [permSelected, setPermSelected] = useState<Set<string>>(
    new Set(agentAuth?.granted_permissions || [])
  );
  const [permSearch, setPermSearch] = useState("");
  const [permExpandedDomains, setPermExpandedDomains] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (rightPanelOpen && rightPanelView === "permissions" && !permCatalog) {
      setPermLoading(true);
      fetchAgentPermissionsCatalog(agentAuth?.user_scope || "PLATFORM_INTERNAL")
        .then((catRes) => {
          setPermCatalog(catRes);
          setPermExpandedDomains(new Set(catRes.domains.map((d) => d.id)));
          if (permTier === "FULL") {
            setPermSelected(new Set(catRes.domains.flatMap((d) => d.permissions.map((p) => p.id))));
          } else if (permTier === "READ_ONLY") {
            setPermSelected(
              new Set(
                catRes.domains
                  .flatMap((d) => d.permissions.filter((p) => p.scope === "Read").map((p) => p.id))
              )
            );
          }
        })
        .catch((err) => toast.error("Gagal memuat katalog izin: " + String(err)))
        .finally(() => setPermLoading(false));
    }
  }, [rightPanelOpen, rightPanelView, permCatalog, agentAuth?.user_scope, permTier]);

  const handleSavePermissions = async () => {
    setPermSaving(true);
    try {
      const permissionsToGrant =
        permTier === "FULL"
          ? permCatalog
            ? permCatalog.domains.flatMap((d) => d.permissions.map((p) => p.id))
            : Array.from(permSelected)
          : Array.from(permSelected);

      await saveAgentAuthorization({
        user_scope: agentAuth?.user_scope || "PLATFORM_INTERNAL",
        access_tier: permTier,
        granted_permissions: permissionsToGrant,
      });

      toast.success("Otorisasi K2 Agent berhasil disimpan");
      setRightPanelView("summary");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan otorisasi");
    } finally {
      setPermSaving(false);
    }
  };

  const handleRevokePermissions = async () => {
    setPermRevoking(true);
    try {
      await revokeAgentAuthorization();
      setPermSelected(new Set());
      setPermTier("CUSTOM");
      toast.success("Otorisasi K2 Agent berhasil dicabut.");
      setRightPanelView("summary");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mencabut otorisasi");
    } finally {
      setPermRevoking(false);
    }
  };

  return {
    permCatalog,
    permLoading,
    permSaving,
    permRevoking,
    permTier,
    setPermTier,
    permSelected,
    setPermSelected,
    permSearch,
    setPermSearch,
    permExpandedDomains,
    setPermExpandedDomains,
    handleSavePermissions,
    handleRevokePermissions,
  };
}
