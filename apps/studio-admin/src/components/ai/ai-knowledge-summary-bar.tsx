"use client";

import React from "react";
import { 
  Database, 
  BrainCircuit, 
  HardDrive, 
  CheckCircle2, 
  HelpCircle, 
  FolderSync 
} from "lucide-react";
import { Button, Badge } from "@k2net/ui";
import { ServerSyncStatus } from "@/lib/actions/gateways";
import { formatBytes } from "./types";

interface AiKnowledgeSummaryBarProps {
  totalCount: number;
  totalChunks: number;
  totalBytes: number;
  syncStatus?: ServerSyncStatus | null;
  isSyncing?: boolean;
  onSyncServerDocs: () => void;
  onOpenUnindexedModal: () => void;
}

export function AiKnowledgeSummaryBar({
  totalCount,
  totalChunks,
  totalBytes,
  syncStatus,
  isSyncing = false,
  onSyncServerDocs,
  onOpenUnindexedModal,
}: AiKnowledgeSummaryBarProps) {
  return (
    <div className="space-y-3">
      {/* ── Supabase-style Inline KPI Stats Summary Bar ────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/75 dark:text-muted-foreground font-medium px-1">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-primary" />
          <span className="font-bold text-foreground font-mono">{totalCount}</span>
          <span>Dokumen Terdaftar</span>
          <span title="Total berkas SOP dan dokumen panduan yang terindeks di database PostgreSQL." className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span className="font-bold text-foreground font-mono">{totalChunks}</span>
          <span>Vector Chunks</span>
          <span title="Jumlah pecahan token berdimensi 1536 yang siap dicari secara semantik." className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span className="font-bold text-foreground font-mono">{formatBytes(totalBytes)}</span>
          <span>Ukuran Disk</span>
          <span title="Total ukuran file fisik dokumen SOP." className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5 text-primary font-mono font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>HNSW 1536 dim Ready</span>
        </div>
      </div>

      {/* ── Server Files Detection Banner ──────────────────────────────────── */}
      {syncStatus && syncStatus.unindexed_count > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  Ditemukan {syncStatus.unindexed_count} berkas SOP baru di direktori server (/opt/project5/docs)
                </span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono py-0">
                  {syncStatus.unindexed_count} Belum Terindeks
                </Badge>
              </div>
              <p className="text-[11px] text-foreground/75 dark:text-muted-foreground mt-0.5">
                Ada berkas Markdown lokal di server yang belum masuk ke database pgvector. Sinkronkan agar memori AI terbarui.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenUnindexedModal}
              className="text-xs h-8 border-border text-foreground hover:bg-muted/50 cursor-pointer"
            >
              Lihat Berkas ({syncStatus.unindexed_count})
            </Button>
            <Button
              size="sm"
              onClick={onSyncServerDocs}
              disabled={isSyncing}
              className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-500 text-primary-foreground font-semibold cursor-pointer shadow-xs"
            >
              <FolderSync className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
