import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { Search, Users, Loader2 } from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  Input,
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

interface SubscriberItem {
  id: string;
  code: string;
  name: string;
  phone?: string;
  address?: string;
  status?: string;
  healthStatus?: string;
  odpCode?: string;
  projectId?: string;
}

export function SubscribersListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "";
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: subscriberData, isLoading } = useQuery<{ content: SubscriberItem[] } | SubscriberItem[]>({
    queryKey: ["project-subscribers", projectId, searchQuery],
    queryFn: async () => {
      try {
        const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        return await apiClient<{ content: SubscriberItem[] } | SubscriberItem[]>(
          `/api/v1/network/customers?size=50${queryParam}`
        );
      } catch (err) {
        console.warn("Failed to fetch subscribers:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const subscribers: SubscriberItem[] = React.useMemo(() => {
    if (!subscriberData) return [];
    if (Array.isArray(subscriberData)) return subscriberData;
    if (Array.isArray(subscriberData.content)) return subscriberData.content;
    return [];
  }, [subscriberData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.customer_title")}
        subtitle={t("inventory.customer_subtitle")}
        icon={Users}
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
      ) : subscribers.length > 0 ? (
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("inventory.customer_name").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.customer_id").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.odp_code").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.address").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((s) => (
                <TableRow key={s.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">{s.name}</span>
                      {s.phone && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {s.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-primary font-medium">
                    {s.code}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {s.odpCode || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {s.address || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        s.status === "ONLINE" || s.status === "ACTIVE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {s.status || "ACTIVE"}
                    </span>
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
          description={
            searchQuery
              ? t("common.no_results")
              : t("inventory.customer_subtitle")
          }
        />
      )}
    </PageLayout>
  );
}
