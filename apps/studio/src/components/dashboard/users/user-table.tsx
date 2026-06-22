"use client";

import {
  Edit,
  Key,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserPlus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PaginatedResponse, User } from "@/types/user";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { UpdateUserDialog } from "./update-user-dialog";
import { UserSearch } from "./user-search";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { TeamInviteWizard } from "@/components/tenant/team/team-invite-wizard";

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

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        {/* Top Bar controls (Search & Actions) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full max-w-xs">
            <UserSearch placeholder="Filter users..." />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="h-9 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hidden sm:flex">
              Docs
            </Button>
            <Button 
              onClick={() => setIsInviteWizardOpen(true)}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#0c0c0c] rounded-md border border-zinc-800/60 overflow-hidden">
          {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-zinc-900/40 sticky top-0">
              <TableRow className="hover:bg-transparent border-zinc-800/60">
                <TableHead className="w-[300px] h-9 px-4 text-xs font-medium text-zinc-500">
                  User
                </TableHead>
                <TableHead className="h-9 px-4 text-xs font-medium text-zinc-500">
                  Role
                </TableHead>
                {isGlobalView && (
                  <TableHead className="h-9 px-4 text-xs font-medium text-zinc-500">
                    Organization
                  </TableHead>
                )}
                <TableHead className="h-9 px-4 text-xs font-medium text-zinc-500">
                  Status
                </TableHead>
                <TableHead className="h-9 px-4 text-xs font-medium text-zinc-500">
                  Created At
                </TableHead>
                <TableHead className="h-9 px-4 text-right text-xs font-medium text-zinc-500">
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
                  <TableRow
                    key={user.id}
                    className="border-zinc-800/60 hover:bg-zinc-800/30 transition-colors group h-12"
                  >
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 rounded-full border border-zinc-700">
                          <AvatarImage
                            src={user.avatarUrl}
                            alt={user.fullName || "User"}
                          />
                          <AvatarFallback className="rounded-full text-[10px]">
                            {(user.fullName || user.username || user.email || "U").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-zinc-200 leading-tight">
                            {user.fullName || user.username || user.email || "Unknown User"}
                          </span>
                          <span className="text-[11px] text-zinc-500 leading-tight">
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
                            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
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
                        <div className="text-[12px] text-zinc-400 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                          {user.organizationId ? (
                            <Link href={`/org/${user.organizationId}`} className="hover:text-emerald-400 hover:underline font-medium transition-colors">
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
                          className={`w-1.5 h-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`}
                        ></span>
                        <span className="text-[12px] text-zinc-400 capitalize">
                          {user.status.toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="text-[12px] text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
                          onClick={() => handleResetPassword(user)}
                        >
                          <Key className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-2 border-t border-zinc-800/60 flex items-center justify-between bg-[#080808]">
          <span className="text-[12px] text-zinc-500">
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
              className="h-8 bg-emerald-500/20 text-emerald-500 border border-emerald-500 hover:bg-emerald-500/30 font-bold text-xs"
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
