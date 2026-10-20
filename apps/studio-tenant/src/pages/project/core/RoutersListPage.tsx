import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { Plus, Router, Loader2 } from "lucide-react";
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
import { useTranslation } from "@k2net/i18n";

interface RouterItem {
  id: string;
  name: string;
  ip?: string;
  role?: string;
  cpuUsage?: string;
  uptime?: string;
  status?: string;
}

export function RoutersListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "";

  const { data: routerData, isLoading } = useQuery<{ content: RouterItem[] } | RouterItem[]>({
    queryKey: ["project-routers", _projectId],
    queryFn: async () => {
      try {
        return await apiClient<{ content: RouterItem[] } | RouterItem[]>(
          "/api/v1/network/routers"
        );
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const routers: RouterItem[] = React.useMemo(() => {
    if (!routerData) return [];
    if (Array.isArray(routerData)) return routerData;
    if (Array.isArray(routerData.content)) return routerData.content;
    return [];
  }, [routerData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.routers_title")}
        subtitle={t("inventory.routers_subtitle")}
        icon={Router}
        actions={
          <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
            <Plus className="h-3.5 w-3.5" />
            {t("inventory.add_router")}
          </Button>
        }
      />

      {isLoading ? (
        <Card className="border-border/60 p-8 flex items-center justify-center text-muted-foreground shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          <span className="text-xs">{t("common.loading", { defaultValue: "Loading..." })}</span>
        </Card>
      ) : routers.length > 0 ? (
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("inventory.router_name").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.ip_address").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.interfaces").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.cpu_load").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.uptime", { defaultValue: "UPTIME" }).toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.map((r) => (
                <TableRow key={r.id} className="text-xs">
                  <TableCell className="font-bold text-foreground">{r.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{r.ip || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {r.role || "CORE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{r.cpuUsage || "—"}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{r.uptime || "—"}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {r.status || "ACTIVE"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={<Router className="h-6 w-6 text-muted-foreground" />}
          title={t("common.no_results")}
          description={t("inventory.routers_subtitle")}
          action={
            <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
              <Plus className="h-3.5 w-3.5" />
              {t("inventory.add_router")}
            </Button>
          }
        />
      )}
    </PageLayout>
  );
}
