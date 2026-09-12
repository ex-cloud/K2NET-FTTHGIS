import React from "react";
import { Loader2, RefreshCw, FileCheck2, HardDrive, Cpu, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Progress, ActionTooltip } from "@k2net/ui";
import type { StorageStats } from "@/lib/actions/gateways";

interface StorageWebPOptimizerCardProps {
  stats: StorageStats | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function StorageWebPOptimizerCard({
  stats,
  loading,
  error,
  onRefresh,
}: StorageWebPOptimizerCardProps) {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            WebP Image Optimizer
          </CardTitle>
          <ActionTooltip label="Muat Ulang Statistik WebP" shortcut="R">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1"
              title="Refresh statistik"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </ActionTooltip>
        </div>
        <CardDescription className="text-[10px] text-muted-foreground">
          Layanan pemrosesan gambar mendeteksi tipe mime gambar secara otomatis, melakukan kompresi ke format WebP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error ? (
          <div className="flex items-start gap-2 text-[10px] text-amber-500/80 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Gagal memuat statistik: {error}</span>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <p className="text-[10px] text-muted-foreground/60">Memuat statistik...</p>
          </div>
        ) : stats ? (
          <>
            {/* Space saved visual progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ruang Penyimpanan Dihemat</span>
                <span className="font-semibold text-primary">
                  {stats.space_saved_percent.toFixed(1)}% Saved
                </span>
              </div>
              <Progress
                value={Math.max(0, Math.min(100, stats.space_saved_percent))}
                className="h-2 bg-muted border border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Total File Diproses</p>
                <p className="text-sm font-semibold font-mono text-foreground mt-0.5 flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-primary" />
                  {formatCount(stats.total_files)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Tingkat Kegagalan</p>
                <p
                  className={`text-sm font-semibold font-mono mt-0.5 ${
                    stats.failure_rate_percent > 1 ? "text-rose-400" : "text-primary"
                  }`}
                >
                  {stats.failure_rate_percent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Byte savings comparison card */}
            <div className="bg-muted/50 border border-border rounded-lg p-3.5 space-y-3">
              <div className="flex justify-between text-xs border-b border-border pb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" /> Ukuran Asli:
                </span>
                <span className="font-mono text-muted-foreground">{formatBytes(stats.total_original_size)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" /> Hasil WebP:
                </span>
                <span className="font-mono text-primary font-bold">{formatBytes(stats.total_compressed_size)}</span>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
