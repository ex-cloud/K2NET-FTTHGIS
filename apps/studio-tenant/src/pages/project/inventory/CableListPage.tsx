import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  MoreVertical,
  Network,
  Loader2,
} from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  Button,
  Input,
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
  EmptyState,
} from "@k2net/ui";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { AssetDialog } from "../../../components/inventory/AssetDialogs";
import { useTranslation } from "@k2net/i18n";

interface CableItem {
  id: string;
  code: string;
  type?: string;
  fiberCount?: number;
  coreCount?: number;
  usedCore?: number;
  lengthMeters?: number;
  startNode?: string;
  endNode?: string;
  status?: string;
  projectId?: string;
}

export function CableListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "";
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: cableData, isLoading } = useQuery<{ content: CableItem[] } | CableItem[]>({
    queryKey: ["project-cables", projectId, searchQuery],
    queryFn: async () => {
      try {
        const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        return await apiClient<{ content: CableItem[] } | CableItem[]>(
          `/api/v1/network/cables?size=50${queryParam}`
        );
      } catch (err) {
        console.warn("Failed to fetch cables:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const cables: CableItem[] = React.useMemo(() => {
    if (!cableData) return [];
    if (Array.isArray(cableData)) return cableData;
    if (Array.isArray(cableData.content)) return cableData.content;
    return [];
  }, [cableData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.cable_title")}
        subtitle={t("inventory.cable_subtitle")}
        icon={Network}
        actions={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("inventory.add_cable")}
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
      ) : cables.length > 0 ? (
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("inventory.cable_name").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.cable_type").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.core_count").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.length_meters").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.origin_node").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cables.map((c) => (
                <TableRow key={c.id} className="text-xs">
                  <TableCell className="font-mono font-bold text-primary">
                    {c.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {c.type || "FEEDER"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-foreground">
                      {c.usedCore ?? 0} / {c.fiberCount || c.coreCount || 24} Cores
                    </span>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-foreground">
                    {c.lengthMeters ?? 0} m ({ ((c.lengthMeters ?? 0) / 1000).toFixed(2) } Km)
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {c.startNode && c.endNode ? `${c.startNode} → ${c.endNode}` : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        c.status === "ACTIVE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {c.status || "ACTIVE"}
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
                        <DropdownMenuItem>{t("common.edit")}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">{t("common.delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={<Network className="h-6 w-6 text-muted-foreground" />}
          title={t("common.no_results")}
          description={
            searchQuery
              ? t("common.no_results")
              : t("inventory.cable_subtitle")
          }
          action={
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("inventory.add_cable")}
            </Button>
          }
        />
      )}

      <AssetDialog
        type="CABLE"
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </PageLayout>
  );
}
