import { Server, Radio, Users, AlertTriangle, Activity, Zap } from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import { useNavigate } from "@tanstack/react-router";

export function DashboardPage() {
  const navigate = useNavigate();

  const stats = [
    {
      title: "OLT Online",
      value: "4 / 4",
      subtext: "Semua POP terhubung",
      icon: Server,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Kapasitas ODP",
      value: "1.420",
      subtext: "84% utilitas port FAT",
      icon: Radio,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Pelanggan Aktif",
      value: "1.280",
      subtext: "+42 instalasi baru bulan ini",
      icon: Users,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      title: "Redaman Kritis (> -27dBm)",
      value: "3",
      subtext: "Perlu pengecekan teknisi",
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card/80 p-6 shadow-xs backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Ringkasan Operasional Jaringan</h2>
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-mono text-[10px]">
              ONLINE & TERKONEKSI
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Monitoring telemetri OLT, status redaman fiber, dan alokasi port FAT secara terpadu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate({ to: "/map" })}
            className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer"
          >
            <Activity className="h-4 w-4" />
            <span>Buka Web-QGIS Map</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card/70 p-5 space-y-3 shadow-xs hover:border-border/90 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{item.title}</span>
                <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-extrabold font-mono text-foreground">{item.value}</div>
                <div className="text-[11px] text-muted-foreground">{item.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Actions & OLT Status */}
        <div className="lg:col-span-8 rounded-xl border border-border bg-card/70 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <span>Status Perangkat OLT Aktif</span>
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Poll Interval: 30s</span>
          </div>

          <div className="space-y-3">
            {[
              { name: "OLT-POP-UTAMA-01", vendor: "ZTE C320", ip: "10.200.1.10", ports: "16 PON", load: "78%", status: "UP" },
              { name: "OLT-POP-BARAT-02", vendor: "Huawei MA5608T", ip: "10.200.2.10", ports: "8 PON", load: "62%", status: "UP" },
              { name: "OLT-POP-TIMUR-01", vendor: "VSOL V1600G", ip: "10.200.3.10", ports: "8 PON", load: "45%", status: "UP" },
              { name: "OLT-POP-SELATAN-01", vendor: "ZTE C300", ip: "10.200.4.10", ports: "16 PON", load: "84%", status: "UP" },
            ].map((olt) => (
              <div
                key={olt.name}
                className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <span className="font-bold text-foreground block">{olt.name}</span>
                    <span className="text-[10px] text-muted-foreground">{olt.vendor} · {olt.ip}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-foreground block">{olt.ports}</span>
                    <span className="text-[10px] text-muted-foreground">Load: {olt.load}</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[10px]">
                    {olt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Redaman Alerts & Quick Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-border bg-card/70 p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Aksi Cepat Teknisi</span>
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/customers" })}
                className="w-full justify-start text-xs border-border hover:bg-muted/50 gap-2 cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Registrasi Pelanggan Baru</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/map" })}
                className="w-full justify-start text-xs border-border hover:bg-muted/50 gap-2 cursor-pointer"
              >
                <Radio className="h-3.5 w-3.5 text-primary" />
                <span>Simulasi Penarikan Kabel Baru</span>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Peringatan Redaman Kritis</span>
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Terdapat 3 pelanggan pada FAT-ODP-042 mengalami penurunan sinyal optik di bawah -27 dBm.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: "/map" })}
              className="w-full text-xs border-amber-500/40 bg-card hover:bg-amber-500/10 text-foreground font-semibold cursor-pointer"
            >
              Lihat di Peta GIS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
