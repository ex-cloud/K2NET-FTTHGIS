import * as React from "react";
import {
  PageHero,
  Card,
  Button,
  Badge,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Ban,
  ShieldAlert,
  Search,
  RefreshCcw,
  Building2,
  Copy,
  Clock,
  Sliders,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";
import {
  useAllLicenses,
  type LicenseItem,
} from "@/hooks/useOrganizationLicenses";
import { LicenseRevokeModal } from "@/components/licenses/LicenseRevokeModal";
import { LicenseExtendModal } from "@/components/licenses/LicenseExtendModal";
import { EditLicenseModal } from "@/components/licenses/EditLicenseModal";

export default function LicenseRevocationsPage() {
  const { t } = useTranslation();
  const { data: licenses = [], isLoading, isFetching, refetch } = useAllLicenses();

  const [search, setSearch] = React.useState<string>("" );
  const [revokeModalOpen, setRevokeModalOpen] = React.useState<boolean>(false);
  const [extendModalOpen, setExtendModalOpen] = React.useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = React.useState<boolean>(false);
  const [selectedLicense, setSelectedLicense] = React.useState<LicenseItem | null>(null);

  // Compute counts
  const revokedLicenses = React.useMemo(() => {
    return licenses.filter(
      (lic) => lic.status === "REVOKED" || lic.status === "SUSPENDED"
    );
  }, [licenses]);

  const totalRevoked = licenses.filter((l) => l.status === "REVOKED").length;
  const totalSuspended = licenses.filter((l) => l.status === "SUSPENDED").length;
  const totalActive = licenses.filter((l) => l.status === "ACTIVE").length;

  // Filtered revoked licenses
  const filteredLicenses = React.useMemo(() => {
    return revokedLicenses.filter((item) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.licenseKey.toLowerCase().includes(q) ||
        item.organizationName?.toLowerCase().includes(q) ||
        item.organizationSlug?.toLowerCase().includes(q) ||
        item.planName.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
      );
    });
  }, [revokedLicenses, search]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      toast.success(t("license.actions.copied"));
    });
  };

  const handleOpenExtend = (item: LicenseItem) => {
    setSelectedLicense(item);
    setExtendModalOpen(true);
  };

  const handleOpenEdit = (item: LicenseItem) => {
    setSelectedLicense(item);
    setEditModalOpen(true);
  };

  const handleTriggerKillSwitch = () => {
    // If no license preselected, take first active license or null
    const firstActive = licenses.find((l) => l.status === "ACTIVE") || null;
    setSelectedLicense(firstActive);
    setRevokeModalOpen(true);
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
      {/* Page Hero Header */}
      <div className="px-4 md:px-6 shrink-0">
        <PageHero
          bordered={false}
          className="pb-0"
          eyebrow={t("license.hero_eyebrow")}
          title={t("license.revocations.title")}
          icon={Ban}
          subtitle={t("license.revocations.desc")}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{totalRevoked}</span>
                <span>{t("license.revocations.total_revoked")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{totalSuspended}</span>
                <span>{t("license.revocations.total_suspended")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{totalActive}</span>
                <span>{t("license.revocations.active_compliant")}</span>
              </div>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5 text-xs font-medium"
              >
                <RefreshCcw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
                <span>{t("common.refresh")}</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleTriggerKillSwitch}
                className="gap-1.5 text-xs font-medium"
              >
                <ShieldAlert className="size-3.5" />
                <span>{t("license.revocations.trigger_killswitch")}</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                {t("license.revocations.total_revoked")}
              </span>
              <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                <AlertOctagon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : totalRevoked}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Permanent runtime revocation
              </p>
            </div>
          </Card>

          <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                {t("license.revocations.total_suspended")}
              </span>
              <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                <Ban className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : totalSuspended}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Temporary non-payment lock
              </p>
            </div>
          </Card>

          <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                {t("license.revocations.active_compliant")}
              </span>
              <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : totalActive}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Healthy enterprise tenant contracts
              </p>
            </div>
          </Card>
        </div>

        {/* Search Toolbar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={t("license.table.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/20 border-border"
            />
          </div>
        </div>

        {/* Revocations Table */}
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
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
                  {t("license.revocations.revocation_reason")}
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-foreground h-8 text-right pr-4">
                  {t("license.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : filteredLicenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p className="font-medium text-foreground">{t("license.revocations.empty_title")}</p>
                      <p className="text-[11px] text-muted-foreground">{t("license.revocations.empty_desc")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLicenses.map((lic) => (
                  <TableRow key={lic.id} className="border-border/60 hover:bg-muted/15 transition-colors">
                    <TableCell className="py-2 text-xs font-mono font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground line-through opacity-80">{lic.maskedLicenseKey}</span>
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

                    <TableCell className="py-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">
                            {lic.organizationName || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2 text-xs">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {lic.planName}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border border-border bg-muted/30 text-muted-foreground text-[10px] font-mono font-medium">
                        <span className="size-1.5 rounded-full bg-muted-foreground" />
                        {lic.status === "REVOKED" ? t("license.status.revoked") : t("license.status.suspended")}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 text-xs font-mono text-muted-foreground italic truncate max-w-[260px]">
                      {lic.notes || "—"}
                    </TableCell>

                    <TableCell className="py-2 text-xs text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenExtend(lic)}
                          className="h-6 px-2 text-[11px] font-medium gap-1"
                        >
                          <Clock className="size-3" />
                          <span>{t("license.actions.extend_license")}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEdit(lic)}
                          className="h-6 px-1.5 text-[11px] font-medium gap-1 text-muted-foreground hover:text-foreground"
                          title={t("license.actions.edit_details")}
                        >
                          <Sliders className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Operational Modals */}
      <LicenseRevokeModal
        license={selectedLicense}
        open={revokeModalOpen}
        onOpenChange={setRevokeModalOpen}
      />
      <LicenseExtendModal
        license={selectedLicense}
        open={extendModalOpen}
        onOpenChange={setExtendModalOpen}
      />
      <EditLicenseModal
        license={selectedLicense}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </div>
  );
}
