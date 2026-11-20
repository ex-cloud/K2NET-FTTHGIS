import * as React from "react";
import { ChevronDown, ChevronRight, Search, Check, Info } from "lucide-react";
import { Input } from "../input";
import { Badge } from "../badge";
import { Switch } from "../switch";
import { cn } from "../../utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import {
  type UnifiedRoleOption,
  type UnifiedProjectOption,
  type UnifiedUserScope,
  type UnifiedTranslateFn,
  type DynamicModuleMeta,
  trKey,
  resolveRoleDescription,
  resolveCanonicalRoleCode,
  buildPermissionCategoriesForRole,
} from "./user-management-types";

export interface PermissionPoliciesAccordionProps {
  scope: UnifiedUserScope;
  scopeAccountName: string;
  targetMemberLabel: string;
  roles: UnifiedRoleOption[];
  selectedRoleId: number | null;
  selectedRoleName: string;
  onSelectRole: (role: UnifiedRoleOption) => void;
  projects?: UnifiedProjectOption[];
  selectedProjectId?: string;
  onSelectProjectId?: (projectId: string) => void;
  t?: UnifiedTranslateFn;
  modules?: DynamicModuleMeta[];
}

export function PermissionPoliciesAccordion({
  scope,
  scopeAccountName,
  targetMemberLabel,
  roles,
  selectedRoleId,
  selectedRoleName,
  onSelectRole,
  projects = [],
  selectedProjectId = "ALL",
  onSelectProjectId,
  t,
  modules: propModules,
}: PermissionPoliciesAccordionProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dynamicModules, setDynamicModules] = React.useState<DynamicModuleMeta[]>(propModules || []);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    overall_roles: true,
  });

  // Hybrid Dynamic Auto-Discovery (Opsi 2): Auto-fetch live modules registry
  React.useEffect(() => {
    if (propModules && propModules.length > 0) {
      setDynamicModules(propModules);
      return;
    }
    if (typeof window !== "undefined") {
      const qScope = scope === "platform" ? "system" : "tenant";
      fetch(`/api/v1/modules?scope=${qScope}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: DynamicModuleMeta[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setDynamicModules(data);
          }
        })
        .catch(() => {
          // Graceful fallback to static categories
        });
    }
  }, [propModules, scope]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const activeRole = React.useMemo(() => {
    if (roles.length === 0) return null;
    return (
      roles.find(
        (r) =>
          (selectedRoleId !== null && r.id === selectedRoleId) ||
          (selectedRoleName && r.name.toLowerCase() === selectedRoleName.toLowerCase())
      ) || null
    );
  }, [roles, selectedRoleId, selectedRoleName]);

  const filteredRoles = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => {
      const nameMatch = (r.displayName || r.name || "").toLowerCase().includes(q);
      const codeMatch = (r.code || "").toLowerCase().includes(q);
      const descMatch = resolveRoleDescription(r).toLowerCase().includes(q);
      return nameMatch || codeMatch || descMatch;
    });
  }, [roles, searchQuery]);

  const moduleCategories = React.useMemo(
    () => buildPermissionCategoriesForRole(scope, activeRole, dynamicModules),
    [scope, activeRole, dynamicModules]
  );

  const selectedCount = activeRole ? 1 : 0;
  const totalRolesCount = roles.length;

  const entireScopeLabel =
    scope === "platform"
      ? trKey(t, "users.cf_entire_account", "Entire account")
      : trKey(t, "users.cf_entire_workspace", "Entire workspace");

  return (
    <div className="space-y-4">
      {/* 1. Cloudflare 2-Column Account & Resource Scope Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5">
          <Select value="PRIMARY_ACCOUNT" disabled>
            <SelectTrigger className="h-9 text-xs bg-card border-border text-foreground font-medium">
              <SelectValue placeholder={scopeAccountName} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-foreground text-xs">
              <SelectItem value="PRIMARY_ACCOUNT">{scopeAccountName}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-7">
          {scope === "tenant" && projects.length > 0 && onSelectProjectId ? (
            <Select
              value={selectedProjectId || "ALL"}
              onValueChange={(val) => onSelectProjectId(val === "ALL" ? "" : val)}
            >
              <SelectTrigger className="h-9 text-xs bg-card border-border text-foreground">
                <SelectValue placeholder={entireScopeLabel} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground text-xs">
                <SelectItem value="ALL">{entireScopeLabel}</SelectItem>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>
                    {proj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value="ALL" disabled>
              <SelectTrigger className="h-9 text-xs bg-muted/40 border-border text-muted-foreground">
                <SelectValue placeholder={entireScopeLabel} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground text-xs">
                <SelectItem value="ALL">{entireScopeLabel}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* 2. Scope Definition Caption */}
      <p className="text-xs text-muted-foreground">
        {trKey(
          t,
          "users.cf_define_permissions_invite",
          "Define what permissions {{target}} should have within the account-level scope: {{scopeName}}.",
          {
            target: targetMemberLabel,
            scopeName: scopeAccountName,
          }
        )}
      </p>

      {/* 3. Search by Role Name */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={trKey(t, "users.cf_search_role_placeholder", "Search by role name...")}
          className="h-8.5 pl-8.5 text-xs bg-card border-border"
        />
      </div>

      {/* 3b. Role Permission Breakdown Callout Box */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/20 text-xs">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">
            {trKey(t, "users.cf_inspector_title", "Role Permission Breakdown")}
          </span>
          <p className="text-muted-foreground leading-relaxed">
            {trKey(
              t,
              "users.cf_inspector_desc",
              "Permissions below are strictly governed by the selected role. To configure a custom permission combination, use Roles & Permissions (/team/roles)."
            )}
          </p>
        </div>
      </div>

      {/* 4. Collapsible Accordion List (Cloudflare Pattern) */}
      <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border/70">
        {/* Accordion 1: Overall roles */}
        <div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => toggleGroup("overall_roles")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleGroup("overall_roles");
              }
            }}
            className="w-full px-4 py-3 flex items-center justify-between bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              {expandedGroups.overall_roles ? (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3.5 text-muted-foreground" />
              )}
              <span className="text-xs font-bold text-foreground">
                {trKey(t, "users.cf_overall_roles", "Overall roles")}
              </span>
            </div>

            <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-[11px] font-mono text-muted-foreground">
                {selectedCount}/{totalRolesCount}
              </span>
              <Switch
                checked={selectedCount > 0}
                onCheckedChange={(checked) => {
                  if (checked && !activeRole && roles.length > 0) {
                    onSelectRole(roles[0]);
                  }
                }}
              />
            </div>
          </div>

          {expandedGroups.overall_roles && (
            <div className="divide-y divide-dashed divide-border/70">
              {filteredRoles.length === 0 ? (
                <div className="px-6 py-4 text-xs text-muted-foreground">
                  {trKey(t, "users.invite_loading_roles", "Loading roles from database...")}
                </div>
              ) : (
                filteredRoles.map((role) => {
                  const isChecked =
                    activeRole !== null &&
                    (activeRole.id === role.id ||
                      activeRole.name.toLowerCase() === role.name.toLowerCase());
                  const codeBadge = resolveCanonicalRoleCode(role.name, role.code, scope);

                  return (
                    <div
                      key={role.id}
                      onClick={() => onSelectRole(role)}
                      className="px-6 py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <div className="md:col-span-4 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {role.displayName || role.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono px-1.5 py-0 bg-muted/40 text-muted-foreground border-border"
                        >
                          [{codeBadge}]
                        </Badge>
                      </div>

                      <div className="md:col-span-7 text-xs text-muted-foreground leading-relaxed">
                        {resolveRoleDescription(role)}
                      </div>

                      <div
                        className="md:col-span-1 flex md:justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Switch
                          checked={isChecked}
                          onCheckedChange={() => onSelectRole(role)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Accordion 2..K: Domain Module Permission Categories */}
        {moduleCategories.map((cat) => {
          const isExpanded = Boolean(expandedGroups[cat.id]);
          const activeItemsCount = cat.items.filter((i) => i.enabled).length;
          const totalItemsCount = cat.items.length;

          return (
            <div key={cat.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleGroup(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleGroup(cat.id);
                  }
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {isExpanded ? (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold text-foreground">
                    {trKey(t, cat.titleKey, cat.fallbackTitle)}
                  </span>
                  {cat.minPlanTier && cat.minPlanTier !== "FREE" && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-mono">
                      {trKey(t, "modules.badge_requires_tier", `Requires ${cat.minPlanTier} Plan`, { tier: cat.minPlanTier })}
                    </span>
                  )}
                  {cat.status === "MAINTENANCE" && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                      {trKey(t, "modules.badge_maintenance", "Maintenance")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 border-border",
                      activeItemsCount > 0
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {activeItemsCount}/{totalItemsCount}
                  </Badge>
                </div>
              </div>

              {isExpanded && (
                <div className="divide-y divide-dashed divide-border/70 bg-muted/10">
                  {cat.items.map((perm) => (
                    <div
                      key={perm.code}
                      className="px-6 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                    >
                      <div className="md:col-span-4 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-foreground">{perm.label}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({perm.code})
                        </span>
                      </div>

                      <div className="md:col-span-7 text-xs text-muted-foreground">
                        {perm.description}
                      </div>

                      <div className="md:col-span-1 flex md:justify-end">
                        {perm.enabled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20 font-mono">
                            <Check className="size-3" />
                            {trKey(t, "users.cf_perm_granted", "Granted")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border bg-muted/40 text-muted-foreground border-border font-mono">
                            {trKey(t, "users.cf_perm_not_granted", "Not Granted")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
