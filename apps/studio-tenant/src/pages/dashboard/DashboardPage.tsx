import * as React from "react";
import {
  Server,
  Radio,
  Users,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Zap,
  Ticket,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  PageContentShell,
  cn,
} from "@k2net/ui";
import { useNavigate } from "@tanstack/react-router";

// ── Types ──────────────────────────────────────────────────────────────────
interface KpiStatItem {
  title: string;
  value: string;
  badgeText: string;
  subLeft: string;
  subRight: string;
  actionText: string;
  actionPath: string;
  icon: React.ElementType;
}

// ── 1. KPI Cards Row Component (1:1 with studio-admin OverviewMetricCard) ──
function KpiCardsGrid({ items, onNavigate }: { items: KpiStatItem[]; onNavigate: (path: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.title}
            glowingEffect
            className="flex flex-col justify-between transition-all duration-200 p-0"
          >
            <div className="p-3.5 sm:p-4 pb-1.5 flex flex-col justify-between">
              {/* Top Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] sm:text-xs uppercase font-semibold tracking-wider text-muted-foreground/90 truncate">
                    {item.title}
                  </span>
                  {item.badgeText && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary font-medium">
                      {item.badgeText}
                    </span>
                  )}
                </div>
                <div className="p-1 sm:p-1.5 rounded-lg bg-muted/40 border border-border/40 text-muted-foreground/80 shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Main Metric Value Row */}
              <div className="mt-2 text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-baseline flex-wrap gap-2">
                {item.value}
              </div>
            </div>

            {/* Helper Stats & Footer Link */}
            <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground font-medium">
                <span className="truncate min-w-0 font-mono">{item.subLeft}</span>
                <span className="shrink-0 ml-2 font-mono">{item.subRight}</span>
              </div>

              <div className="pt-2 border-groove-t flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
                <span className="truncate mr-1 text-muted-foreground/70">
                  Operasional
                </span>
                <button
                  onClick={() => onNavigate(item.actionPath)}
                  className="flex items-center gap-1 transition-colors shrink-0 ml-auto font-medium text-foreground/85 hover:text-primary cursor-pointer"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── 2. Throughput & Traffic Charts Section ──────────────────────────────────
function ThroughputAndPortCharts({
  hourlyBars,
  trafficFilter,
  setTrafficFilter,
}: {
  hourlyBars: { hour: string; val: number }[];
  trafficFilter: "all" | "download" | "upload";
  setTrafficFilter: (filter: "all" | "download" | "upload") => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
      {/* Col 1: Realtime Throughput Stream Bar Chart (8 cols) */}
      <Card glowingEffect className="lg:col-span-8 p-5 space-y-4 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Aggregated GPON Throughput Traffic (24 Jam)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live aggregate egress/ingress traffic across 4 POP OLTs • Peak: 2.84 Gbps
            </p>
          </div>

          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs">
            <button
              onClick={() => setTrafficFilter("all")}
              className={cn(
                "px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer text-xs",
                trafficFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Total Traffic
            </button>
            <button
              onClick={() => setTrafficFilter("download")}
              className={cn(
                "px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer text-xs",
                trafficFilter === "download"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Download
            </button>
            <button
              onClick={() => setTrafficFilter("upload")}
              className={cn(
                "px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer text-xs",
                trafficFilter === "upload"
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Upload
            </button>
          </div>
        </div>

        {/* Bar Chart Bars */}
        <div className="pt-2">
          <div className="h-44 w-full flex items-end gap-2 sm:gap-3 px-1">
            {hourlyBars.map((bar) => {
              const heightPercent = bar.val;
              return (
                <div key={bar.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {(bar.val * 28.4).toFixed(0)}M
                  </div>
                  <div className="w-full bg-muted/40 rounded-t-md relative overflow-hidden flex flex-col justify-end" style={{ height: "100%" }}>
                    <div
                      className="w-full bg-primary/80 group-hover:bg-primary rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/75 truncate w-full text-center">
                    {bar.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Download: <strong className="text-foreground font-mono">1.84 Gbps</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary/40" />
              <span>Upload: <strong className="text-foreground font-mono">640 Mbps</strong></span>
            </span>
          </div>
          <span className="text-primary font-semibold text-xs">99.98% Network SLA</span>
        </div>
      </Card>

      {/* Col 2: FAT Port & Redaman Distribution (4 cols) */}
      <Card glowingEffect className="lg:col-span-4 p-5 space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Kondisi Redaman Optik FAT
              </h3>
            </div>
            <span className="text-[10px] font-mono text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
              ITU-T G.984
            </span>
          </div>

          <div className="space-y-3.5 pt-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">Optimal (-15 s/d -22 dBm)</span>
                <span className="text-primary font-bold font-mono">1.184 ONU (92.5%)</span>
              </div>
              <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "92.5%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">Waspada (-23 s/d -26 dBm)</span>
                <span className="text-amber-500 font-bold font-mono">93 ONU (7.2%)</span>
              </div>
              <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "7.2%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">Kritis (&gt; -27 dBm / LOS)</span>
                <span className="text-destructive font-bold font-mono">3 ONU (0.3%)</span>
              </div>
              <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                <div className="bg-destructive h-full rounded-full" style={{ width: "0.3%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/70 bg-muted/20 text-xs space-y-1">
          <div className="flex items-center justify-between font-medium text-foreground">
            <span>Rata-rata Optical Rx:</span>
            <span className="font-mono text-primary font-bold">-19.8 dBm</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Splitter Budget:</span>
            <span className="font-mono">1:8 ODC + 1:8 ODP</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── 3. Operations Hub Table Section (1:1 with studio-admin Table Density) ──
function OperationsHubTable({
  activeTab,
  setActiveTab,
  olts,
  attenuationIssues,
  recentCustomers,
  onNavigate,
}: {
  activeTab: "olts" | "attenuation" | "customers" | "tickets";
  setActiveTab: (tab: "olts" | "attenuation" | "customers" | "tickets") => void;
  olts: { name: string; vendor: string; ip: string; pon: string; load: string; latency: string; status: string; onUs: number }[];
  attenuationIssues: { customer: string; pppoe: string; odp: string; port: number; rx: string; status: string; cause: string }[];
  recentCustomers: { name: string; pppoe: string; odp: string; speed: string; rx: string; status: string }[];
  onNavigate: (path: string) => void;
}) {
  return (
    <Card glowingEffect className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs">
          <button
            onClick={() => setActiveTab("olts")}
            className={cn(
              "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
              activeTab === "olts"
                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Status OLT (4)
          </button>
          <button
            onClick={() => setActiveTab("attenuation")}
            className={cn(
              "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
              activeTab === "attenuation"
                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Redaman Kritis (3)
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={cn(
              "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
              activeTab === "customers"
                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pelanggan Baru (4)
          </button>
        </div>

        {/* Quick link button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onNavigate("/inventory")}
          className="h-7 px-2.5 text-xs font-medium gap-1 shadow-xs cursor-pointer rounded-md border-border text-foreground hover:bg-muted"
        >
          <span>Buka Inventaris Penuh</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Tab: OLT Status */}
      {activeTab === "olts" && (
        <div className="rounded-lg border border-border/80 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nama OLT</th>
                <th className="px-4 py-3">Vendor / Tipe</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">PON Ports</th>
                <th className="px-4 py-3">Load CPU</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {olts.map((olt) => (
                <tr key={olt.name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{olt.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{olt.vendor}</td>
                  <td className="px-4 py-3 font-mono text-primary">{olt.ip}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{olt.pon} <span className="text-muted-foreground">({olt.onUs} ONU)</span></td>
                  <td className="px-4 py-3 font-mono text-foreground">{olt.load}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{olt.latency}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono">
                      {olt.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Critical Attenuation */}
      {activeTab === "attenuation" && (
        <div className="rounded-lg border border-border/80 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">User PPPoE</th>
                <th className="px-4 py-3">FAT ODP &amp; Port</th>
                <th className="px-4 py-3">Optical Rx Power</th>
                <th className="px-4 py-3">Indikasi Masalah</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {attenuationIssues.map((issue) => (
                <tr key={issue.pppoe} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{issue.customer}</td>
                  <td className="px-4 py-3 font-mono text-primary">{issue.pppoe}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{issue.odp} <span className="text-muted-foreground">· Port #{issue.port}</span></td>
                  <td className="px-4 py-3 font-mono text-destructive font-bold">{issue.rx}</td>
                  <td className="px-4 py-3 text-muted-foreground">{issue.cause}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] font-mono">
                      {issue.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Customers */}
      {activeTab === "customers" && (
        <div className="rounded-lg border border-border/80 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nama Pelanggan</th>
                <th className="px-4 py-3">User PPPoE</th>
                <th className="px-4 py-3">Lokasi ODP</th>
                <th className="px-4 py-3">Paket Bandwidth</th>
                <th className="px-4 py-3">Optical Rx</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recentCustomers.map((c) => (
                <tr key={c.pppoe} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-primary">{c.pppoe}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{c.odp}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.speed}</td>
                  <td className="px-4 py-3 font-mono text-primary font-bold">{c.rx}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono">
                      {c.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── Main Dashboard Page ────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<"olts" | "attenuation" | "customers" | "tickets">("olts");
  const [trafficFilter, setTrafficFilter] = React.useState<"all" | "download" | "upload">("all");

  const kpiStats: KpiStatItem[] = [
    {
      title: "TOTAL ONU AKTIF",
      value: "1.280",
      badgeText: "99.8% Online",
      subLeft: "Baru: +42",
      subRight: "Uptime: 99.9%",
      actionText: "Data Pelanggan",
      actionPath: "/customers",
      icon: Users,
    },
    {
      title: "PERANGKAT OLT",
      value: "4 Unit",
      badgeText: "48 PON Ports",
      subLeft: "Online: 4/4",
      subRight: "Load: 68%",
      actionText: "Inventaris OLT",
      actionPath: "/inventory",
      icon: Server,
    },
    {
      title: "KAPASITAS FAT / ODP",
      value: "1.420",
      badgeText: "212 Box",
      subLeft: "Terpakai: 84%",
      subRight: "Sisa: 228 Port",
      actionText: "Sebaran ODP",
      actionPath: "/inventory",
      icon: Radio,
    },
    {
      title: "SPATIAL GIS TELEMETRY",
      value: "3.4k req/d",
      badgeText: "MVT Live",
      subLeft: "Latency: 18ms",
      subRight: "Martin PostGIS",
      actionText: "Buka Peta GIS",
      actionPath: "/map",
      icon: Layers,
    },
    {
      title: "TIKET GANGGUAN NOC",
      value: "2 Open",
      badgeText: "100% SLA",
      subLeft: "Kritis: 0",
      subRight: "MTTR: 42m",
      actionText: "Kelola Tiket",
      actionPath: "/issues",
      icon: Ticket,
    },
  ];

  const hourlyBars = [
    { hour: "00:00", val: 32 }, { hour: "02:00", val: 24 }, { hour: "04:00", val: 18 },
    { hour: "06:00", val: 45 }, { hour: "08:00", val: 78 }, { hour: "10:00", val: 86 },
    { hour: "12:00", val: 92 }, { hour: "14:00", val: 88 }, { hour: "16:00", val: 95 },
    { hour: "18:00", val: 98 }, { hour: "20:00", val: 100 }, { hour: "22:00", val: 76 },
  ];

  const olts = [
    { name: "OLT-POP-UTAMA-01", vendor: "ZTE C320", ip: "10.200.1.10", pon: "16 PON", load: "78%", latency: "12ms", status: "ONLINE", onUs: 420 },
    { name: "OLT-POP-BARAT-02", vendor: "Huawei MA5608T", ip: "10.200.2.10", pon: "8 PON", load: "62%", latency: "14ms", status: "ONLINE", onUs: 310 },
    { name: "OLT-POP-TIMUR-01", vendor: "VSOL V1600G", ip: "10.200.3.10", pon: "8 PON", load: "45%", latency: "19ms", status: "ONLINE", onUs: 280 },
    { name: "OLT-POP-SELATAN-01", vendor: "ZTE C300", ip: "10.200.4.10", pon: "16 PON", load: "84%", latency: "16ms", status: "ONLINE", onUs: 270 },
  ];

  const attenuationIssues = [
    { customer: "Rina Wijaya", pppoe: "rina.w@net", odp: "ODP-JKT-018", port: 7, rx: "-27.8 dBm", status: "KRITIS", cause: "Drop core macro-bending" },
    { customer: "Toko Berkah Abadi", pppoe: "berkah.abadi@corp", odp: "ODP-JKT-042", port: 2, rx: "-28.2 dBm", status: "KRITIS", cause: "Kotoran konektor SC/UPC" },
    { customer: "Hendro Kusumo", pppoe: "hendro.k@net", odp: "ODP-JKT-022", port: 4, rx: "-27.1 dBm", status: "WARNING", cause: "Jarak tarikan > 400m" },
  ];

  const recentCustomers = [
    { name: "Budi Santoso", pppoe: "budi.santoso@net", odp: "ODP-JKT-012 #3", speed: "50 Mbps", rx: "-19.4 dBm", status: "ACTIVE" },
    { name: "PT. Sumber Makmur", pppoe: "sumbermakmur@corp", odp: "ODP-JKT-004 #1", speed: "200 Mbps", rx: "-18.2 dBm", status: "ACTIVE" },
    { name: "Klinik Sehat Utama", pppoe: "klinik.sehat@corp", odp: "ODP-JKT-009 #2", speed: "100 Mbps", rx: "-19.1 dBm", status: "ACTIVE" },
    { name: "Andi Pratama", pppoe: "andi.pratama@net", odp: "ODP-JKT-031 #5", speed: "30 Mbps", rx: "-21.4 dBm", status: "ACTIVE" },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: "Portal Tenant", href: "/" },
          { label: "Dashboard Operasional" },
        ]}
        title="Ringkasan Operasional Jaringan FTTH"
        badge={
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-medium">
            GPON TELEMETRY LIVE
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: "/map" })}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Buka Web-QGIS Map</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Content Body ────────────────────────────────────────── */}
      <PageContentShell maxWidth="full" className="space-y-4 sm:space-y-5 pb-8">
        <KpiCardsGrid items={kpiStats} onNavigate={(path) => navigate({ to: path })} />
        <ThroughputAndPortCharts
          hourlyBars={hourlyBars}
          trafficFilter={trafficFilter}
          setTrafficFilter={setTrafficFilter}
        />
        <OperationsHubTable
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          olts={olts}
          attenuationIssues={attenuationIssues}
          recentCustomers={recentCustomers}
          onNavigate={(path) => navigate({ to: path })}
        />
      </PageContentShell>
    </div>
  );
}
