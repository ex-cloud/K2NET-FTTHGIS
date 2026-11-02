import {
  Badge,
  Button,
  ActionTooltip,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@k2net/ui";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  History,
  Mail,
  KeyRound,
  Copy,
  Trash2,
  UserCheck,
  Loader2,
  Phone,
  Edit,
} from "lucide-react";
import type { TenantUser, TenantUserRole } from "./types";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";

interface TeamMembersTableProps {
  users: TenantUser[];
  isLoading: boolean;
  mfaEnforced?: boolean;
  onEditMember?: (user: TenantUser) => void;
  onPasswordReset: (user: TenantUser) => void;
  onToggleStatus?: (user: TenantUser) => void;
  onViewAudit?: (user: TenantUser) => void;
  onResendInvite: (user: TenantUser) => void;
  onChangeRole: (userId: string, newRole: TenantUserRole) => void;
  onCopy: (text: string, label: string) => void;
  onRemoveUser: (userId: string, userName: string) => void;
}

function getRoleBadge(role: TenantUserRole | string) {
  const norm = (role || "").toUpperCase();
  if (norm.includes("ADMIN")) {
    return <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400 font-mono text-[10px]">Tenant Admin</Badge>;
  }
  if (norm.includes("NOC")) {
    return <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">NOC Operator</Badge>;
  }
  if (norm.includes("TECH")) {
    return <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-[10px]">Field Tech</Badge>;
  }
  if (norm.includes("SUPERVIS")) {
    return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-[10px]">Supervisor</Badge>;
  }
  if (norm.includes("SURVEY")) {
    return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">Surveyor</Badge>;
  }
  if (norm.includes("FINANCE") || norm.includes("BILLING")) {
    return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">Finance</Badge>;
  }
  if (norm.includes("WAREHOUSE")) {
    return <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-400 font-mono text-[10px]">Warehouse</Badge>;
  }
  if (norm.includes("HELP")) {
    return <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-[10px]">Helpdesk</Badge>;
  }
  return <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px]">Viewer</Badge>;
}

