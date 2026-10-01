import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  MoreVertical,
  Signal,
  Loader2,
  Users,
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
import { AssetDialog } from "../../../components/inventory/AssetDialogs";
import { useTranslation } from "@k2net/i18n";

interface CustomerItem {
  id: string;
  code: string;
  name: string;
  address?: string;
  status?: string;
  healthStatus?: string;
  odpCode?: string;
  projectId?: string;
  lat?: number;
  lng?: number;
}

export function CustomerDatabasePage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: customerData, isLoading } = useQuery<{ content: CustomerItem[] } | CustomerItem[]>({
    queryKey: ["project-customers", projectId, searchQuery],
    queryFn: async () => {
      try {
        const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        return await apiClient<{ content: CustomerItem[] } | CustomerItem[]>(
          `/api/v1/network/customers?size=50${queryParam}`
        );
      } catch (err) {
        console.warn("Failed to fetch customers:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const customers: CustomerItem[] = React.useMemo(() => {
    if (!customerData) return [];
    if (Array.isArray(customerData)) return customerData;
    if (Array.isArray(customerData.content)) return customerData.content;
    return [];
  }, [customerData]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: t("nav.inventory"), href: `/project/${projectId}/inventory/customers` },
          { label: t("inventory.customer_title") },
        ]}
        title={t("inventory.customer_subtitle")}
        actions={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            {t("inventory.add_customer")}
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
          ) : customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-[11px]">
                  <TableHead className="font-bold">{t("inventory.customer_id").toUpperCase()} & {t("inventory.customer_name").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.odp_port").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("inventory.address").toUpperCase()}</TableHead>
                  <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="text-xs">
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground block">{c.name || "Pelanggan"}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {c.code || c.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-primary font-semibold">
                      {c.odpCode || "Belum Terhubung"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {c.address || "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          c.status === "ONLINE" || c.status === "ACTIVE"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Signal className="h-3 w-3" />
                          {c.status || "ACTIVE"}
                        </span>
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
                          <DropdownMenuItem>Pindai Sinyal ONT</DropdownMenuItem>
                          <DropdownMenuItem>Lihat Sambungan di Peta</DropdownMenuItem>
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
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">{t("common.no_results")}</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? t("common.no_results")
                  : t("inventory.customer_subtitle")}
              </p>
            </div>
          )}
        </Card>
      </PageContentShell>

      <AssetDialog
        type="CUSTOMER"
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </div>
  );
}
