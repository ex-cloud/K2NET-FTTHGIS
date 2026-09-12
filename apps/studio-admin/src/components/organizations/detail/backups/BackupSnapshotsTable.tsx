import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  ActionTooltip,
} from "@k2net/ui";
import { Archive, FileCode, Download } from "lucide-react";
import { type TenantSnapshot, formatBackupFileSize } from "./types";

interface BackupSnapshotsTableProps {
  snapshots: TenantSnapshot[];
  onDownloadSnapshot: () => void;
}

export function BackupSnapshotsTable({
  snapshots,
  onDownloadSnapshot,
}: BackupSnapshotsTableProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs space-y-0">
      <div className="p-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            PostgreSQL / PostGIS Snapshots History ({snapshots.length})
          </h4>
        </div>
        <Badge variant="outline" className="border-border text-[9px] font-mono">
          30-DAY RETENTION
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-foreground">Nama Berkas Snapshot</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Tipe</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Ukuran</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Entitas PostGIS</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Dibuat Pada</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Status S3</TableHead>
            <TableHead className="text-xs font-semibold text-foreground text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {snapshots.map((snap) => (
            <TableRow key={snap.id} className="border-border hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-xs text-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-muted/60 border border-border flex items-center justify-center text-primary shrink-0">
                    <FileCode className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold block truncate max-w-xs">{snap.filename}</span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-xs">
                      SHA256: {snap.sha256.substring(0, 16)}...
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-border font-mono text-[9px]">
                  {snap.type}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatBackupFileSize(snap.sizeBytes)}
              </TableCell>
              <TableCell className="font-mono text-xs text-foreground">
                {snap.postgisEntityCount} nodes &amp; cables
              </TableCell>
              <TableCell className="font-mono text-[11px] text-muted-foreground">
                {snap.createdAt}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
                  {snap.minioStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <ActionTooltip label="Unduh Snapshot JSON">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDownloadSnapshot}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </ActionTooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
