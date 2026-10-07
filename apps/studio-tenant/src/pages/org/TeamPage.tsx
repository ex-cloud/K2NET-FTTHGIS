import * as React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Mail,
  Shield,
  MoreVertical,
  Loader2,
  Users,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Button,
  Input,
  Card,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { TeamInviteWizard } from "../../components/team/TeamInviteWizard";
import { TenantAuditExplorer } from "../../components/audit";
import { TenantFeatureUpgradeModal } from "../../components/system/TenantFeatureUpgradeModal";
import { useTranslation } from "@k2net/i18n";

interface UserProjectRole {
  projectId: string;
  projectName: string;
  roleName: string;
  roleDisplayName: string;
}

interface UserDto {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED" | string;
  roleName?: string;
  roleDisplayName?: string;
  organizationName?: string;
  organizationSlug?: string;
  createdAt?: string;
  projectRoles?: UserProjectRole[];
  permissions?: string[];
}

export function TeamPage() {
  const { t, formatDate } = useTranslation();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const pathname = routerState.location.pathname;
  const orgSlug = getCurrentOrgSlug() || "system";
  const { tier } = useTenantSubscription();

  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
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
    return members.filter((m) => {
      const nameMatch = (m.fullName || m.username || "").toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = (m.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || emailMatch;
    });
  }, [members, searchQuery]);

  const maxMembers = tier === "free" ? 1 : tier === "pro" ? 10 : 100;
  const canInviteMember = members.length < maxMembers;

  const handleOpenInvite = () => {
    if (!canInviteMember) {
      setUpgradeModalOpen(true);
      return;
    }
    setInviteModalOpen(true);
  };

  const rolesList = [
    {
      title: "Organization Admin",
      description: "Akses penuh ke seluruh proyek, konfigurasi organisasi, billing, dan manajemen tim.",
      permissions: ["projects.*", "network.*", "team.*", "billing.*", "settings.*"],
    },
    {
      title: "NOC & GIS Operator",
      description: "Mengelola topologi jaringan, monitoring kesehatan OLT, dan operasional inventaris.",
      permissions: ["projects.view", "network.manage", "gis.edit", "issues.manage"],
    },
    {
      title: "Field Technician (JIT Scoped)",
      description: "Akses ke tiket gangguan dan pemetaan ODP pada area proyek yang ditugaskan.",
      permissions: ["projects.view", "network.view", "issues.execute", "geom.update"],
    },
    {
      title: "Surveyor GIS",
      description: "Menggambar jalur kabel baru, validasi survey lapangan, dan import KML/CAD.",
      permissions: ["gis.survey", "cad.import", "projects.view"],
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={
          subView === "roles"
            ? t("security.roles_matrix")
            : subView === "activity"
            ? t("security.audit_trail_title")
            : t("users.title")
        }
        breadcrumbs={[
          { label: t("nav.organizations"), href: "/projects" },
          { label: t("nav.team_members"), href: "/team/members" },
          {
            label:
              subView === "roles"
                ? t("security.roles_matrix")
                : subView === "activity"
                ? t("security.audit_trail_title")
                : t("users.title"),
          },
        ]}
        actions={
          subView === "members" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                {t("users.active_now")}: <strong>{members.length}/{maxMembers}</strong>
              </span>
              <Button
                size="sm"
                onClick={handleOpenInvite}
                className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                {t("users.add_user_button")}
              </Button>
            </div>
          )
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        {/* VIEW 1: MEMBERS */}
        {subView === "members" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={t("users.filter_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-muted/20"
                />
              </div>
            </div>

            <Card className="border-border/60 overflow-hidden shadow-xs">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px]">
                      <TableHead className="font-bold">{t("users.col_user").toUpperCase()}</TableHead>
                      <TableHead className="font-bold">{t("users.col_role").toUpperCase()}</TableHead>
                      <TableHead className="font-bold">{t("users.col_status").toUpperCase()}</TableHead>
                      <TableHead className="font-bold">{t("projects.overview_title").toUpperCase()}</TableHead>
                      <TableHead className="font-bold">{t("users.col_created_at").toUpperCase()}</TableHead>
                      <TableHead className="w-12 text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id} className="text-xs">
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground block">
                              {member.fullName || member.username}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                            {member.roleDisplayName || member.roleName || t("users.role_viewer")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              member.status === "ACTIVE"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {member.status === "ACTIVE" ? t("users.status_active") : member.status}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          {member.projectRoles && member.projectRoles.length > 0
                            ? `${member.projectRoles.length} ${t("nav.projects")}`
                            : t("common.all")}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-[11px]">
                          {member.createdAt ? formatDate(new Date(member.createdAt)) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem>{t("users.ctx_edit_profile")}</DropdownMenuItem>
                              <DropdownMenuItem>{t("users.ctx_copy_email")}</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">{t("users.ctx_revoke_session")}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">{t("users.no_users_found")}</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {searchQuery
                      ? t("users.no_users_found")
                      : t("users.invite_tooltip")}
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* VIEW 2: ROLES */}
        {subView === "roles" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rolesList.map((role, idx) => (
              <Card key={idx} className="p-4 border-border/60 bg-card space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{role.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                  {role.description}
                </p>
                <div className="pt-2 border-t border-border/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    {t("security.roles_matrix")}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-foreground border border-border/60"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* VIEW 3: ACTIVITY */}
        {subView === "activity" && (
          <TenantAuditExplorer
            scope="ORGANIZATION"
            initialCategory="IAM"
            title={t("security.audit_trail_title")}
            description={t("security.audit_trail_desc")}
          />
        )}
      </PageContentShell>

      <TeamInviteWizard
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />

      <TenantFeatureUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        featureName={t("users.total_users")}
        featureDescription={t("billing.upgrade_prompt")}
        onUpgradeClick={() => navigate({ to: "/billing" })}
      />
    </div>
  );
}
