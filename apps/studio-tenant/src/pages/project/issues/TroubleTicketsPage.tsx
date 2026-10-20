import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  AlertTriangle,
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
  EmptyState,
} from "@k2net/ui";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { useTranslation } from "@k2net/i18n";

interface TicketItem {
  id: string;
  title: string;
  type?: string;
  status: string;
  priority?: string;
  description?: string;
  reporterId?: string;
  assigneeId?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt?: string;
}

export function TroubleTicketsPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "";
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: ticketData, isLoading } = useQuery<{ content: TicketItem[] } | TicketItem[]>({
    queryKey: ["project-trouble-tickets", _projectId, searchQuery],
    queryFn: async () => {
      try {
        const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        return await apiClient<{ content: TicketItem[] } | TicketItem[]>(
          `/api/v1/tasks?size=50${queryParam}`
        );
      } catch (err) {
        console.warn("Failed to fetch trouble tickets:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const tickets: TicketItem[] = React.useMemo(() => {
    if (!ticketData) return [];
    if (Array.isArray(ticketData)) return ticketData;
    if (Array.isArray(ticketData.content)) return ticketData.content;
    return [];
  }, [ticketData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("issues.tickets_title")}
        subtitle={t("issues.tickets_subtitle")}
        icon={AlertTriangle}
        actions={
          <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
            <Plus className="h-3.5 w-3.5" />
            {t("issues.create_ticket")}
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
      ) : tickets.length > 0 ? (
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("issues.ticket_number").toUpperCase()} & {t("common.title").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("issues.issue_type").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("issues.assigned_technician").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.priority", { defaultValue: "PRIORITY" }).toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t_item) => (
                <TableRow key={t_item.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold font-mono text-primary block truncate max-w-xs">{t_item.id}</span>
                      <span className="font-medium text-foreground">{t_item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {t_item.referenceType || t_item.type || "INCIDENT"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {t_item.assigneeId || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <Badge variant="secondary" className="text-[10px]">
                      {t_item.priority || "NORMAL"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        t_item.status === "RESOLVED" || t_item.status === "DONE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : t_item.status === "IN_PROGRESS"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {t_item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6 text-muted-foreground" />}
          title={t("common.no_results")}
          description={
            searchQuery
              ? t("common.no_results")
              : t("issues.tickets_subtitle")
          }
          action={
            <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
              <Plus className="h-3.5 w-3.5" />
              {t("issues.create_ticket")}
            </Button>
          }
        />
      )}
    </PageLayout>
  );
}
