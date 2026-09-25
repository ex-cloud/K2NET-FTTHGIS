import * as React from "react";
import { MessageSquare } from "lucide-react";

interface TenantMobileTasksTabProps {
  onNavigate: (href: string) => void;
  onClose: () => void;
  projectId?: string;
}

export function TenantMobileTasksTab({
  onNavigate,
  onClose,
  projectId = "proj-bdg-01",
}: TenantMobileTasksTabProps) {
  const alerts = [
    {
      id: "TKT-001",
      title: "Redaman Tinggi ODP-BDG-04",
      desc: "Rx -28.4 dBm terdeteksi pada segmen Arcamanik",
      time: "10m lalu",
      severity: "high",
      href: `/project/${projectId}/issues/tickets`,
    },
    {
      id: "TKT-002",
      title: "Jadwal Pemeliharaan ODC Buahbatu",
      desc: "Splicing kabel feeder 24 core",
      time: "1j lalu",
      severity: "medium",
      href: `/project/${projectId}/issues/tickets`,
    },
    {
      id: "TKT-003",
      title: "Registrasi Pelanggan Baru PPPoE",
      desc: "5 pelanggan baru menunggu aktivasi ONU",
      time: "2j lalu",
      severity: "low",
      href: `/project/${projectId}/subscribers/list`,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Aktivitas & Notifikasi Operasional</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          3 Aktif
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {alerts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onNavigate(item.href);
              onClose();
            }}
            className="flex flex-col text-left w-full p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-primary">{item.id}</span>
              <span className="text-[10px] text-muted-foreground">{item.time}</span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-tight">{item.title}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
