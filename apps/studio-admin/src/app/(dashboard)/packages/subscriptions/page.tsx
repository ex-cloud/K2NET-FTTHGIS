import * as React from "react";
import { PageHero, Card, Button, Input, PageLayout } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  FolderKanban,
  Search,
  RefreshCcw,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { useAllPackageSubscriptions } from "@/hooks/usePlatformPackages";

function formatDate(isoStr?: string): string {
  if (!isoStr) return "—";
  try {
    return new Date(isoStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoStr;
  }
}

export default function PackageSubscriptionsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  const {
    data: subscriptions = [],
    isLoading,
    refetch,
  } = useAllPackageSubscriptions();

  const filteredSubs = React.useMemo(() => {
    return subscriptions.filter((sub) => {
      if (statusFilter && sub.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesOrg =
          (sub.organizationName || "").toLowerCase().includes(query) ||
          (sub.organizationSlug || "").toLowerCase().includes(query);
        const matchesPkg =
          (sub.packageName || "").toLowerCase().includes(query) ||
          sub.packageCode.toLowerCase().includes(query);
        return matchesOrg || matchesPkg;
      }
      return true;
    });
  }, [subscriptions, statusFilter, searchQuery]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Header */}
      <PageHero
        bordered={false}
        className="pb-0"
          eyebrow={t("packages.hero_eyebrow")}
          title={t("packages.subscriptions.title")}
          icon={FolderKanban}
          subtitle={t("packages.subscriptions.subtitle")}
          actions={
            <div className="flex items-center gap-2">
              <Link to="/packages">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("packages.subscriptions.btn_back_to_catalog")}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="h-7 px-2 text-xs font-medium gap-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                {t("packages.btn_refresh")}
              </Button>
            </div>
          }
        />

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("packages.subscriptions.search_placeholder")}
            className="pl-8 h-8 text-xs bg-muted/20 border-border"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
        >
          <option value="">{t("packages.filter_all_statuses")}</option>
          <option value="ACTIVE">{t("packages.sub_status.ACTIVE")}</option>
          <option value="GRACE_PERIOD">{t("packages.sub_status.GRACE_PERIOD")}</option>
          <option value="EXPIRED">{t("packages.sub_status.EXPIRED")}</option>
          <option value="REVOKED">{t("packages.sub_status.REVOKED")}</option>
        </select>
      </div>

      {/* Subscriptions Data Table */}
      <div className="w-full">
        <Card className="rounded-lg border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 font-mono text-[11px] text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3">{t("packages.subscriptions.col_tenant")}</th>
                  <th className="px-4 py-3">{t("packages.subscriptions.col_package")}</th>
                  <th className="px-4 py-3">{t("packages.subscriptions.col_status")}</th>
                  <th className="px-4 py-3">{t("packages.subscriptions.col_billing")}</th>
                  <th className="px-4 py-3">{t("packages.subscriptions.col_activated")}</th>
                  <th className="px-4 py-3">{t("packages.subscriptions.col_expires")}</th>
                  <th className="px-4 py-3">{t("packages.subscriptions.col_auto_renew")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {t("packages.subscriptions.loading_text")}
                    </td>
                  </tr>
                ) : filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {t("packages.subscriptions.empty_text")}
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map((sub) => {
                    const status = sub.status || "ACTIVE";
                    let badgeClass = "bg-muted/20 text-muted-foreground border-border";
                    let StatusIcon = Clock;

                    if (status === "ACTIVE") {
                      badgeClass = "bg-foreground/10 text-foreground border-foreground/20";
                      StatusIcon = CheckCircle2;
                    } else if (status === "GRACE_PERIOD") {
                      badgeClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                      StatusIcon = AlertTriangle;
                    } else if (status === "EXPIRED" || status === "REVOKED") {
                      badgeClass = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                      StatusIcon = XCircle;
                    }

                    return (
                      <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {sub.organizationName || sub.organizationSlug || "Tenant"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {sub.organizationSlug || sub.organizationId}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {sub.packageName || sub.packageCode}
                            </span>
                            <code className="text-[10px] text-muted-foreground font-mono">
                              {sub.packageCode}
                            </code>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${badgeClass}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {t(`packages.sub_status.${status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                          {t(`packages.billing_type.${sub.billingType || "MONTHLY_RECURRING"}`)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(sub.activatedAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                          {formatDate(sub.expiresAt)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          {sub.autoRenew ? (
                            <span className="text-foreground font-semibold">{t("packages.subscriptions.auto_renew_active")}</span>
                          ) : (
                            <span className="text-muted-foreground">{t("packages.subscriptions.auto_renew_inactive")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
