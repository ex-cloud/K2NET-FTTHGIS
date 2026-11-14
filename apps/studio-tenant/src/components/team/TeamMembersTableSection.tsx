import * as React from "react";
import {
  Search,
  Mail,
  MoreVertical,
  Loader2,
  Users,
  Phone,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import {
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
import { useTranslation } from "@k2net/i18n";

export interface UserProjectRole {
  projectId: string;
  projectName: string;
  roleName: string;
  roleDisplayName: string;
}

export interface UserDto {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED" | string;
  roleName?: string;
  roleDisplayName?: string;
  organizationName?: string;
  organizationSlug?: string;
  createdAt?: string;
  timezone?: string;
  projectRoles?: UserProjectRole[];
  permissions?: string[];
}

interface TeamMembersTableSectionProps {
  isLoading: boolean;
  filteredMembers: UserDto[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  canManageMembers: boolean;
  onEditMember: (member: UserDto) => void;
  onCopyEmail: (email: string) => void;
  onRemoveMember: (member: UserDto) => void;
}

export function TeamMembersTableSection({
  isLoading,
  filteredMembers,
  searchQuery,
  onSearchQueryChange,
  canManageMembers,
  onEditMember,
  onCopyEmail,
  onRemoveMember,
}: TeamMembersTableSectionProps) {
  const { t, formatDate } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("users.filter_placeholder")}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="h-7.5 pl-8 text-xs bg-muted/20 border-border/80"
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground">{member.fullName || member.username}</span>
                        {member.jobTitle && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-normal bg-muted/40 text-muted-foreground border-border/80"
                          >
                            {member.jobTitle}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        {member.phone && member.phone !== "—" && (
                          <a
                            href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </a>
                        )}
                      </div>
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
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-muted-foreground">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        {canManageMembers && (
                          <DropdownMenuItem onClick={() => onEditMember(member)} className="gap-2 cursor-pointer">
                            <Pencil className="size-3" />
                            {t("users.ctx_edit_profile")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onCopyEmail(member.email)} className="gap-2 cursor-pointer">
                          <Copy className="size-3" />
                          {t("users.ctx_copy_email")}
                        </DropdownMenuItem>
                        {canManageMembers && (
                          <DropdownMenuItem
                            onClick={() => onRemoveMember(member)}
                            className="text-destructive gap-2 cursor-pointer"
                          >
                            <Trash2 className="size-3" />
                            {t("users.ctx_remove_member")}
                          </DropdownMenuItem>
                        )}
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
              {searchQuery ? t("users.no_users_found") : t("users.invite_tooltip")}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
