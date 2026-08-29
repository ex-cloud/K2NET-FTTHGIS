"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ActionTooltip,
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
  UserPlus,
  ShieldCheck,
  Mail,
  KeyRound,
  Copy,
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../types";

interface OrgTeamAccessTabProps {
  organization: EnrichedOrganization;
}

interface TenantUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "TENANT_ADMIN" | "NOC_OPERATOR" | "FIELD_TECH" | "VIEWER";
  mfaEnabled: boolean;
  status: "ACTIVE" | "PENDING";
  lastLogin: string;
}

export function OrgTeamAccessTab({ organization: org }: OrgTeamAccessTabProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("NOC_OPERATOR");

  // Mock list of tenant users in isolated Keycloak Realm
  const [users, setUsers] = useState<TenantUser[]>([
    {
      id: "u-1",
      name: org.picName || "Andiansyah",
      username: "admin_" + org.slug,
      email: org.picEmail || `admin@${org.slug}.kdua.net`,
      role: "TENANT_ADMIN",
      mfaEnabled: true,
      status: "ACTIVE",
      lastLogin: "Today at 11:42 WIB",
    },
    {
      id: "u-2",
      name: "Budi Santoso",
      username: "noc_budi",
      email: `noc@${org.slug}.kdua.net`,
      role: "NOC_OPERATOR",
      mfaEnabled: true,
      status: "ACTIVE",
      lastLogin: "Yesterday at 17:15 WIB",
    },
    {
      id: "u-3",
      name: "Rian Hidayat",
      username: "tech_rian",
      email: `rian@${org.slug}.kdua.net`,
      role: "FIELD_TECH",
      mfaEnabled: false,
      status: "ACTIVE",
      lastLogin: "24 Aug 2026",
    },
  ]);

  const handleSendInvite = () => {
    if (!inviteName || !inviteEmail) {
      toast.error("Please fill in all fields");
      return;
    }
    const newUser: TenantUser = {
      id: `u-${Date.now()}`,
      name: inviteName,
      username: inviteName.toLowerCase().replace(/\s+/g, "_"),
      email: inviteEmail,
      role: inviteRole as TenantUser["role"],
      mfaEnabled: false,
      status: "PENDING",
      lastLogin: "Never (Invitation sent)",
    };
    setUsers((prev) => [...prev, newUser]);
    setInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
    toast.success(`Invitation sent to ${inviteEmail}`, {
      description: "User will receive a Keycloak account setup email.",
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePasswordReset = (user: TenantUser) => {
    toast.success(`Password reset link generated for ${user.name}`, {
      description: `Sent to ${user.email} via Keycloak SMTP service.`,
    });
  };

  const handleResendInvite = (user: TenantUser) => {
    toast.success(`Invitation email resent to ${user.email}`);
  };

  const handleChangeRole = (userId: string, newRole: TenantUser["role"]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    toast.success(`User role updated to ${newRole}`);
  };

  const handleRemoveUser = (userId: string, userName: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success(`User ${userName} removed from ${org.name}`);
  };

  const getRoleBadge = (role: TenantUser["role"]) => {
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
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Invite Action */}
      <div className="p-3.5 rounded-xl border border-border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground">Tenant Team & Access Control</h3>
            <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">
              Realm: {org.slug}-realm
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Pengaturan akun staf, teknisi lapangan, dan hak akses RBAC Keycloak terisolasi.
          </p>
        </div>

        <ActionTooltip label="Invite Staff Member to Keycloak Realm" shortcut="I">
          <Button
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite Team Member</span>
          </Button>
        </ActionTooltip>
      </div>

      {/* 2. Team Members Table */}
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
              {users.map((u) => (
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
                        <Badge variant="outline" className={u.status === "ACTIVE" ? "border-primary/30 bg-primary/10 text-primary font-mono text-[10px]" : "border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px]"}>
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
                      onClick={() => handlePasswordReset(u)}
                      className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      <span>Send Password Reset Link</span>
                      <ContextMenuShortcut>R</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => handleResendInvite(u)}
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
                        <ContextMenuItem onClick={() => handleChangeRole(u.id, "TENANT_ADMIN")} className="cursor-pointer">
                          <span>Tenant Admin</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleChangeRole(u.id, "NOC_OPERATOR")} className="cursor-pointer">
                          <span>NOC Operator</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleChangeRole(u.id, "FIELD_TECH")} className="cursor-pointer">
                          <span>Field Tech</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleChangeRole(u.id, "VIEWER")} className="cursor-pointer">
                          <span>Viewer</span>
                        </ContextMenuItem>
                      </ContextMenuSubContent>
                    </ContextMenuSub>

                    <ContextMenuSeparator className="bg-border/40 my-1" />

                    <ContextMenuItem
                      onClick={() => handleCopy(u.email, "Email address")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Email ({u.email})</span>
                      <ContextMenuShortcut>C</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => handleRemoveUser(u.id, u.name)}
                      className="cursor-pointer gap-2 focus:bg-muted text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Member</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 3. Invite Member Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[420px] p-0 overflow-hidden shadow-2xl text-foreground">
          <DialogHeader className="p-6 pb-2 text-foreground">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <span>Invite Staff to {org.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Full Name</Label>
              <Input
                placeholder="e.g. Ahmad Fauzi"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="bg-card border-border text-foreground h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Work Email</Label>
              <Input
                type="email"
                placeholder="e.g. fauzi@isp.net"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-card border-border text-foreground h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Role & Access Permission</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground text-xs">
                  <SelectItem value="TENANT_ADMIN">Tenant Admin (Full Management)</SelectItem>
                  <SelectItem value="NOC_OPERATOR">NOC Operator (GIS & OLT Poller)</SelectItem>
                  <SelectItem value="FIELD_TECH">Field Technician (ONT Provisioning)</SelectItem>
                  <SelectItem value="VIEWER">Read-only Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendInvite} className="text-xs font-semibold bg-primary text-primary-foreground">
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
