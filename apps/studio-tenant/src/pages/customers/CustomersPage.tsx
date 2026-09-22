import * as React from "react";
import {
  Users,
  Search,
  Plus,
  Activity,
  AlertTriangle,
  Wifi,
  RefreshCw,
} from "lucide-react";
import {
  Badge,
  Button,
  PageHeader,
  PageContentShell,
  cn,
} from "@k2net/ui";

interface CustomerRecord {
  id: string;
  name: string;
  pppoeUser: string;
  odpCode: string;
  portNumber: number;
  packageSpeed: string;
  rxPowerNum: number;
  rxPowerStr: string;
  status: "ACTIVE" | "ISOLIR";
  billingStatus: "PAID" | "UNPAID";
  installedAt: string;
}

export function CustomersPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"all" | "active" | "isolir" | "high_loss">("all");

  const kpis = [
    { label: "TOTAL PELANGGAN", value: "5 Akun", subtext: "100% Terverifikasi", icon: Users },
    { label: "PELANGGAN AKTIF", value: "4 Online", subtext: "80% Terhubung Normal", icon: Wifi },
    { label: "STATUS ISOLIR", value: "1 Akun", subtext: "Tunggakan Tagihan", icon: AlertTriangle },
    { label: "RATA-RATA REDAMAN", value: "-21.2 dBm", subtext: "Standar ITU-T G.984", icon: Activity },
  ];

  const customers: CustomerRecord[] = [
    {
      id: "cust-1",
      name: "Budi Santoso",
      pppoeUser: "budi.santoso@net",
      odpCode: "ODP-JKT-012",
      portNumber: 3,
      packageSpeed: "50 Mbps (Home Pro)",
      rxPowerNum: -19.4,
      rxPowerStr: "-19.4 dBm",
      status: "ACTIVE",
      billingStatus: "PAID",
      installedAt: "14 Jan 2026",
    },
    {
      id: "cust-2",
      name: "PT. Sumber Makmur",
      pppoeUser: "sumbermakmur@corp",
      odpCode: "ODP-JKT-004",
      portNumber: 1,
      packageSpeed: "200 Mbps (Dedicated)",
      rxPowerNum: -18.2,
      rxPowerStr: "-18.2 dBm",
      status: "ACTIVE",
      billingStatus: "PAID",
      installedAt: "02 Feb 2026",
    },
    {
      id: "cust-3",
      name: "Rina Wijaya",
      pppoeUser: "rina.w@net",
      odpCode: "ODP-JKT-018",
      portNumber: 7,
      packageSpeed: "30 Mbps (Lite)",
      rxPowerNum: -27.8,
      rxPowerStr: "-27.8 dBm",
      status: "ACTIVE",
      billingStatus: "PAID",
      installedAt: "19 Mar 2026",
    },
    {
      id: "cust-4",
      name: "Hendro Kusumo",
      pppoeUser: "hendro.k@net",
      odpCode: "ODP-JKT-022",
      portNumber: 4,
      packageSpeed: "50 Mbps (Home Pro)",
      rxPowerNum: -21.5,
      rxPowerStr: "-21.5 dBm",
      status: "ISOLIR",
      billingStatus: "UNPAID",
      installedAt: "10 Apr 2026",
    },
    {
      id: "cust-5",
      name: "Klinik Sehat Utama",
      pppoeUser: "klinik.sehat@corp",
      odpCode: "ODP-JKT-009",
      portNumber: 2,
      packageSpeed: "100 Mbps (Biz Fast)",
      rxPowerNum: -19.1,
      rxPowerStr: "-19.1 dBm",
      status: "ACTIVE",
      billingStatus: "PAID",
      installedAt: "05 May 2026",
    },
  ];

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.pppoeUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.odpCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === "active") return c.status === "ACTIVE";
    if (activeTab === "isolir") return c.status === "ISOLIR";
    if (activeTab === "high_loss") return c.rxPowerNum <= -27.0;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: "Portal Tenant", href: "/" },
          { label: "Data Pelanggan" },
        ]}
        title="Manajemen Pelanggan & Provisioning Layanan"
        badge={
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-medium">
            {customers.length} PELANGGAN TERDAFTAR
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md border-border text-foreground hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary" />
              <span>Sinkron Radius</span>
            </Button>
            <Button
              size="sm"
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Pelanggan</span>
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

        {/* Row 2: Customer Table Container */}
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
                Semua Pelanggan (5)
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "active"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Aktif (4)
              </button>
              <button
                onClick={() => setActiveTab("isolir")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "isolir"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Isolir (1)
              </button>
              <button
                onClick={() => setActiveTab("high_loss")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "high_loss"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Redaman Kritis (1)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, user PPPoE, ODP..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border/80 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-bold text-foreground/80">
                <tr>
                  <th className="px-4 py-3">Nama &amp; PPPoE User</th>
                  <th className="px-4 py-3">Titik ODP &amp; Port</th>
                  <th className="px-4 py-3">Paket Layanan</th>
                  <th className="px-4 py-3">Redaman Rx Optical</th>
                  <th className="px-4 py-3">Status Tagihan</th>
                  <th className="px-4 py-3">Status Layanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{cust.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{cust.pppoeUser}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{cust.odpCode}</div>
                      <div className="text-[11px] text-primary mt-0.5">Port #{cust.portNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold">
                      {cust.packageSpeed}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-bold text-xs",
                            cust.rxPowerNum <= -27.0
                              ? "text-amber-500"
                              : "text-primary"
                          )}
                        >
                          {cust.rxPowerStr}
                        </span>
                      </div>
                      <div className="w-24 bg-muted/60 h-1.5 rounded-full overflow-hidden mt-1 border border-border/40">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            cust.rxPowerNum <= -27.0 ? "bg-amber-500" : "bg-primary"
                          )}
                          style={{
                            width: `${Math.min(100, Math.max(10, ((cust.rxPowerNum + 35) / 25) * 100))}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          cust.billingStatus === "PAID"
                            ? "border-primary/40 bg-primary/10 text-primary text-[10px] font-mono"
                            : "border-destructive/40 bg-destructive/10 text-destructive text-[10px] font-mono"
                        }
                      >
                        {cust.billingStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          cust.status === "ACTIVE"
                            ? "border-primary/40 bg-primary/10 text-primary text-[10px] font-mono"
                            : "border-destructive/40 bg-destructive/10 text-destructive text-[10px] font-mono"
                        }
                      >
                        {cust.status}
                      </Badge>
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
