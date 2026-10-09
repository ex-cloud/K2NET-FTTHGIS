import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Input,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Search,
  Copy,
  Clock,
  Download,
  Ban,
  Building2,
  Bell,
} from "lucide-react";
import type { LicenseItem, LicenseStatus } from "@/hooks/useOrganizationLicenses";
import { LicenseExtendModal } from "./LicenseExtendModal";
import { LicenseRevokeModal } from "./LicenseRevokeModal";
import { OfflineCertExportModal } from "./OfflineCertExportModal";
import { LicenseNotificationLogsModal } from "./LicenseNotificationLogsModal";

interface LicenseDataTableProps {
  licenses: LicenseItem[];
  loading?: boolean;
}

export function LicenseDataTable({ licenses, loading }: LicenseDataTableProps) {
  const { t } = useTranslation();

  const [search, setSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Modal State
  const [extendModalOpen, setExtendModalOpen] = React.useState<boolean>(false);
  const [revokeModalOpen, setRevokeModalOpen] = React.useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = React.useState<boolean>(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = React.useState<boolean>(false);
  const [selectedLicense, setSelectedLicense] = React.useState<LicenseItem | null>(null);

  // Filtered Licenses
  const filteredLicenses = React.useMemo(() => {
    return licenses.filter((item) => {
      const matchSearch =
        search.trim() === "" ||
        item.licenseKey.toLowerCase().includes(search.toLowerCase()) ||
        item.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
        item.organizationSlug?.toLowerCase().includes(search.toLowerCase()) ||
        item.planName.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter ||
        (statusFilter === "OFFLINE" && item.activationType === "OFFLINE_KEY");

      return matchSearch && matchStatus;
    });
  }, [licenses, search, statusFilter]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      toast.success(t("license.actions.copied"));
    });
  };

  const handleOpenExtend = (item: LicenseItem) => {
    setSelectedLicense(item);
    setExtendModalOpen(true);
  };

  const handleOpenRevoke = (item: LicenseItem) => {
    setSelectedLicense(item);
    setRevokeModalOpen(true);
  };

  const handleOpenExport = (item: LicenseItem) => {
    setSelectedLicense(item);
    setExportModalOpen(true);
  };

  const handleOpenNotifications = (item: LicenseItem) => {
    setSelectedLicense(item);
    setNotificationsModalOpen(true);
  };

  const renderStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border bg-foreground/5 text-foreground text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-foreground" />
            {t("license.status.active")}
          </span>
        );
      case "GRACE_PERIOD":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border/80 bg-muted/40 text-foreground/80 text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-foreground/60 animate-pulse" />
            {t("license.status.grace_period")}
          </span>
        );
      case "RESTRICTED_READ_ONLY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border bg-muted/30 text-muted-foreground text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            {t("license.status.restricted_read_only")}
          </span>
        );
      case "REVOKED":
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border text-muted-foreground line-through text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            {status === "REVOKED" ? t("license.status.revoked") : t("license.status.suspended")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-sm border border-border text-[11px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter Toolbar & Segmented View */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={t("license.table.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7.5 pl-8 text-xs bg-muted/20 border-border/80"
          />
        </div>

        {/* Segmented Filter */}
        <div className="flex items-center rounded-md border border-border/80 bg-card p-0.5 shrink-0 overflow-x-auto">
          {[
            { id: "ALL", label: t("common.all") },
            { id: "ACTIVE", label: t("license.status.active") },
            { id: "GRACE_PERIOD", label: t("license.status.grace_period") },
            { id: "RESTRICTED_READ_ONLY", label: t("license.status.restricted_read_only") },
            { id: "REVOKED", label: t("license.status.revoked") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dense Table */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="border-border/80 bg-muted/25 hover:bg-muted/25">
              <TableHead className="text-[11px] font-semibold text-foreground h-8">
                {t("license.table.license_key")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-foreground h-8">
                {t("license.table.tenant_org")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-foreground h-8">
                {t("license.table.plan_tier")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-foreground h-8">
                {t("license.table.status")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-foreground h-8">
                {t("license.table.days_remaining")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-foreground h-8">
                {t("license.table.entitlements")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-foreground h-8 text-right pr-4">
                {t("license.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            ) : filteredLicenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="font-medium text-foreground">{t("license.table.empty_title")}</p>
                    <p className="text-[11px] text-muted-foreground">{t("license.table.empty_desc")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLicenses.map((lic) => (
                <TableRow key={lic.id} className="border-border/60 hover:bg-muted/15 transition-colors">
                  {/* License Key with Copy Button */}
                  <TableCell className="py-2 text-xs font-mono font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground">{lic.maskedLicenseKey}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopyKey(lic.licenseKey)}
                        className="size-5 text-muted-foreground hover:text-foreground"
                        title={t("license.actions.copy_key")}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Organization */}
                  <TableCell className="py-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium text-foreground leading-tight">
                          {lic.organizationName || "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {lic.organizationSlug}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Plan Tier & Mode */}
                  <TableCell className="py-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground text-[11px]">
                        {lic.planName}
                      </span>
                      <span className="text-[10px] text-muted-foreground px-1 py-0.2 rounded-xs border border-border/70">
                        {lic.activationType}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-2 text-xs">
                    {renderStatusBadge(lic.status)}
                  </TableCell>

                  {/* Days Remaining / Validity */}
                  <TableCell className="py-2 text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-foreground font-medium">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{lic.daysRemaining} {t("common.days").toLowerCase()}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {lic.validUntil ? lic.validUntil.substring(0, 10) : "—"}
                    </div>
                  </TableCell>

                  {/* Quota Entitlements Pills */}
                  <TableCell className="py-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 rounded-xs border border-border/60 bg-muted/20 text-foreground" title={t("license.modal.max_projects_olts")}>
                        OLT: {lic.entitlements?.maxProjects ?? "-"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-xs border border-border/60 bg-muted/20 text-foreground" title={t("license.modal.max_odps")}>
                        ODP: {lic.entitlements?.maxOdps ?? "-"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-xs border border-border/60 bg-muted/20 text-foreground" title={t("license.modal.max_customers")}>
                        Subs: {lic.entitlements?.maxCustomers ?? "-"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Row Actions (size="xs") */}
                  <TableCell className="py-2 text-xs text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenExtend(lic)}
                        className="h-6 px-2 text-[11px] font-medium gap-1"
                        title={t("license.actions.extend_license")}
                      >
                        <Clock className="size-3" />
                        <span>{t("license.actions.extend_license")}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenExport(lic)}
                        className="h-6 px-2 text-[11px] font-medium gap-1"
                        title={t("license.actions.export_cert")}
                      >
                        <Download className="size-3" />
                        <span>.lic</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenNotifications(lic)}
                        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                        title={t("license.notifications.log_title")}
                      >
                        <Bell className="size-3" />
                      </Button>

                      {lic.status !== "REVOKED" && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenRevoke(lic)}
                          className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
                          title={t("license.actions.revoke_license")}
                        >
                          <Ban className="size-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Operational Modals */}
      <LicenseExtendModal
        license={selectedLicense}
        open={extendModalOpen}
        onOpenChange={setExtendModalOpen}
      />
      <LicenseRevokeModal
        license={selectedLicense}
        open={revokeModalOpen}
        onOpenChange={setRevokeModalOpen}
      />
      <OfflineCertExportModal
        license={selectedLicense}
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
      />
      <LicenseNotificationLogsModal
        license={selectedLicense}
        open={notificationsModalOpen}
        onOpenChange={setNotificationsModalOpen}
      />
    </div>
  );
}
