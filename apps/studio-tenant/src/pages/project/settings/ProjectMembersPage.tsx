import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  UserPlus,
  Trash2,
  Users,
  Loader2,
} from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  EmptyState,
} from "@k2net/ui";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { useTenantInfo } from "../../../hooks/useTenantInfo";
import { useTranslation } from "@k2net/i18n";

interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role?: string;
  status?: string;
}

export function ProjectMembersPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "";
  const { slug } = useTenantInfo();

  const { data: usersData, isLoading } = useQuery<{ content: UserDto[] } | UserDto[]>({
    queryKey: ["project-members", slug],
    queryFn: async () => {
      try {
        const queryParam = slug ? `?org=${encodeURIComponent(slug)}` : "";
        return await apiClient<{ content: UserDto[] } | UserDto[]>(`/api/v1/users${queryParam}`);
      } catch (err) {
        console.warn("Failed to fetch project members:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const members: UserDto[] = React.useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData;
    if (Array.isArray(usersData.content)) return usersData.content;
    return [];
  }, [usersData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6" maxWidth="max-w-4xl">
      <PageHero
        title={t("projects.members_title")}
        subtitle={t("projects.members_subtitle")}
        icon={Users}
        actions={
          <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
            <UserPlus className="h-3.5 w-3.5" />
            {t("projects.add_member_btn")}
          </Button>
        }
      />

      {isLoading ? (
        <Card className="border-border/60 p-8 flex items-center justify-center text-muted-foreground shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          <span className="text-xs">{t("common.loading", { defaultValue: "Loading..." })}</span>
        </Card>
      ) : members.length > 0 ? (
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("team.member_name", { defaultValue: "STAFF NAME" }).toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("projects.member_role").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("team.access_level", { defaultValue: "PROJECT ACCESS" }).toUpperCase()}</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">{m.fullName || m.username}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{m.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{m.role || "MEMBER"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                      {m.status || "ACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={<Users className="h-6 w-6 text-muted-foreground" />}
          title={t("common.no_results")}
          description={t("projects.members_subtitle")}
          action={
            <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
              <UserPlus className="h-3.5 w-3.5" />
              {t("projects.add_member_btn")}
            </Button>
          }
        />
      )}
    </PageLayout>
  );
}
