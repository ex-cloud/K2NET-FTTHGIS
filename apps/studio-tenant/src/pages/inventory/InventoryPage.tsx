import * as React from "react";
import {
  Server,
  Radio,
  Layers,
  Search,
  Cpu,
  MapPin,
  ArrowRight,
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

export function InventoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<"olts" | "odcs" | "odps">("olts");
  const [searchTerm, setSearchTerm] = React.useState("");

  const kpis = [
    { label: "TOTAL PERANGKAT OLT", value: "4 Unit", subLeft: "Online: 4/4", subRight: "100% UP", icon: Server, action: "Inventaris OLT", path: "/inventory" },
    { label: "PORT PON AKTIF", value: "48 Ports", subLeft: "Terpakai: 32", subRight: "68% Utilisasi", icon: Cpu, action: "Detail Port", path: "/inventory" },
    { label: "ODC DISTRIBUSI", value: "38 Box", subLeft: "Active: 37", subRight: "1 Warning", icon: Layers, action: "Sebaran ODC", path: "/inventory" },
    { label: "ODP (FAT) BOX", value: "212 Box", subLeft: "Terpakai: 84%", subRight: "1.420 Kapasitas", icon: Radio, action: "Sebaran ODP", path: "/inventory" },
  ];

  const olts = [
    { name: "OLT-POP-UTAMA-01", vendor: "ZTE C320", ip: "10.200.1.10", pon: "16 PON", load: "78%", location: "POP Data Center Pusat", status: "ONLINE", onUs: 420 },
    { name: "OLT-POP-BARAT-02", vendor: "Huawei MA5608T", ip: "10.200.2.10", pon: "8 PON", load: "62%", location: "POP Sentral Barat", status: "ONLINE", onUs: 310 },
    { name: "OLT-POP-TIMUR-01", vendor: "VSOL V1600G", ip: "10.200.3.10", pon: "8 PON", load: "45%", location: "POP Distribusi Timur", status: "ONLINE", onUs: 280 },
    { name: "OLT-POP-SELATAN-01", vendor: "ZTE C300", ip: "10.200.4.10", pon: "16 PON", load: "84%", location: "POP Sub-stasiun Selatan", status: "ONLINE", onUs: 270 },
  ];

  const odcs = [
    { code: "ODC-JKT-001", capacity: "144 Core", used: "96 Core", ratio: "1:8 FBT", area: "Jl. Sudirman Blok A", status: "NORMAL" },
    { code: "ODC-JKT-002", capacity: "144 Core", used: "112 Core", ratio: "1:8 FBT", area: "Jl. Thamrin Timur", status: "NORMAL" },
    { code: "ODC-JKT-003", capacity: "96 Core", used: "64 Core", ratio: "1:8 FBT", area: "Kawasan Industri Pulo", status: "NORMAL" },
    { code: "ODC-JKT-004", capacity: "144 Core", used: "128 Core", ratio: "1:8 FBT", area: "Perumahan Hijau Asri", status: "WARNING" },
  ];

  const odps = [
    { code: "ODP-JKT-012", type: "FAT Pole 8-Port", ports: "7/8 Terisi", odc: "ODC-JKT-001", rxAvg: "-19.8 dBm", status: "ACTIVE" },
    { code: "ODP-JKT-018", type: "FAT Pole 8-Port", ports: "8/8 Penuh", odc: "ODC-JKT-001", rxAvg: "-24.2 dBm", status: "FULL" },
    { code: "ODP-JKT-004", type: "FAT Wall 16-Port", ports: "14/16 Terisi", odc: "ODC-JKT-002", rxAvg: "-18.6 dBm", status: "ACTIVE" },
    { code: "ODP-JKT-022", type: "FAT Pole 8-Port", ports: "5/8 Terisi", odc: "ODC-JKT-003", rxAvg: "-21.1 dBm", status: "ACTIVE" },
    { code: "ODP-JKT-042", type: "FAT Pole 8-Port", ports: "6/8 Terisi", odc: "ODC-JKT-004", rxAvg: "-27.8 dBm", status: "CRITICAL" },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Portal Tenant", href: "/" },
          { label: "Inventaris Jaringan" },
        ]}
        title="Manajemen Inventaris Fisik & Port FTTH"
        badge={
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-medium">
            254 ASSET UNITS
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate({ to: "/map" })}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer rounded-md border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Plot di Peta GIS</span>
            </Button>
          </div>
        }
      />

      <PageContentShell maxWidth="full" className="space-y-4 sm:space-y-5 pb-8">
        {/* Row 1: KPI Stats — 1:1 with studio-admin OverviewMetricCard */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card
                key={k.label}
                glowingEffect
                className="flex flex-col justify-between transition-all duration-200 p-0"
              >
                <div className="p-3.5 sm:p-4 pb-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] sm:text-xs uppercase font-semibold tracking-wider text-muted-foreground/90 truncate">
                      {k.label}
                    </span>
                    <div className="p-1 sm:p-1.5 rounded-lg bg-muted/40 border border-border/40 text-muted-foreground/80 shrink-0">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {k.value}
                  </div>
                </div>

                <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground font-medium">
                    <span className="truncate min-w-0 font-mono">{k.subLeft}</span>
                    <span className="shrink-0 ml-2 font-mono">{k.subRight}</span>
                  </div>
                  <div className="pt-2 border-groove-t flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
                    <span className="truncate mr-1 text-muted-foreground/70">
                      Operasional
                    </span>
                    <button
                      onClick={() => navigate({ to: k.path })}
                      className="flex items-center gap-1 transition-colors shrink-0 ml-auto font-medium text-foreground/85 hover:text-primary cursor-pointer"
                    >
                      <span>{k.action}</span>
                      <ArrowRight className="h-3 w-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Row 2: Inventory Table Section */}
        <Card glowingEffect className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            {/* Tabs */}
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
                Perangkat OLT POP (4)
              </button>
              <button
                onClick={() => setActiveTab("odcs")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "odcs"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                ODC Closures (38)
              </button>
              <button
                onClick={() => setActiveTab("odps")}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs",
                  activeTab === "odps"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                ODP FAT Boxes (212)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode atau lokasi..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* OLT Table */}
          {activeTab === "olts" && (
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nama OLT &amp; Code</th>
                    <th className="px-4 py-3">Vendor &amp; Type</th>
                    <th className="px-4 py-3">IP Gateway</th>
                    <th className="px-4 py-3">Kapasitas PON</th>
                    <th className="px-4 py-3">Lokasi Fisik</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {olts.map((item) => (
                    <tr key={item.name} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span>{item.name}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.vendor}</td>
                      <td className="px-4 py-3 font-mono text-primary">{item.ip}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{item.pon} <span className="text-muted-foreground">({item.onUs} ONU)</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{item.location}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono">
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ODC Table */}
          {activeTab === "odcs" && (
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Kode ODC</th>
                    <th className="px-4 py-3">Kapasitas Core</th>
                    <th className="px-4 py-3">Core Terpakai</th>
                    <th className="px-4 py-3">Splitter Ratio</th>
                    <th className="px-4 py-3">Wilayah Sebaran</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {odcs.map((item) => (
                    <tr key={item.code} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-primary">{item.code}</td>
                      <td className="px-4 py-3 text-foreground font-mono">{item.capacity}</td>
                      <td className="px-4 py-3 font-mono text-foreground font-semibold">{item.used}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">{item.ratio}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.area}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            item.status === "NORMAL"
                              ? "border-primary/40 bg-primary/10 text-primary text-[10px] font-mono"
                              : "border-amber-500/40 bg-amber-500/10 text-amber-500 text-[10px] font-mono"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ODP Table */}
          {activeTab === "odps" && (
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Kode ODP</th>
                    <th className="px-4 py-3">Tipe Box &amp; Port</th>
                    <th className="px-4 py-3">Okupansi Port</th>
                    <th className="px-4 py-3">Induk ODC</th>
                    <th className="px-4 py-3">Avg Rx Power</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {odps.map((item) => (
                    <tr key={item.code} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-primary">{item.code}</td>
                      <td className="px-4 py-3 text-foreground">{item.type}</td>
                      <td className="px-4 py-3 font-mono text-foreground font-semibold">{item.ports}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">{item.odc}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-foreground">{item.rxAvg}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            item.status === "ACTIVE"
                              ? "border-primary/40 bg-primary/10 text-primary text-[10px] font-mono"
                              : item.status === "FULL"
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-500 text-[10px] font-mono"
                              : "border-destructive/40 bg-destructive/10 text-destructive text-[10px] font-mono"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageContentShell>
    </div>
  );
}
