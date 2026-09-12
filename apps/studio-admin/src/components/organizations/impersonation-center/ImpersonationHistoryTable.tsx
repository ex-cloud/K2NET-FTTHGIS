import { FileText, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
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
  PageHeaderSkeleton,
} from "@k2net/ui";
import type { ImpersonationSessionItem } from "@/hooks/useImpersonationCenter";
import { formatDuration, formatTimestamp } from "./types";

interface ImpersonationHistoryTableProps {
  historySessions: ImpersonationSessionItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  loading: boolean;
  onSelectSession: (s: ImpersonationSessionItem) => void;
}

export function getStatusBadge(status: string) {
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
}

export function ImpersonationHistoryTable({
  historySessions,
  totalElements,
  totalPages,
  page,
  setPage,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  loading,
  onSelectSession,
}: ImpersonationHistoryTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs space-y-0">
      {/* Table Filters Header */}
      <div className="p-4 border-b border-border/80 bg-muted/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">
            Riwayat &amp; Log Forensik Impersonasi ({totalElements})
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
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
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
              <TableHead className="font-semibold text-muted-foreground">Alasan &amp; Referensi</TableHead>
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
                    onClick={() => onSelectSession(s)}
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
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
              className="h-7 px-2 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-7 px-2 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
