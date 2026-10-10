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
  Cpu,
  Calculator,
} from "lucide-react";
import { useSearchParams, useRouter } from "@/lib/navigation-compat";
import type { LicenseItem, LicenseStatus } from "@/hooks/useOrganizationLicenses";
import { LicenseExtendModal } from "./LicenseExtendModal";
import { LicenseRevokeModal } from "./LicenseRevokeModal";
import { OfflineCertExportModal } from "./OfflineCertExportModal";
import { LicenseNotificationLogsModal } from "./LicenseNotificationLogsModal";
import { AdminProrateCalculatorModal } from "./AdminProrateCalculatorModal";

interface LicenseDataTableProps {
  licenses: LicenseItem[];
  loading?: boolean;
}

function LicenseStatusBadge({ status }: { status: LicenseStatus }) {
  const { t } = useTranslation();

  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border bg-foreground/5 text-foreground text-[11px] font-medium">
        <span className="size-1.5 rounded-full bg-foreground" />
        {t("license.status.active")}
      </span>
    );
  }

  if (status === "GRACE_PERIOD") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border/80 bg-muted/40 text-foreground/80 text-[11px] font-medium">
        <span className="size-1.5 rounded-full bg-foreground/60 animate-pulse" />
        {t("license.status.grace_period")}
      </span>
    );
  }

  if (status === "RESTRICTED_READ_ONLY") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border bg-muted/30 text-muted-foreground text-[11px] font-medium">
        <span className="size-1.5 rounded-full bg-muted-foreground" />
        {t("license.status.restricted_read_only")}
      </span>
    );
  }

  if (status === "REVOKED" || status === "SUSPENDED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border text-muted-foreground line-through text-[11px] font-medium">
        <span className="size-1.5 rounded-full bg-muted-foreground" />
        {status === "REVOKED" ? t("license.status.revoked") : t("license.status.suspended")}
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded-sm border border-border text-[11px]">
      {status}
    </span>
  );
}

interface LicenseTableRowProps {
  lic: LicenseItem;
  onCopyKey: (key: string) => void;
  onExtend: (lic: LicenseItem) => void;
  onExport: (lic: LicenseItem) => void;
  onNotifications: (lic: LicenseItem) => void;
  onRevoke: (lic: LicenseItem) => void;
  onProrate: (lic: LicenseItem) => void;
}

