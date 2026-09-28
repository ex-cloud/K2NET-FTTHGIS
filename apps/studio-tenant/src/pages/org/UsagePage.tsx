import {
  MapPin,
  HardDrive,
  Cpu,
  TrendingUp,
  Download,
  Zap,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Progress,
} from "@k2net/ui";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { toast } from "sonner";

export function UsagePage() {
  const {
    summary,
    planName,
    usedProjects,
    maxProjects,
    projectPercentage,
    usedOdps,
    maxOdps,
    odpPercentage,
    usedStorageGb,
    maxStorageGb,
    storagePercentage,
    trialDaysRemaining,
    isBoosterActive,
    boosterDaysRemaining,
  } = useTenantSubscription();

  const apiRateMax = summary?.apiRateLimitMax || 5000;
  const apiRateUsed = summary?.apiRateLimitUsed || 0;
  const apiRatePercent = apiRateMax > 0 ? Math.min(100, Math.round((apiRateUsed / apiRateMax) * 100)) : 0;

  const usageMetrics = [
    {
      title: "Proyek FTTH Aktif",
      consumed: `${usedProjects} Proyek`,
      limit: `${maxProjects} Maksimal`,
      percent: projectPercentage,
      unit: "proyek aktif",
      icon: MapPin,
      status: projectPercentage > 90 ? "KRITIS" : "NORMAL",
    },
    {
      title: "Kapasitas Perangkat ODP",
      consumed: `${usedOdps.toLocaleString()} ODP`,
      limit: `${maxOdps.toLocaleString()} Maksimal`,
      percent: odpPercentage,
      unit: "perangkat terpasang",
      icon: Cpu,
      status: odpPercentage > 90 ? "KRITIS" : "NORMAL",
    },
    {
      title: "Penyimpanan Asset S3/MinIO",
      consumed: `${usedStorageGb.toFixed(1)} GB`,
      limit: `${maxStorageGb} GB`,
      percent: storagePercentage,
      unit: "GB Terpakai",
      icon: HardDrive,
      status: storagePercentage > 90 ? "KRITIS" : "NORMAL",
    },
    {
      title: "API Gateway Rate Limit",
      consumed: `${apiRateUsed.toLocaleString()} Req`,
      limit: `${apiRateMax.toLocaleString()} /jam`,
      percent: apiRatePercent,
      unit: "requests per jam",
      icon: Zap,
      status: apiRatePercent > 90 ? "KRITIS" : "NORMAL",
    },
  ];

  const handleExport = () => {
    toast.success("Laporan penggunaan sumber daya sedang diekspor...");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Konsumsi Sumber Daya Organisasi"
        breadcrumbs={[
          { label: "Organisasi", href: "/projects" },
          { label: "Penggunaan & Kuota" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 px-2.5 text-xs gap-1.5 border-border/80">
            <Download className="h-3.5 w-3.5" />
            Export Laporan Pemakaian
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usageMetrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Card key={idx} className="p-4 border-border/60 bg-card space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{m.title}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono">{m.unit}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    m.status === "KRITIS"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-foreground">{m.consumed}</span>
                    <span className="text-muted-foreground">Batas: {m.limit}</span>
                  </div>
                  <Progress value={m.percent} className="h-2" />
                  <span className="text-[10px] text-muted-foreground block text-right font-mono">
                    {m.percent}% kuota terpakai
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Historical Usage Breakdown Card */}
        <Card className="p-5 border-border/60 bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Ringkasan Siklus Berjalan ({planName})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Masa aktif: {trialDaysRemaining > 0 ? `${trialDaysRemaining} hari tersisa` : "Aktif permanen"} • Status: {summary?.status || "ACTIVE"}
              </p>
            </div>
            {isBoosterActive && (
              <span className="text-xs font-mono font-bold text-amber-500">
                Booster Aktif ({boosterDaysRemaining} Hari)
              </span>
            )}
          </div>

          <div className="rounded-lg bg-muted/30 p-3 border border-border/40 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Kapasitas infrastruktur terpantau stabil. Pemakaian database & kuota perangkat tercatat secara real-time dari backend core.
            </span>
          </div>
        </Card>
      </PageContentShell>
    </div>
  );
}
