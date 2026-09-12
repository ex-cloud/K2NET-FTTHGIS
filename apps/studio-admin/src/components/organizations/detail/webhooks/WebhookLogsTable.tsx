import {
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { Activity } from "lucide-react";
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
          AUTO-RETRY ACTIVE
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-foreground">Waktu</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Event Name</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Target URL</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">HTTP Status</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Latency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveryLogs.map((log) => (
            <TableRow key={log.id} className="border-border hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                {log.timestamp}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-border font-mono text-[9px]">
                  {log.event}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-foreground truncate max-w-xs">
                {log.targetUrl}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[9px]",
                    log.status === 200
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  )}
                >
                  {log.status} OK
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {log.latencyMs} ms
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
