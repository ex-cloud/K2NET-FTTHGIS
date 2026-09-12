import {
  Badge,
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
  Mail,
  KeyRound,
  Copy,
  Trash2,
  UserCheck,
  Loader2,
} from "lucide-react";
import type { TenantUser, TenantUserRole } from "./types";

interface TeamMembersTableProps {
  users: TenantUser[];
  isLoading: boolean;
  onPasswordReset: (user: TenantUser) => void;
  onResendInvite: (user: TenantUser) => void;
  onChangeRole: (userId: string, newRole: TenantUserRole) => void;
  onCopy: (text: string, label: string) => void;
  onRemoveUser: (userId: string, userName: string) => void;
}

function getRoleBadge(role: TenantUserRole) {
  switch (role) {
    case "TENANT_ADMIN":
      return <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono text-[10px]">Tenant Admin</Badge>;
    case "NOC_OPERATOR":
      return <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">NOC Operator</Badge>;
    case "FIELD_TECH":
      return <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-mono text-[10px]">Field Tech</Badge>;
    default:
      return <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px]">Viewer</Badge>;
  }
}

export function TeamMembersTable({
  users,
  isLoading,
  onPasswordReset,
  onResendInvite,
  onChangeRole,
  onCopy,
  onRemoveUser,
}: TeamMembersTableProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
      <div className="py-3 px-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
          Active Accounts ({users.length})
        </span>
        <span className="text-[11px] font-mono text-muted-foreground">
          MFA Enforced: Yes
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6">
                User Name
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Role
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                MFA / 2FA
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pr-6">
                Last Login
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Memuat daftar pengguna Keycloak &amp; Database...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-6 w-6 text-muted-foreground/40" />
                    <span>Belum ada akun pengguna tambahan di realm ini.</span>
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
                          <span className="font-semibold text-foreground block">{u.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">@{u.username}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        {getRoleBadge(u.role)}
                      </TableCell>

                      <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                        {u.email}
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

                      <TableCell className="py-3.5 pr-6 font-mono text-[11px] text-muted-foreground">
                        {u.lastLogin}
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
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
