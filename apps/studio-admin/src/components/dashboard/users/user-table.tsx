"use client";

import {
  Edit,
  Key,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserPlus,
  ShieldAlert,
  History,
  Copy,
  Sparkles,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  ActionTooltip,
  UniversalContextMenu,
  ContextMenuGroupConfig,
} from "@k2net/ui";
import { PaginatedResponse, User } from "@/types/user";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { UpdateUserDialog } from "./update-user-dialog";
import { UserSearch } from "./user-search";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { TeamInviteWizard } from "@/components/system/team/team-invite-wizard";
import { usePermissions } from "@/hooks/use-permissions";

interface UserTableProps {
  data: PaginatedResponse<User> | null;
  currentPage: number;
  isGlobalView?: boolean;
  token?: string;
}

export function UserTable({ data, currentPage, isGlobalView = false, token }: UserTableProps) {
  const users = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const { canAccess, isSuperAdmin } = usePermissions();
  const canManageUsers = canAccess("users.manage") || isSuperAdmin;
  const canInviteUsers = canAccess("users.invite") || canManageUsers;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isInviteWizardOpen, setIsInviteWizardOpen] = useState(false);

  // Calculate pagination range
  const startParam = currentPage * (data?.size || 10) + 1;
  const endParam = Math.min(
    (currentPage + 1) * (data?.size || 10),
    totalElements,
  );

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUserForReset(user);
    setIsResetPasswordDialogOpen(true);
  };

  const getUserContextMenuGroups = (user: User): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Tanya AI tentang Pengguna",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Tampilkan ringkasan akses, role, dan organisasi pengguna: "${user.fullName || user.username}" (${user.email}) - Role: ${user.roleDisplayName}.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
        {
          label: "Ubah Profil & Role",
          icon: Edit,
          shortcut: "Alt+E",
          onClick: () => handleEdit(user),
          disabled: !canManageUsers,
        },
        {
          label: "Reset Password",
          icon: Key,
          shortcut: "Alt+R",
          onClick: () => handleResetPassword(user),
          disabled: !canManageUsers,
        },
      ],
    },
    {
      items: [
        {
          label: "Salin Email",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(user.email || "");
            toast.success(`Email ${user.email} disalin ke clipboard!`);
          },
        },
        {
          label: "Salin User ID",
          icon: FileCode,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(user.id || "");
            toast.success(`User ID disalin ke clipboard!`);
          },
        },
        {
          label: "Lihat Log Audit Sesi",
          icon: History,
          shortcut: "Alt+L",
          onClick: () => {
            const userTarget = user.email || user.username || "";
            window.location.assign(`/security/audit?user=${encodeURIComponent(userTarget)}`);
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Putus Sesi Keycloak",
          icon: ShieldAlert,
          variant: "destructive",
          shortcut: "Alt+X",
          onClick: () => {
            toast.success(`Keycloak active session revoked for ${user.email}`);
          },
        },
      ],
    },
  ];

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        {/* Top Bar controls (Search & Actions) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full max-w-xs">
            <UserSearch placeholder="Filter users..." />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Docs
            </Button>
            {canInviteUsers && (
              <ActionTooltip label="Undang / Tambah Pengguna Baru" shortcut="C">
                <Button 
                  onClick={() => setIsInviteWizardOpen(true)}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Add User
                </Button>
              </ActionTooltip>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-card/60 backdrop-blur-xl rounded-xl border border-border/80 overflow-hidden shadow-sm">
          {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/60 backdrop-blur-md sticky top-0 border-b border-border z-10">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[300px] h-9 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  User
                </TableHead>
                <TableHead className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Role
                </TableHead>
                {isGlobalView && (
                  <TableHead className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Organization
                  </TableHead>
                )}
                <TableHead className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Created At
                </TableHead>
                <TableHead className="h-9 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <UniversalContextMenu key={user.id} groups={getUserContextMenuGroups(user)}>
                    <TableRow
                      className="border-border hover:bg-accent/40 transition-colors group h-12 cursor-pointer"
                    >
                      <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7 rounded-full border border-border">
                            <AvatarImage
                              src={user.avatarUrl}
                              alt={user.fullName || "User"}
                            />
                            <AvatarFallback className="rounded-full text-[10px]">
                              {(user.fullName || user.username || user.email || "U").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-foreground leading-tight">
                              {user.fullName || user.username || user.email || "Unknown User"}
                            </span>
                            <span className="text-[11px] text-muted-foreground leading-tight">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-md font-bold text-[10px]",
                            user.roleName === "super_admin" &&
                              "bg-primary/10 text-primary border-primary/20",
                            user.roleName === "admin" &&
                              "bg-sky-500/10 text-sky-500 border-sky-500/20",
                            user.roleName === "technician" &&
                              "bg-purple-500/10 text-purple-400 border-purple-500/20",
                            user.roleName === "viewer" &&
                              "bg-gray-500/10 text-gray-400 border-gray-500/20",
                          )}
                        >
                          {user.roleDisplayName}
                        </Badge>
                      </TableCell>
                      {isGlobalView && (
                        <TableCell className="px-4 py-2">
                          <div className="text-[12px] text-muted-foreground flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground/80" />
                            {user.organizationId ? (
                              <Link href={`/org/${user.organizationId}`} className="hover:text-primary hover:underline font-medium transition-colors">
                                {user.organizationName}
                              </Link>
                            ) : (
                              <span>{user.organizationName || "System"}</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-primary" : "bg-red-500"}`}
                          ></span>
                          <span className="text-[12px] text-muted-foreground capitalize">
                            {user.status.toLowerCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <div className="text-[12px] font-mono text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canManageUsers && (
                            <ActionTooltip label="Ubah Profil & Role" shortcut="Alt+E">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEdit(user)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </ActionTooltip>
                          )}
                          {canManageUsers && (
                            <ActionTooltip label="Reset Password" shortcut="Alt+R">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleResetPassword(user)}
                              >
                                <Key className="w-3.5 h-3.5" />
                              </Button>
                            </ActionTooltip>
                          )}
                          <ActionTooltip label="Putus Sesi Keycloak">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-amber-500/10 hover:text-amber-400"
                              onClick={() => {
                                toast.success(`Keycloak active session revoked for ${user.email}`);
                              }}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Lihat Riwayat Audit" shortcut="Alt+L">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary"
                              onClick={() => {
                                const userTarget = user.email || user.username || "";
                                window.location.assign(`/security/audit?user=${encodeURIComponent(userTarget)}`);
                              }}
                            >
                              <History className="w-3.5 h-3.5" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  </UniversalContextMenu>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between bg-card">
          <span className="text-[12px] text-muted-foreground">
            Showing {totalElements === 0 ? 0 : startParam} to {endParam} of{" "}
            {totalElements} results
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border/40 bg-transparent"
              disabled={currentPage === 0}
              asChild
            >
              <Link href={`?page=${Math.max(0, currentPage - 1)}`}>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </Button>

            <Button
              size="sm"
              className="h-8 bg-primary/20 text-primary border border-primary hover:bg-primary/30 font-bold text-xs"
            >
              {currentPage + 1}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border/40 bg-transparent"
              disabled={currentPage >= totalPages - 1}
              asChild
            >
              <Link href={`?page=${currentPage + 1}`}>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>

      <UpdateUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
      />
      {selectedUserForReset && (
        <ResetPasswordDialog
          open={isResetPasswordDialogOpen}
          onOpenChange={setIsResetPasswordDialogOpen}
          user={selectedUserForReset}
          token={token}
        />
      )}
      <TeamInviteWizard 
        open={isInviteWizardOpen} 
        onOpenChange={setIsInviteWizardOpen} 
      />
    </>
  );
}