export function TeamMembersTable({
  users,
  isLoading,
  mfaEnforced,
  onEditMember,
  onPasswordReset,
  onToggleStatus,
  onViewAudit,
  onResendInvite,
  onChangeRole,
  onCopy,
  onRemoveUser,
}: TeamMembersTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
      <div className="py-3 px-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
          {t("organizations.active_accounts")} ({users.length})
        </span>
        <span className="text-[11px] font-mono text-muted-foreground">
          {t("organizations.mfa_enforced_status")}:{" "}
          <span className={mfaEnforced ? "text-primary font-semibold" : "text-muted-foreground font-medium"}>
            {mfaEnforced ? t("organizations.mfa_policy_active") : t("organizations.mfa_policy_optional")}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6">
                {t("organizations.col_user_name")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("organizations.col_role")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("organizations.col_email")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("organizations.col_mfa")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("organizations.col_status")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("organizations.col_last_login")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right pr-6">
                {t("organizations.col_actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>{t("organizations.loading_team_members")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-6 w-6 text-muted-foreground/40" />
                    <span>{t("organizations.team_empty_members")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <ContextMenu key={u.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                      <TableCell className="pl-6 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground">{u.name}</span>
                            {u.jobTitle && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-primary/25 bg-primary/5 text-primary font-normal">
                                {u.jobTitle}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground block">@{u.username}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        {getRoleBadge(u.role)}
                      </TableCell>

                      <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                        <span className="text-foreground/90 block">{u.email}</span>
                        {u.phone && u.phone !== "—" && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                            <Phone className="size-2.5 text-primary shrink-0" />
                            <a
                              href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-primary hover:underline transition-colors font-mono"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {u.phone}
                            </a>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5">
                        {u.mfaEnabled ? (
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Enabled</span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-mono">Disabled</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className={
                            u.status === "ACTIVE"
                              ? "border-primary/30 bg-primary/10 text-primary font-mono text-[10px]"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px]"
                          }
                        >
                          {u.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                        <div>
                          <span>{u.lastLogin}</span>
                          {u.lastLoginIp && (
                            <span className="text-[9px] text-muted-foreground/70 block mt-0.5 font-mono">
                              IP: {u.lastLoginIp}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1">
                          <ActionTooltip label={t("organizations.action_edit_role")}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground h-6 w-6"
                              onClick={() => (onEditMember ? onEditMember(u) : onChangeRole(u.id, "TENANT_ADMIN"))}
                            >
                              <Edit className="size-3" />
                            </Button>
                          </ActionTooltip>

                          <ActionTooltip label={t("organizations.action_reset_password")}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground h-6 w-6"
                              onClick={() => onPasswordReset(u)}
                            >
                              <KeyRound className="size-3" />
                            </Button>
                          </ActionTooltip>

                          <ActionTooltip
                            label={
                              u.status === "ACTIVE"
                                ? t("organizations.action_suspend_account")
                                : t("organizations.action_activate_account")
                            }
                          >
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className={cn(
                                "h-6 w-6 text-muted-foreground",
                                u.status === "ACTIVE"
                                  ? "hover:text-amber-400 hover:bg-amber-500/10"
                                  : "hover:text-primary hover:bg-primary/10"
                              )}
                              onClick={() => onToggleStatus?.(u)}
                            >
                              <ShieldAlert className="size-3" />
                            </Button>
                          </ActionTooltip>

                          <ActionTooltip label={t("organizations.action_view_audit")}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground hover:bg-muted/40 h-6 w-6"
                              onClick={() =>
                                onViewAudit
                                  ? onViewAudit(u)
                                  : window.location.assign(`/security/audit?user=${encodeURIComponent(u.email)}`)
                              }
                            >
                              <History className="size-3" />
                            </Button>
                          </ActionTooltip>

                          <ActionTooltip label={t("organizations.action_copy_contact")}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground h-6 w-6"
                              onClick={() => onCopy(u.email, "Email")}
                            >
                              <Copy className="size-3" />
                            </Button>
                          </ActionTooltip>

                          <ActionTooltip label={t("organizations.action_remove_member")}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6"
                              onClick={() => onRemoveUser(u.id, u.name)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-lg text-xs z-[9999] py-1.5 rounded-xl">
                    <ContextMenuItem
                      onClick={() => onPasswordReset(u)}
                      className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      <span>Send Password Reset Link</span>
                      <ContextMenuShortcut>R</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => onResendInvite(u)}
                      className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Resend Keycloak Invite</span>
                    </ContextMenuItem>

                    <ContextMenuSeparator className="bg-border/40 my-1" />

                    <ContextMenuSub>
                      <ContextMenuSubTrigger className="cursor-pointer gap-2 focus:bg-muted">
                        <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Change Role</span>
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl rounded-xl py-1">
                        <ContextMenuItem onClick={() => onChangeRole(u.id, "TENANT_ADMIN")} className="cursor-pointer">
                          <span>Tenant Admin</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onChangeRole(u.id, "NOC_OPERATOR")} className="cursor-pointer">
                          <span>NOC Operator</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onChangeRole(u.id, "FIELD_TECH")} className="cursor-pointer">
                          <span>Field Tech</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onChangeRole(u.id, "VIEWER")} className="cursor-pointer">
                          <span>Viewer</span>
                        </ContextMenuItem>
                      </ContextMenuSubContent>
                    </ContextMenuSub>

                    <ContextMenuSeparator className="bg-border/40 my-1" />

                    <ContextMenuItem
                      onClick={() => onCopy(u.email, "Email address")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Email ({u.email})</span>
                      <ContextMenuShortcut>C</ContextMenuShortcut>
                    </ContextMenuItem>

                    {u.phone && u.phone !== "—" && (
                      <ContextMenuItem
                        onClick={() => onCopy(u.phone!, "Phone / WhatsApp number")}
                        className="cursor-pointer gap-2 focus:bg-muted"
                      >
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span>Copy Phone ({u.phone})</span>
                      </ContextMenuItem>
                    )}

                    <ContextMenuItem
                      onClick={() => onRemoveUser(u.id, u.name)}
                      className="cursor-pointer gap-2 focus:bg-muted text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Member</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
