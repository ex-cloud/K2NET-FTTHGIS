import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  MoreVertical,
  Layers,
  Loader2,
} from "lucide-react";
import {
  PageLayout,
  PageHero,
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
import { AssetDialog } from "../../../components/inventory/AssetDialogs";
import { useTranslation } from "@k2net/i18n";

interface OdpItem {
  id: string;
  code: string;
  name: string;
  odcCode?: string;
  totalPorts?: number;
  usedPorts?: number;
  splitterRatio?: string;
  status?: string;
  healthStatus?: string;
  lat?: number;
  lng?: number;
  projectId?: string;
}

export function OdpListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: odpData, isLoading } = useQuery<{ content: OdpItem[] } | OdpItem[]>({
    queryKey: ["project-odps", projectId, searchQuery],
    queryFn: async () => {
      try {
        const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        return await apiClient<{ content: OdpItem[] } | OdpItem[]>(
          `/api/v1/network/odps?size=50${queryParam}`
        );
      } catch (err) {
        console.warn("Failed to fetch ODPs:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const odpList: OdpItem[] = React.useMemo(() => {
    if (!odpData) return [];
    if (Array.isArray(odpData)) return odpData;
    if (Array.isArray(odpData.content)) return odpData.content;
    return [];
  }, [odpData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.odp_title")}
        subtitle={t("inventory.odp_subtitle")}
        icon={Layers}
        actions={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("inventory.add_odp")}
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7.5 pl-8 text-xs bg-muted/20 border-border/80"
          />
        </div>
      </div>

        <Card className="border-border/60 overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : odpList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-[11px]">
                  <TableHead className="font-bold">{t("inventory.odp_code").toUpperCase()} & NAMA</TableHead>
                  <TableHead className="font-bold">{t("inventory.parent_odc").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.port_capacity").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.splitter_ratio").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {odpList.map((odp) => {
                  const total = odp.totalPorts || 16;
                  const used = odp.usedPorts || 0;
                  const percent = Math.round((used / total) * 100);

                  return (
                    <TableRow key={odp.id} className="text-xs">
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-bold font-mono text-primary block">{odp.code}</span>
                          <span className="text-muted-foreground text-[11px]">{odp.name || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-foreground">
                        {odp.odcCode || "ODC-MAIN"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-foreground">
                            {used} / {total} Port
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            ({percent}% {t("inventory.used_percent", { percent: "" }).trim()})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {odp.splitterRatio || "1:16"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            odp.status === "ACTIVE"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {odp.status || "ACTIVE"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem>{t("inventory.add_customer_title")}</DropdownMenuItem>
                            <DropdownMenuItem>{t("inventory.view_on_map")}</DropdownMenuItem>
                            <DropdownMenuItem>{t("common.edit")}</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">{t("common.delete")}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center space-y-2">
              <Layers className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">{t("common.no_results")}</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? t("common.no_results")
                  : t("inventory.odp_subtitle")}
              </p>
            </div>
          )}
        </Card>

      <AssetDialog
        type="ODP"
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </PageLayout>
  );
}
