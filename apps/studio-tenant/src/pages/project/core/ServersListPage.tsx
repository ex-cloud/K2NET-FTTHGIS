import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { Server, Loader2 } from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
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
import { useTranslation } from "@k2net/i18n";

interface ServerItem {
  id: string;
  name: string;
  ip?: string;
  service?: string;
  health?: string;
  status?: string;
  cycleTime?: string;
}

export function ServersListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "";

  const { data: serverData, isLoading } = useQuery<{ content: ServerItem[] } | ServerItem[]>({
    queryKey: ["project-servers", _projectId],
    queryFn: async () => {
      try {
        return await apiClient<{ content: ServerItem[] } | ServerItem[]>(
          "/api/v1/network/servers"
        );
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const servers: ServerItem[] = React.useMemo(() => {
    if (!serverData) return [];
    if (Array.isArray(serverData)) return serverData;
    if (Array.isArray(serverData.content)) return serverData.content;
    return [];
  }, [serverData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.servers_title")}
        subtitle={t("inventory.servers_subtitle")}
        icon={Server}
      />

      {isLoading ? (
        <Card className="border-border/60 p-8 flex items-center justify-center text-muted-foreground shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          <span className="text-xs">{t("common.loading", { defaultValue: "Loading..." })}</span>
        </Card>
      ) : servers.length > 0 ? (
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("inventory.server_name").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.ip_address").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.description").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.cycle_time", { defaultValue: "CYCLE" }).toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.map((s) => (
                <TableRow key={s.id} className="text-xs">
                  <TableCell className="font-bold text-foreground">{s.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.ip || "—"}</TableCell>
                  <TableCell className="font-medium text-foreground">{s.service || "—"}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.cycleTime || "—"}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {s.health || s.status || "RUNNING"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={<Server className="h-6 w-6 text-muted-foreground" />}
          title={t("common.no_results")}
          description={t("inventory.servers_subtitle")}
        />
      )}
    </PageLayout>
  );
}
