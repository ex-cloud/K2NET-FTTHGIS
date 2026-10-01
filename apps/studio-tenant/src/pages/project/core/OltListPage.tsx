import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  MoreVertical,
  Server,
  Loader2,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Input,
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
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { useTranslation } from "@k2net/i18n";

interface OltItem {
  id: string;
  code: string;
  name: string;
  brand?: string;
  model?: string;
  ipAddress?: string;
  ponPortsTotal?: number;
  ponPortsUsed?: number;
  status?: string;
  healthStatus?: string;
  projectId?: string;
  lat?: number;
  lng?: number;
}

export function OltListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: oltData, isLoading } = useQuery<{ content: OltItem[] } | OltItem[]>({
    queryKey: ["project-olts", projectId, searchQuery],
    queryFn: async () => {
      try {
        const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        return await apiClient<{ content: OltItem[] } | OltItem[]>(
          `/api/v1/network/olts?size=50${queryParam}`
        );
      } catch (err) {
        console.warn("Failed to fetch OLTs:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const olts: OltItem[] = React.useMemo(() => {
    if (!oltData) return [];
    if (Array.isArray(oltData)) return oltData;
    if (Array.isArray(oltData.content)) return oltData.content;
    return [];
  }, [oltData]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: "Core Devices", href: `/project/${projectId}/core/olt` },
          { label: t("inventory.olt_title") },
        ]}
        title={t("inventory.olt_title")}
        actions={
          <Button size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            {t("inventory.add_olt")}
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/20"
            />
          </div>
        </div>

        <Card className="border-border/60 overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : olts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-[11px]">
                  <TableHead className="font-bold">{t("inventory.olt_name").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.vendor").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.ip_address").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.pon_ports").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {olts.map((olt) => (
                  <TableRow key={olt.id} className="text-xs">
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-bold font-mono text-primary block">{olt.code}</span>
                        <span className="text-muted-foreground text-[11px]">{olt.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {olt.brand ? `${olt.brand} ${olt.model || ""}` : "GPON OLT"}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{olt.ipAddress || "-"}</TableCell>
                    <TableCell className="font-mono font-semibold">
                      {olt.ponPortsUsed || 0} / {olt.ponPortsTotal || 16} Ports
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          olt.status === "ACTIVE" || olt.status === "ONLINE" || olt.status === "UP"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {olt.status || "ACTIVE"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem>{t("common.edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">{t("common.delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center space-y-2">
              <Server className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">{t("common.no_data")}</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {t("inventory.olt_subtitle")}
              </p>
            </div>
          )}
        </Card>
      </PageContentShell>
    </div>
  );
}