function LicenseRow({
  lic,
  onCopyKey,
  onExtend,
  onExport,
  onNotifications,
  onRevoke,
  onProrate,
}: LicenseTableRowProps) {
  const { t } = useTranslation();
  const isOffline =
    lic.activationType.toUpperCase().includes("OFFLINE") || Boolean(lic.machineFingerprint);

  return (
    <TableRow className="border-border/60 hover:bg-muted/15 transition-colors">
      {/* License Key & Hardware Fingerprint Badge */}
      <TableCell className="py-2 text-xs font-mono font-medium">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground">{lic.maskedLicenseKey}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onCopyKey(lic.licenseKey)}
            className="size-5 text-muted-foreground hover:text-foreground"
            title={t("license.actions.copy_key")}
          >
            <Copy className="size-3" />
          </Button>
          {Boolean(lic.machineFingerprint) && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono cursor-help"
              title={`${t("license.table.airgap_chip_title")}: ${lic.machineFingerprint}`}
            >
              <Cpu className="size-2.5" />
              <span>HW</span>
            </span>
          )}
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
          <span
            className={`text-[10px] px-1 py-0.2 rounded-xs border ${
              isOffline
                ? "border-primary/40 bg-primary/5 text-primary font-medium"
                : "border-border/70 text-muted-foreground"
            }`}
          >
            {lic.activationType}
          </span>
        </div>
      </TableCell>

      {/* Status Badge */}
      <TableCell className="py-2 text-xs">
        <LicenseStatusBadge status={lic.status} />
      </TableCell>

      {/* Days Remaining / Validity */}
      <TableCell className="py-2 text-xs">
        <div className="flex items-center gap-1 text-[11px] text-foreground font-medium">
          <Clock className="size-3 text-muted-foreground" />
          <span>{lic.daysRemaining} {t("common.days").toLowerCase()}</span>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
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

      {/* Row Actions (Compact Density: size="xs") */}
      <TableCell className="py-2 text-xs text-right pr-4">
        <div className="flex items-center justify-end gap-1.5">
          {/* Prorate Simulator trigger per license */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => onProrate(lic)}
            className="h-6 px-1.5 text-[11px] font-medium gap-1 text-muted-foreground hover:text-foreground"
            title={t("license.table.simulate_prorate")}
          >
            <Calculator className="size-3" />
          </Button>

          {/* Extend duration */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => onExtend(lic)}
            className="h-6 px-2 text-[11px] font-medium gap-1"
            title={t("license.actions.extend_license")}
          >
            <Clock className="size-3" />
            <span>{t("license.actions.extend_license")}</span>
          </Button>

          {/* Export offline cert */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => onExport(lic)}
            className="h-6 px-2 text-[11px] font-medium gap-1"
            title={t("license.actions.export_cert")}
          >
            <Download className="size-3" />
            <span>.lic</span>
          </Button>

          {/* Notification logs */}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onNotifications(lic)}
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            title={t("license.notifications.log_title")}
          >
            <Bell className="size-3" />
          </Button>

          {/* Revoke Kill-Switch */}
          {lic.status !== "REVOKED" && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onRevoke(lic)}
              className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
              title={t("license.actions.revoke_license")}
            >
              <Ban className="size-3" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function LicenseDataTable({ licenses, loading }: LicenseDataTableProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [search, setSearch] = React.useState<string>("");

  // Initial status filter from URL query params (?status=... or ?type=OFFLINE)
  const initialFilter = React.useMemo(() => {
    const typeParam = searchParams.get("type");
    if (typeParam?.toUpperCase() === "OFFLINE") return "OFFLINE";
    const statusParam = searchParams.get("status");
    if (statusParam) return statusParam.toUpperCase();
    return "ALL";
  }, [searchParams]);

  const [statusFilter, setStatusFilter] = React.useState<string>(initialFilter);

  // Sync state if URL search query changes
  React.useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  // Global keyboard shortcut '/' to focus search input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Operational Modals State
  const [extendModalOpen, setExtendModalOpen] = React.useState<boolean>(false);
  const [revokeModalOpen, setRevokeModalOpen] = React.useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = React.useState<boolean>(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = React.useState<boolean>(false);
  const [prorateModalOpen, setProrateModalOpen] = React.useState<boolean>(false);
  const [selectedLicense, setSelectedLicense] = React.useState<LicenseItem | null>(null);

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    if (newFilter === "ALL") {
      router.push("/licenses");
    } else if (newFilter === "OFFLINE") {
      router.push("/licenses?type=OFFLINE");
    } else {
      router.push(`/licenses?status=${newFilter}`);
    }
  };

  // Filtered Licenses
  const filteredLicenses = React.useMemo(() => {
    return licenses.filter((item) => {
      const matchSearch =
        search.trim() === "" ||
        item.licenseKey.toLowerCase().includes(search.toLowerCase()) ||
        item.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
        item.organizationSlug?.toLowerCase().includes(search.toLowerCase()) ||
        item.planName.toLowerCase().includes(search.toLowerCase());

      const isOfflineItem =
        item.activationType.toUpperCase().includes("OFFLINE") || Boolean(item.machineFingerprint);

      const matchStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter ||
        (statusFilter === "OFFLINE" && isOfflineItem);

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

  const handleOpenProrate = (item: LicenseItem) => {
    setSelectedLicense(item);
    setProrateModalOpen(true);
  };

  const filterTabs = [
    { id: "ALL", label: t("common.all") },
    { id: "ACTIVE", label: t("license.status.active") },
    { id: "GRACE_PERIOD", label: t("license.status.grace_period") },
    { id: "RESTRICTED_READ_ONLY", label: t("license.status.restricted_read_only") },
    { id: "OFFLINE", label: t("license.table.filter_offline") },
    { id: "REVOKED", label: t("license.status.revoked") },
  ];

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Pinned Toolbar with Backdrop Blur */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px] max-w-md">
          {/* Search Input with '/' shortcut badge */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={t("license.table.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7.5 pl-8 pr-7 text-xs bg-muted/20 border-border/80"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-4 select-none items-center rounded border border-border/80 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented Filter Pills */}
          <div className="flex items-center rounded-md border border-border/80 bg-card p-0.5 shrink-0 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
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

          {/* Quick Action: Simulate Prorate Modal Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedLicense(null);
              setProrateModalOpen(true);
            }}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80 bg-background/80 hover:bg-muted shrink-0"
            title={t("license.table.simulate_prorate")}
          >
            <Calculator className="size-3.5" />
            <span>{t("license.table.simulate_prorate")}</span>
          </Button>
        </div>
      </div>

      {/* Dense Table */}
      <div className="flex-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/80 bg-muted/25 hover:bg-muted/25 sticky top-0">
              <TableHead className="text-[11px] font-semibold text-foreground h-8 pl-4">
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
                <LicenseRow
                  key={lic.id}
                  lic={lic}
                  onCopyKey={handleCopyKey}
                  onExtend={handleOpenExtend}
                  onExport={handleOpenExport}
                  onNotifications={handleOpenNotifications}
                  onRevoke={handleOpenRevoke}
                  onProrate={handleOpenProrate}
                />
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
      <AdminProrateCalculatorModal
        open={prorateModalOpen}
        onOpenChange={setProrateModalOpen}
        licenses={licenses}
        initialLicense={selectedLicense}
      />
    </div>
  );
}
