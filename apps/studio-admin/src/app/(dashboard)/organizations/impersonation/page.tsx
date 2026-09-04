"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Clock,
  ExternalLink,
  Search,
  RefreshCw,
  XCircle,
  FileText,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  ShieldCheck,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { PageHeaderSkeleton } from "@k2net/ui";
import { useImpersonationCenter, type ImpersonationSessionItem } from "@/hooks/useImpersonationCenter";
import { usePermissions } from "@/hooks/use-permissions";

export default function ImpersonationCenterPage() {
  const {
    stats,
    activeSessions,
    historySessions,
    loading,
    actionLoadingId,
    page,
    setPage,
    totalPages,
    totalElements,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    refresh,
    emergencyRevoke,
    reopenPortal,
  } = useImpersonationCenter();

  const { isSuperAdmin, canAccess } = usePermissions();
  const canForceRevoke = isSuperAdmin || canAccess("system.support.impersonate.force-revoke");

  // Detail Modal State
  const [selectedSession, setSelectedSession] = useState<ImpersonationSessionItem | null>(null);

  // Revoke Confirmation State
  const [revokeTarget, setRevokeTarget] = useState<ImpersonationSessionItem | null>(null);

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatRemaining = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "0m 0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/15 text-amber-500 font-mono text-[10px] gap-1.5 px-2 py-0.5 shadow-2xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>ACTIVE</span>
          </Badge>
        );
      case "REVOKED":
        return (
          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive font-mono text-[10px] gap-1 px-2 py-0.5 font-semibold">
            <span>REVOKED</span>
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground font-mono text-[10px] gap-1 px-2 py-0.5">
            <span>EXPIRED</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border/80 bg-card/60 backdrop-blur-xs px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">
                  Support Access & Impersonation Center
                </h1>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-mono uppercase">
                  {canForceRevoke ? "God Mode Audit & Revoke" : "Read-Only Auditor Mode"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Pusat pengawasan forensik dan kontrol akses operasional darurat Super Admin ke portal tenant.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refresh()}
            disabled={loading}
            className="h-8 text-xs font-semibold gap-1.5 border-border"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* KPI Summary Cards */}
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

        {/* Live Active Sessions Monitor */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold text-foreground">
                Live Active Sessions Monitor ({activeSessions.length})
              </h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Auto-poll 15s
            </Badge>
          </div>

          {activeSessions.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Tidak ada sesi impersonasi yang sedang aktif.</p>
              <p className="text-[11px]">Semua akses operasional tenant dalam kondisi normal dan terkunci.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border text-xs">
                  <TableHead className="font-semibold text-muted-foreground">Admin Actor</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Target Tenant</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Alasan & Tiket</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Waktu Mulai</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Sisa Waktu</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right pr-5">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((s) => (
                  <TableRow key={s.id} className="border-b border-border/50 hover:bg-muted/30 text-xs">
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">{s.actorName || s.actorEmail}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{s.actorEmail}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">{s.targetOrgName}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">slug: {s.targetOrgSlug}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 max-w-xs">
                      <div className="space-y-0.5">
                        <p className="line-clamp-1 text-foreground" title={s.reason}>{s.reason}</p>
                        {s.ticketReference && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {s.ticketReference}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 font-mono text-[11px] text-muted-foreground">
                      {formatTimestamp(s.startedAt)}
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/15 text-amber-500 font-mono text-[10px] gap-1 px-2 py-0.5 font-semibold">
                        <Clock className="h-3 w-3 animate-spin" />
                        <span>{formatRemaining(s.remainingSeconds)}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-right pr-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reopenPortal(s.targetOrgSlug)}
                          className="h-7 text-xs font-semibold gap-1 border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <span>Buka Portal</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        {canForceRevoke ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRevokeTarget(s)}
                            disabled={actionLoadingId === s.id}
                            className="h-7 text-xs font-semibold gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Putus Akses</span>
                          </Button>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground/60 px-2 py-1 bg-muted/40 rounded border border-border/50">
                            Audit Only
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Audit & Forensic Log Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs space-y-0">
          {/* Table Filters Header */}
          <div className="p-4 border-b border-border/80 bg-muted/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">
                Riwayat & Log Forensik Impersonasi ({totalElements})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Cari tenant, admin, tiket, alasan..."
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
                {["ALL", "ACTIVE", "REVOKED", "EXPIRED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(0);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      statusFilter === st
                        ? "bg-card text-foreground shadow-2xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st === "ALL" ? "Semua" : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Body */}
          {loading && historySessions.length === 0 ? (
            <div className="p-6">
              <PageHeaderSkeleton />
            </div>
          ) : historySessions.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              Tidak ada data riwayat yang sesuai dengan filter pencarian.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border text-xs">
                  <TableHead className="font-semibold text-muted-foreground">Waktu Mulai</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Admin Pelaksana</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Tenant Target</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Alasan & Referensi</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Durasi</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right pr-5">Rincian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historySessions.map((s) => (
                  <TableRow key={s.id} className="border-b border-border/50 hover:bg-muted/30 text-xs">
                    <TableCell className="py-3 font-mono text-[11px] text-muted-foreground">
                      {formatTimestamp(s.startedAt)}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{s.actorName || s.actorEmail}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{s.actorEmail}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">{s.targetOrgName}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{s.targetOrgSlug}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 max-w-xs">
                      <div className="space-y-0.5">
                        <p className="line-clamp-1 text-foreground" title={s.reason}>{s.reason}</p>
                        {s.ticketReference && (
                          <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {s.ticketReference}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 font-mono text-[11px] text-muted-foreground">
                      {formatDuration(s.durationSeconds)}
                    </TableCell>

                    <TableCell className="py-3">
                      {getStatusBadge(s.status)}
                    </TableCell>

                    <TableCell className="py-3 text-right pr-5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedSession(s)}
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Lihat Audit</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Halaman <span className="font-semibold text-foreground">{page + 1}</span> dari <span className="font-semibold text-foreground">{totalPages}</span> ({totalElements} total entri)
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-7 px-2"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedSession && (
        <Dialog open={Boolean(selectedSession)} onOpenChange={() => setSelectedSession(null)}>
          <DialogContent className="max-w-lg border-border bg-card text-foreground">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <ShieldAlert className="h-5 w-5" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase">
                  Audit Record Impersonasi
                </span>
              </div>
              <DialogTitle className="text-lg font-bold">
                Detail Forensik Akses Tenant
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Rekaman audit lengkap identitas ganda (*dual-identity audit*) untuk kepatuhan hukum dan regulasi.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border/80 bg-muted/30">
                <div>
                  <span className="text-muted-foreground">Status Sesi:</span>
                  <div className="mt-1">{getStatusBadge(selectedSession.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Durasi:</span>
                  <div className="mt-1 font-mono font-bold text-foreground">
                    {formatDuration(selectedSession.durationSeconds)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Admin Pelaksana:</span>
                  <span className="font-semibold text-foreground">{selectedSession.actorEmail}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Tenant Target:</span>
                  <span className="font-semibold text-foreground">{selectedSession.targetOrgName} ({selectedSession.targetOrgSlug})</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Nomor Tiket:</span>
                  <span className="font-mono text-primary">{selectedSession.ticketReference || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Step-Up MFA Verified:</span>
                  <span className="font-mono text-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>{formatTimestamp(selectedSession.stepUpVerifiedAt)}</span>
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Waktu Mulai:</span>
                  <span className="font-mono text-foreground">{formatTimestamp(selectedSession.startedAt)}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Waktu Kedaluwarsa/Berakhir:</span>
                  <span className="font-mono text-foreground">{formatTimestamp(selectedSession.revokedAt || selectedSession.expiresAt)}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-foreground">Alasan & Dokumen Investigasi:</span>
                <div className="p-3 rounded-md bg-muted/40 border border-border text-foreground leading-relaxed">
                  {selectedSession.reason}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setSelectedSession(null)} className="text-xs">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Emergency Revoke Confirmation Modal */}
      {revokeTarget && (
        <Dialog open={Boolean(revokeTarget)} onOpenChange={() => setRevokeTarget(null)}>
          <DialogContent className="max-w-md border-border bg-card text-foreground">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive mb-1">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase">
                  Emergency Revoke
                </span>
              </div>
              <DialogTitle className="text-base font-bold">
                Putus Akses Impersonasi Darurat?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tindakan ini akan langsung mencabut token dan memutus akses sesi Super Admin ke portal <strong>{revokeTarget.targetOrgName}</strong>. Rekaman audit forensik <code className="font-mono text-destructive">IMPERSONATION_FORCE_REVOKED</code> akan dicatat.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button size="sm" variant="ghost" onClick={() => setRevokeTarget(null)} className="text-xs">
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  const target = revokeTarget;
                  setRevokeTarget(null);
                  await emergencyRevoke(target.id, target.targetOrgName);
                }}
                className="text-xs font-semibold"
              >
                Putus Akses Sekarang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
