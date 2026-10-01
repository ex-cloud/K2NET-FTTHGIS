import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Lock, Tag, Users } from "lucide-react";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { Button, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface OrphanedPermission {
  id: number;
  code: string;
  module: string;
  scope: string;
  name: string;
}

interface EmptyRole {
  id: number;
  name: string;
  scope: string;
  isSystemRole: boolean;
  displayName: string;
}

interface SimilarRolePair {
  roleAId: number;
  roleA: string;
  roleBId: number;
  roleB: string;
  score: number;
}

interface GovernanceHealthReport {
  orphanedPermissions: OrphanedPermission[];
  rolesWithoutPermissions: EmptyRole[];
  similarRoleNamePairs: SimilarRolePair[];
  totalIssues: number;
  checkedAt: string;
}

function OrphansTabContent({
  permissions,
  onSelect,
}: {
  permissions: OrphanedPermission[];
  onSelect?: (code: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {t("security.governance_orphaned_desc")}
      </p>
      {permissions.length === 0 ? (
        <div className="p-3 bg-card/40 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          {t("security.governance_orphaned_clean")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {permissions.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelect && onSelect(p.code)}
              className={`p-2.5 rounded-lg bg-card/60 border border-border flex flex-col justify-between ${
                onSelect ? "cursor-pointer hover:border-amber-500/50 transition-colors" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-amber-400 break-all">{p.code}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {p.scope}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">{p.name || p.module}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyRolesTabContent({
  roles,
  onSelect,
}: {
  roles: EmptyRole[];
  onSelect?: (roleName: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {t("security.governance_empty_roles_desc")}
      </p>
      {roles.length === 0 ? (
        <div className="p-3 bg-card/40 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          {t("security.governance_empty_roles_clean")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {roles.map((r) => (
            <div
              key={r.id}
              onClick={() => onSelect && onSelect(r.name)}
              className={`p-2.5 rounded-lg bg-card/60 border border-border flex flex-col justify-between ${
                onSelect ? "cursor-pointer hover:border-amber-500/50 transition-colors" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground">{r.displayName || r.name}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">
                  {r.scope}
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">role_name: {r.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SimilarRolesTabContent({ pairs }: { pairs: SimilarRolePair[] }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {t("security.governance_similar_roles_desc")}
      </p>
      {pairs.length === 0 ? (
        <div className="p-3 bg-card/40 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          {t("security.governance_similar_roles_clean")}
        </div>
      ) : (
        <div className="space-y-2">
          {pairs.map((pair, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-card/60 border border-border flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-foreground px-2 py-1 rounded bg-muted">
                  {pair.roleA}
                </span>
                <span className="text-xs text-muted-foreground font-bold">vs</span>
                <span className="text-xs font-mono font-semibold text-foreground px-2 py-1 rounded bg-muted">
                  {pair.roleB}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {(pair.score * 100).toFixed(0)}% Mirip
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GovernanceHealthDetailsDrawer({
  report,
  activeTab,
  setActiveTab,
  onSelectPermission,
  onSelectRole,
}: {
  report: GovernanceHealthReport;
  activeTab: "orphans" | "empty_roles" | "similar";
  setActiveTab: (tab: "orphans" | "empty_roles" | "similar") => void;
  onSelectPermission?: (code: string) => void;
  onSelectRole?: (roleName: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-4">
      <div className="flex gap-2 border-b border-border/50 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("orphans")}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
            activeTab === "orphans"
              ? "bg-amber-500/25 text-amber-300 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          {t("security.governance_tab_orphaned")} ({report.orphanedPermissions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("empty_roles")}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
            activeTab === "empty_roles"
              ? "bg-amber-500/25 text-amber-300 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          {t("security.governance_tab_empty")} ({report.rolesWithoutPermissions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("similar")}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
            activeTab === "similar"
              ? "bg-amber-500/25 text-amber-300 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          {t("security.governance_tab_similar")} ({report.similarRoleNamePairs.length})
        </button>
      </div>

      {activeTab === "orphans" && (
        <OrphansTabContent permissions={report.orphanedPermissions} onSelect={onSelectPermission} />
      )}
      {activeTab === "empty_roles" && (
        <EmptyRolesTabContent roles={report.rolesWithoutPermissions} onSelect={onSelectRole} />
      )}
      {activeTab === "similar" && (
        <SimilarRolesTabContent pairs={report.similarRoleNamePairs} />
      )}
    </div>
  );
}

export function GovernanceHealthBanner({
  onSelectPermission,
  onSelectRole,
}: {
  onSelectPermission?: (code: string) => void;
  onSelectRole?: (roleName: string) => void;
}) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [report, setReport] = useState<GovernanceHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"orphans" | "empty_roles" | "similar">("orphans");

  const fetchHealth = useCallback(async (silent = false) => {
    if (!session?.accessToken) return;
    try {
      if (!silent) setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/security/governance-health`, {
        token: session.accessToken,
      });

      if (!res.ok) throw new Error("Failed to fetch governance health");

      const data: GovernanceHealthReport = await res.json();
      setReport(data);
    } catch (err) {
      console.warn("Governance health check note:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (loading || !report || report.totalIssues === 0) {
    return null;
  }

  return (
    <div className="w-full mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-foreground shadow-lg transition-all animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm text-foreground">
                {t("security.governance_alert_title")}
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                {t("security.governance_issues_found", { count: report.totalIssues })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {report.orphanedPermissions.length > 0 && (
                <span className="mr-3 font-medium">
                  • <strong className="text-amber-400">{report.orphanedPermissions.length}</strong> {t("security.governance_unassigned_perm_count", { count: report.orphanedPermissions.length })}
                </span>
              )}
              {report.rolesWithoutPermissions.length > 0 && (
                <span className="mr-3 font-medium">
                  • <strong className="text-amber-400">{report.rolesWithoutPermissions.length}</strong> {t("security.governance_empty_role_count", { count: report.rolesWithoutPermissions.length })}
                </span>
              )}
              {report.similarRoleNamePairs.length > 0 && (
                <span className="font-medium">
                  • <strong className="text-amber-400">{report.similarRoleNamePairs.length}</strong> {t("security.governance_similar_pair_count", { count: report.similarRoleNamePairs.length })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <ActionTooltip label={t("security.governance_refresh_tooltip")}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHealth(true)}
              className="h-8 px-2.5 text-xs border-amber-500/30 hover:bg-amber-500/20 text-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </ActionTooltip>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-8 text-xs font-semibold border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-foreground flex items-center gap-1.5"
          >
            {isExpanded ? (
              <>
                {t("common.close")} <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                {t("common.view_details")} <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <GovernanceHealthDetailsDrawer
          report={report}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSelectPermission={onSelectPermission}
          onSelectRole={onSelectRole}
        />
      )}
    </div>
  );
}
