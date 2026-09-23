import * as React from "react";
import {
  MapPin,
  HardDrive,
  MessageSquare,
  Cpu,
  TrendingUp,
  Download,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Progress,
} from "@k2net/ui";

export function UsagePage() {
  const usageMetrics = [
    {
      title: "MVT Vector Tile Requests",
      consumed: "148,200",
      limit: "500,000",
      percent: 30,
      unit: "requests/bln",
      icon: MapPin,
      status: "NORMAL",
    },
    {
      title: "OLT Poller Telemetry Cycles",
      consumed: "86,400",
      limit: "200,000",
      percent: 43,
      unit: "cycles/bln",
      icon: Cpu,
      status: "NORMAL",
    },
    {
      title: "MinIO S3 Asset Storage",
      consumed: "4.8 GB",
      limit: "20.0 GB",
      percent: 24,
      unit: "GB Terpakai",
      icon: HardDrive,
      status: "NORMAL",
    },
    {
      title: "WhatsApp & SMS Alerts Sent",
      consumed: "1,240",
      limit: "5,000",
      percent: 25,
      unit: "pesan/bln",
      icon: MessageSquare,
      status: "NORMAL",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Konsumsi Sumber Daya Organisasi"
        breadcrumbs={[
          { label: "Organisasi", href: "/projects" },
          { label: "Penggunaan & Kuota" },
        ]}
        actions={
          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1.5">
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
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {m.status}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-foreground">{m.consumed}</span>
                    <span className="text-muted-foreground">Batas Kuota: {m.limit}</span>
                  </div>
                  <Progress value={m.percent} className="h-2" />
                  <span className="text-[10px] text-muted-foreground block text-right font-mono">
                    {m.percent}% kuota terpakai bulan ini
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
                Ringkasan Siklus Penagihan Berjalan
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Periode: 01 September 2026 – 30 September 2026 (Reset otomatis setiap awal bulan)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-primary">7 Hari Tersisa</span>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 border border-border/40 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Penggunaan sumber daya organisasi berada dalam batas wajar (rata-rata 30% dari kapasitas paket PRO). Tidak diperlukan penambahan kuota saat ini.
            </span>
          </div>
        </Card>
      </PageContentShell>
    </div>
  );
}
