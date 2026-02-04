"use client";

import {
  Filter,
  Download,
  Edit,
  Key,
  ChevronLeft,
  ChevronRight,
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

interface UserTableProps {
  data: PaginatedResponse<User> | null;
  currentPage: number;
}

export function UserTable({ data, currentPage }: UserTableProps) {
  const users = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  return (
    <>
      <div className="flex-1 flex flex-col bg-background/60 backdrop-blur rounded-2xl border border-border/40 overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            User Registry
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/40 sticky top-0">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="w-[300px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  User
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Created At
                </TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                    className="border-border/40 hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-lg border border-border/40">
                          <AvatarImage
                            src={user.avatarUrl}
                            alt={user.fullName}
                          />
                          <AvatarFallback className="rounded-lg">
                            {user.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                        ></span>
                        <span className="text-xs text-muted-foreground">
                          {user.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-mono text-muted-foreground uppercase">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Key className="w-4 h-4" />
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
        <div className="mt-auto px-6 py-4 border-t border-border/40 flex items-center justify-between bg-muted/20">
          <span className="text-xs text-muted-foreground font-mono tracking-tight">
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

      <UpdateUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
      />
    </>
  );
}
