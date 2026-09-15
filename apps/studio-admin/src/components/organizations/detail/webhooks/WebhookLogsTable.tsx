import {
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { Activity, ShieldAlert, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebhookDeliveryLog } from "./types";

interface WebhookLogsTableProps {
  deliveryLogs: WebhookDeliveryLog[];
}

export function WebhookLogsTable({ deliveryLogs }: WebhookLogsTableProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs space-y-0">
      <div className="p-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Recent Webhook Delivery Logs ({deliveryLogs.length})
          </h4>
        </div>
        <Badge variant="outline" className="border-border text-[9px] font-mono">
          PERSISTED IN DATABASE
        </Badge>
      </div>

      {deliveryLogs.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-muted/50 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-foreground">Belum ada riwayat pengiriman webhook.</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            Klik tombol &ldquo;Test Ping Webhook&rdquo; di atas untuk menguji koneksi HTTPS endpoint NOC tenant Anda.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-foreground">Waktu</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Event Name</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Target URL</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">HTTP Status</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Latency</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Detail Respon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveryLogs.map((log) => {
              const isSuccess = log.status >= 200 && log.status < 300;
              const isBlockedOrError = log.status === 0 || log.status >= 400;

              return (
                <TableRow key={log.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border font-mono text-[9px]">
                      {log.event}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground truncate max-w-xs" title={log.targetUrl}>
                    {log.targetUrl}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-[9px] gap-1",
                        isSuccess
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : log.status === 0
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      )}
                    >
                      {isSuccess ? (
                        <CheckCircle className="h-2.5 w-2.5" />
                      ) : log.status === 0 ? (
                        <ShieldAlert className="h-2.5 w-2.5" />
                      ) : (
                        <AlertCircle className="h-2.5 w-2.5" />
                      )}
                      <span>
                        {log.status === 0
                          ? "BLOCKED / FAILED"
                          : `${log.status} ${isSuccess ? "OK" : "ERROR"}`}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {log.latencyMs} ms
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
                    {log.errorMessage ? (
                      <span className="text-destructive">{log.errorMessage}</span>
                    ) : log.responseBody ? (
                      <span title={log.responseBody}>{log.responseBody}</span>
                    ) : (
                      <span className="text-muted-foreground/60">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
