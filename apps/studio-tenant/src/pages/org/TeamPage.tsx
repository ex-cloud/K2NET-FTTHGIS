import * as React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Plus, Shield, Users, Activity } from "lucide-react";
import { PageHero, PageLayout, Button } from "@k2net/ui";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { usePermissions } from "../../hooks/use-permissions";
import { TeamInviteWizard } from "../../components/team/TeamInviteWizard";
import { TeamMemberEditModal, type EditableMember } from "../../components/team/TeamMemberEditModal";
import { TenantRoleBuilderDialog, type EditableTenantRole } from "../../components/team/TenantRoleBuilderDialog";
import {
  TeamRolesGrid,
  TeamConfirmDialogs,
  type LiveRoleDto,
  type RoleCardItem,
} from "../../components/team/TeamRolesAndDialogs";
import {
  TeamMembersTableSection,
  type UserDto,
} from "../../components/team/TeamMembersTableSection";
import { TenantAuditExplorer } from "../../components/audit";
import { TenantFeatureUpgradeModal } from "../../components/system/TenantFeatureUpgradeModal";
import { useTranslation } from "@k2net/i18n";

export function TeamPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const pathname = routerState.location.pathname;
  const orgSlug = getCurrentOrgSlug() || "system";
  const { tier } = useTenantSubscription();
  const { canAccess } = usePermissions();

  const canInviteUsers = canAccess(["members.invite", "team.invite", "users.invite", "team.manage"]);
  const canManageMembers = canAccess(["members.manage", "team.manage", "users.manage"]);
  const canManageRoles = canAccess(["roles.manage", "roles.update", "team.manage"]);

  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<EditableMember | null>(null);
  const [removingMember, setRemovingMember] = React.useState<UserDto | null>(null);
  const [isRemovingMember, setIsRemovingMember] = React.useState(false);
  const [roleBuilderOpen, setRoleBuilderOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<EditableTenantRole | null>(null);
  const [deletingRole, setDeletingRole] = React.useState<EditableTenantRole | null>(null);
  const [isDeletingRole, setIsDeletingRole] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const subView = React.useMemo(() => {
    if (pathname.includes("/team/roles")) return "roles";
    if (pathname.includes("/team/activity")) return "activity";
    return "members";
  }, [pathname]);

  const { data: usersPage, isLoading } = useQuery<{ content: UserDto[] } | UserDto[]>({
    queryKey: ["tenant-team-members", orgSlug],
    queryFn: async () => {
      try {
        return await apiClient<{ content: UserDto[] } | UserDto[]>(`/api/v1/users?org=${encodeURIComponent(orgSlug)}`);
      } catch (err) {
        console.warn("Failed to fetch team members:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const members: UserDto[] = React.useMemo(() => {
    if (!usersPage) return [];
    if (Array.isArray(usersPage)) return usersPage;
    if (Array.isArray(usersPage.content)) return usersPage.content;
    return [];
  }, [usersPage]);

  const filteredMembers = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return members.filter((m) => {
      const nameMatch = (m.fullName || m.username || "").toLowerCase().includes(q);
      const emailMatch = (m.email || "").toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });
  }, [members, searchQuery]);

  const maxMembers = tier === "free" ? 1 : tier === "pro" ? 10 : 100;

  const handleOpenInvite = () => {
    if (members.length >= maxMembers) {
      setUpgradeModalOpen(true);
      return;
    }
    setInviteModalOpen(true);
  };

  const { data: liveTenantRoles, isLoading: isLoadingRoles } = useQuery<LiveRoleDto[]>({
    queryKey: ["tenant-roles-catalog", orgSlug],
    queryFn: async () => {
      try {
        return await apiClient<LiveRoleDto[]>("/api/v1/roles?scope=TENANT");
      } catch {
        return [];
      }
    },
    enabled: subView === "roles",
    staleTime: 60 * 1000,
  });

  const rolesList: RoleCardItem[] = React.useMemo(() => {
    if (!Array.isArray(liveTenantRoles)) return [];
    return liveTenantRoles.map((r) => ({
      raw: r,
      id: r.id,
      name: r.name,
      isSystemRole: r.isSystemRole ?? true,
      code: r.code || `TENT-${r.id}`,
      title: r.displayName || r.name.toUpperCase(),
      description: r.description || r.name,
      permissions: (r.permissions || []).map((p) => p.code),
    }));
  }, [liveTenantRoles]);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success(t("common.copied"));
    } catch {
      toast.info(email);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!removingMember) return;
    setIsRemovingMember(true);
    try {
      await apiClient(`/api/v1/organizations/${encodeURIComponent(orgSlug)}/members/${removingMember.id}`, {
        method: "DELETE",
      });
      toast.success(t("users.member_removed_success"));
      await queryClient.invalidateQueries({ queryKey: ["tenant-team-members"] });
      setRemovingMember(null);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t("common.error"));
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleConfirmDeleteRole = async () => {
    if (!deletingRole) return;
    setIsDeletingRole(true);
    try {
      await apiClient(`/api/v1/roles/${deletingRole.id}`, { method: "DELETE" });
      toast.success(t("security.role_deleted_success", { name: deletingRole.displayName || deletingRole.name }));
      await queryClient.invalidateQueries({ queryKey: ["tenant-roles-catalog"] });
      setDeletingRole(null);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t("security.failed_delete_role"));
    } finally {
      setIsDeletingRole(false);
    }
  };

  const heroTitle =
    subView === "roles"
      ? t("security.roles_matrix")
      : subView === "activity"
      ? t("security.audit_trail_title")
      : t("users.title");

  const heroSubtitle =
    subView === "roles"
      ? t("security.roles_matrix_subtitle")
      : subView === "activity"
      ? t("security.audit_trail_desc")
      : t("users.manage_team_subtitle");

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("nav.team_members")}
        title={heroTitle}
        icon={subView === "roles" ? Shield : subView === "activity" ? Activity : Users}
        subtitle={heroSubtitle}
        meta={
          subView === "members" ? (
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>{t("users.active_now")}:</span>
              <strong className="text-foreground">{members.length}/{maxMembers}</strong>
            </div>
          ) : undefined
        }
        actions={
          subView === "members" && canInviteUsers ? (
            <Button size="sm" onClick={handleOpenInvite} className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs">
              <Plus className="size-3.5" />
              {t("users.add_user_button")}
            </Button>
          ) : subView === "roles" && canManageRoles ? (
            <Button
              size="sm"
              onClick={() => {
                setEditingRole(null);
                setRoleBuilderOpen(true);
              }}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs"
            >
              <Plus className="size-3.5" />
              {t("security.new_role_btn")}
            </Button>
          ) : undefined
        }
      />

      <div className="w-full space-y-4">
        {subView === "members" && (
          <TeamMembersTableSection
            isLoading={isLoading}
            filteredMembers={filteredMembers}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            canManageMembers={canManageMembers}
            onEditMember={(member) => setEditingMember(member)}
            onCopyEmail={handleCopyEmail}
            onRemoveMember={(member) => setRemovingMember(member)}
          />
        )}

        {subView === "roles" && (
          <TeamRolesGrid
            isLoading={isLoadingRoles}
            rolesList={rolesList}
            canManageRoles={canManageRoles}
            onEditRole={(role) => {
              setEditingRole(role);
              setRoleBuilderOpen(true);
            }}
            onDeleteRole={(role) => setDeletingRole(role)}
          />
        )}

        {subView === "activity" && (
          <TenantAuditExplorer
            scope="ORGANIZATION"
            initialCategory="IAM"
            title={t("security.audit_trail_title")}
            description={t("security.audit_trail_desc")}
          />
        )}
      </div>

      <TeamInviteWizard
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tenant-team-members", orgSlug] });
        }}
      />

      <TeamMemberEditModal
        open={Boolean(editingMember)}
        onOpenChange={(open) => !open && setEditingMember(null)}
        member={editingMember}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tenant-team-members", orgSlug] });
        }}
      />

      <TenantRoleBuilderDialog
        open={roleBuilderOpen}
        onOpenChange={setRoleBuilderOpen}
        editingRole={editingRole}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tenant-roles-catalog", orgSlug] });
          queryClient.invalidateQueries({ queryKey: ["tenant-team-members", orgSlug] });
        }}
      />

      <TeamConfirmDialogs
        removingMember={removingMember}
        onCloseRemoveMember={() => setRemovingMember(null)}
        onConfirmRemoveMember={handleConfirmRemoveMember}
        isRemovingMember={isRemovingMember}
        deletingRole={deletingRole}
        onCloseDeleteRole={() => setDeletingRole(null)}
        onConfirmDeleteRole={handleConfirmDeleteRole}
        isDeletingRole={isDeletingRole}
      />

      <TenantFeatureUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        featureName={t("users.total_users")}
        featureDescription={t("billing.upgrade_prompt")}
        onUpgradeClick={() => navigate({ to: "/billing" })}
      />
    </PageLayout>
  );
}
