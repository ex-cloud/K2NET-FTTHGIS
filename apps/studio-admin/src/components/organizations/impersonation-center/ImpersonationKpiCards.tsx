import { Calendar, FileText, Clock, Building2 } from "lucide-react";
import type { ImpersonationStats } from "@/hooks/useImpersonationCenter";
import { formatDuration } from "./types";

interface ImpersonationKpiCardsProps {
  stats: ImpersonationStats;
}

export function ImpersonationKpiCards({ stats }: ImpersonationKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* Active Sessions */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Sesi Aktif Sekarang</span>
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-500">
          {stats.activeCount}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {stats.activeCount > 0 ? "Akses operasional sedang berjalan" : "Tidak ada sesi aktif"}
        </p>
      </div>

      {/* Today Sessions */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Sesi Hari Ini (24h)</span>
          <Calendar className="h-3.5 w-3.5" />
        </div>
        <div className="text-2xl font-bold font-mono text-foreground">
          {stats.todayCount}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Total permintaan bantuan
        </p>
      </div>

      {/* 7 Days Volume */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Volume 7 Hari</span>
          <FileText className="h-3.5 w-3.5" />
        </div>
        <div className="text-2xl font-bold font-mono text-foreground">
          {stats.total7dCount}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Aktivitas troubleshooting
        </p>
      </div>

      {/* Avg Duration */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Rata-rata Durasi</span>
          <Clock className="h-3.5 w-3.5" />
        </div>
        <div className="text-2xl font-bold font-mono text-foreground">
          {formatDuration(stats.avgDurationSeconds)}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Waktu penyelesaian kendala
        </p>
      </div>

      {/* Unique Tenants 7D */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="font-medium">Tenant Terbantu (7D)</span>
          <Building2 className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="text-2xl font-bold font-mono text-primary">
          {stats.uniqueTenants7dCount}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {stats.forceRevokedCount > 0 ? `${stats.forceRevokedCount} sesi diputus paksa` : "0 insiden pencabutan paksa"}
        </p>
      </div>
    </div>
  );
}
