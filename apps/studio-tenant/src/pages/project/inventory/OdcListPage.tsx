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
  EmptyState,
} from "@k2net/ui";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { AssetDialog } from "../../../components/inventory/AssetDialogs";
import { useTranslation } from "@k2net/i18n";

interface OdcItem {
  id: string;
  code: string;
  name: string;
  oltName?: string;
  capacity?: number;
  usedCapacity?: number;
  connectedOdpCount?: number;
  status?: string;
  lat?: number;
  lng?: number;
  projectId?: string;
}

export function OdcListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "";
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: odcData, isLoading } = useQuery<{ content: OdcItem[] } | OdcItem[]>({
    queryKey: ["project-odcs", projectId, searchQuery],
    queryFn: async () => {
      try {
        const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        return await apiClient<{ content: OdcItem[] } | OdcItem[]>(
          `/api/v1/network/odcs?size=50${queryParam}`
        );
      } catch (err) {
        console.warn("Failed to fetch ODCs:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const odcList: OdcItem[] = React.useMemo(() => {
    if (!odcData) return [];
    if (Array.isArray(odcData)) return odcData;
    if (Array.isArray(odcData.content)) return odcData.content;
    return [];
  }, [odcData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.odc_title")}
        subtitle={t("inventory.odc_subtitle")}
        icon={Layers}
        actions={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("inventory.add_odc")}
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

      {isLoading ? (
        <Card className="border-border/60 p-8 flex items-center justify-center text-muted-foreground shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          <span className="text-xs">{t("common.loading", { defaultValue: "Loading..." })}</span>
        </Card>
      ) : odcList.length > 0 ? (
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("inventory.odc_code").toUpperCase()} & {t("common.details").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.connected_olt").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.odc_capacity").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.connected_odps").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {odcList.map((odc) => {
                const totalCap = odc.capacity || 144;
                const usedCap = odc.usedCapacity || 0;
                const percent = Math.min(100, Math.round((usedCap / totalCap) * 100));

                return (
                  <TableRow key={odc.id} className="text-xs">
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-bold font-mono text-primary block">{odc.code}</span>
                        <span className="text-muted-foreground text-[11px]">{odc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-foreground font-medium">
                      {odc.oltName || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-foreground">
                          {usedCap} / {totalCap} Core
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          ({percent}% {t("inventory.used_percent", { percent: "" }).trim()})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {odc.connectedOdpCount ?? 0} ODP FAT
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {odc.status || "ACTIVE"}
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
                          <DropdownMenuItem>{t("inventory.view_on_map")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("inventory.manage_ports")}</DropdownMenuItem>
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
        </Card>
      ) : (
        <EmptyState
          icon={<Layers className="h-6 w-6 text-muted-foreground" />}
          title={t("common.no_results")}
          description={
            searchQuery
              ? t("common.no_results")
              : t("inventory.odc_subtitle")
          }
          action={
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("inventory.add_odc")}
            </Button>
          }
        />
      )}

      <AssetDialog
        type="ODC"
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </PageLayout>
  );
}
