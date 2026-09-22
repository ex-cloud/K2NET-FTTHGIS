import * as React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Search,
  Wrench,
  Zap,
  Activity,
} from "lucide-react";
import {
  Badge,
  Button,
  PageHeader,
  PageContentShell,
  cn,
} from "@k2net/ui";

interface IssueItem {
  id: string;
  ticketCode: string;
  customerName: string;
  pppoeUser: string;
  odpCode: string;
  portNumber: number;
  oltName: string;
  rxPower: string;
  rxStatus: "critical" | "warning" | "resolved";
  issueType: string;
  reportedAt: string;
  slaDeadline: string;
  technician: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
}

export function IssuesPage() {
  const [activeTab, setActiveTab] = React.useState<"all" | "critical" | "warning" | "resolved">("all");
  const [searchTerm, setSearchTerm] = React.useState("");

  const kpis = [
    { label: "TOTAL ISU AKTIF", value: "6 Kasus", subtext: "2 Kritis • 4 Degradasi", icon: AlertCircle },
    { label: "LOSS OF SIGNAL (LOS)", value: "2 Titik", subtext: "Kabel Drop Putus / Loss", icon: Zap },
    { label: "DEGRADASI REDAMAN", value: "4 Titik", subtext: "Rx > -27.0 dBm (Bending)", icon: AlertTriangle },
    { label: "MTTR RATA-RATA (24H)", value: "38 Menit", subtext: "Target SLA < 60 Menit", icon: Clock },
  ];

  const issuesList: IssueItem[] = [
    {
      id: "iss-1",
      ticketCode: "TCK-2026-0901",
      customerName: "Rina Wijaya",
      pppoeUser: "rina.w@net",
      odpCode: "ODP-JKT-018",
      portNumber: 7,
      oltName: "OLT-POP-UTAMA-01 (PON 3)",
      rxPower: "-28.4 dBm",
      rxStatus: "critical",
      issueType: "High Optical Attenuation (Bending/Dirty)",
      reportedAt: "12 mnt lalu",
      slaDeadline: "48 mnt lagi",
      technician: "Agus S. (Tim Lapangan A)",
      status: "IN_PROGRESS",
    },
    {
      id: "iss-2",
      ticketCode: "TCK-2026-0902",
      customerName: "Bambang Sudiro",
      pppoeUser: "bambang.s@net",
      odpCode: "ODP-JKT-042",
      portNumber: 2,
      oltName: "OLT-POP-SELATAN-01 (PON 1)",
      rxPower: "LOS (-∞ dBm)",
      rxStatus: "critical",
      issueType: "Fiber Cut (Loss of Signal)",
      reportedAt: "24 mnt lalu",
      slaDeadline: "36 mnt lagi",
      technician: "Rizky D. (Tim Lapangan B)",
      status: "OPEN",
    },
    {
      id: "iss-3",
      ticketCode: "TCK-2026-0899",
      customerName: "Hendro Kusumo",
      pppoeUser: "hendro.k@net",
      odpCode: "ODP-JKT-022",
      portNumber: 4,
      oltName: "OLT-POP-TIMUR-01 (PON 2)",
      rxPower: "-26.8 dBm",
      rxStatus: "warning",
      issueType: "Marginal Redaman Threshold",
      reportedAt: "45 mnt lalu",
      slaDeadline: "15 mnt lagi",
      technician: "Danang K.",
      status: "IN_PROGRESS",
    },
    {
      id: "iss-4",
      ticketCode: "TCK-2026-0897",
      customerName: "Klinik Permata",
      pppoeUser: "klinik.permata@corp",
      odpCode: "ODP-JKT-004",
      portNumber: 12,
      oltName: "OLT-POP-BARAT-02 (PON 4)",
      rxPower: "-27.1 dBm",
      rxStatus: "warning",
      issueType: "Micro-Bending Core FAT",
      reportedAt: "1 jam lalu",
      slaDeadline: "Normal",
      technician: "Faisal T.",
      status: "OPEN",
    },
    {
      id: "iss-5",
      ticketCode: "TCK-2026-0895",
      customerName: "Warung Kopi Modern",
      pppoeUser: "wakop.mod@net",
      odpCode: "ODP-JKT-012",
      portNumber: 5,
      oltName: "OLT-POP-UTAMA-01 (PON 1)",
      rxPower: "-27.9 dBm",
      rxStatus: "warning",
      issueType: "Dust Contamination Adapter SC/UPC",
      reportedAt: "2 jam lalu",
      slaDeadline: "Normal",
      technician: "Agus S.",
      status: "IN_PROGRESS",
    },
    {
      id: "iss-6",
      ticketCode: "TCK-2026-0890",
      customerName: "PT. Sarana Logistik",
      pppoeUser: "sarana.log@corp",
      odpCode: "ODP-JKT-033",
      portNumber: 1,
      oltName: "OLT-POP-BARAT-02 (PON 2)",
      rxPower: "LOS (-∞ dBm)",
      rxStatus: "critical",
      issueType: "Drop Core Broken by Tree Fall",
      reportedAt: "3 jam lalu",
      slaDeadline: "Selesai Tindakan",
      technician: "Tim Reaksi Cepat",
      status: "RESOLVED",
    },
  ];

  const filteredIssues = issuesList.filter((item) => {
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pppoeUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.odpCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "critical") return item.rxStatus === "critical" && item.status !== "RESOLVED";
    if (activeTab === "warning") return item.rxStatus === "warning" && item.status !== "RESOLVED";
    if (activeTab === "resolved") return item.status === "RESOLVED";
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: "Portal Tenant", href: "/" },
          { label: "Gangguan & Redaman" },
        ]}
        title="Monitoring Gangguan & Degradasi Redaman Optik"
        badge={
          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive font-mono text-[10px] font-medium">
            6 ISU TERDETEKSI
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md border-border text-foreground hover:bg-muted"
            >
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span>Bulk Polling OLT</span>
            </Button>
            <Button
              size="sm"
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Buat Tiket Perbaikan</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Content Body ────────────────────────────────────────── */}
      <PageContentShell maxWidth="full" className="space-y-5 pb-8">
        {/* Row 1: KPI Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span className="font-semibold text-[11px]">{k.label}</span>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-2 text-2xl font-bold font-mono text-foreground">{k.value}</div>
                <div className="mt-1 text-[11px] text-muted-foreground font-mono">{k.subtext}</div>
              </div>
            );
          })}
        </div>

        {/* Row 2: Issues Table Container */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "all"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Semua Isu (6)
              </button>
              <button
                onClick={() => setActiveTab("critical")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "critical"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Kritis LOS (2)
              </button>
              <button
                onClick={() => setActiveTab("warning")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "warning"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Degradasi Redaman (3)
              </button>
              <button
                onClick={() => setActiveTab("resolved")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "resolved"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Selesai (1)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode tiket, ODP, user..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border/80 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-bold text-foreground/80">
                <tr>
                  <th className="px-4 py-3">Tiket &amp; Pelanggan</th>
                  <th className="px-4 py-3">Titik Distribusi (ODP / Port)</th>
                  <th className="px-4 py-3">Redaman Rx Optical</th>
                  <th className="px-4 py-3">Diagnosa Isu</th>
                  <th className="px-4 py-3">Teknisi PIC</th>
                  <th className="px-4 py-3">SLA / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredIssues.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    {/* Tiket & Pelanggan */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{item.ticketCode}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {item.customerName} (<span className="text-primary">{item.pppoeUser}</span>)
                      </div>
                    </td>

                    {/* Titik Distribusi */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{item.odpCode} · Port #{item.portNumber}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{item.oltName}</div>
                    </td>

                    {/* Redaman Rx */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "font-bold text-xs",
                            item.rxStatus === "critical"
                              ? "text-destructive"
                              : item.rxStatus === "warning"
                              ? "text-amber-500"
                              : "text-primary"
                          )}
                        >
                          {item.rxPower}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {item.reportedAt}
                      </div>
                    </td>

                    {/* Diagnosa Isu */}
                    <td className="px-4 py-3">
                      <div className="text-foreground font-semibold">{item.issueType}</div>
                    </td>

                    {/* Teknisi PIC */}
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Wrench className="h-3 w-3 text-muted-foreground" />
                        <span>{item.technician}</span>
                      </div>
                    </td>

                    {/* SLA / Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono",
                            item.status === "RESOLVED"
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : item.status === "IN_PROGRESS"
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                              : "border-destructive/40 bg-destructive/10 text-destructive"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        SLA: {item.slaDeadline}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageContentShell>
    </div>
  );
}
