import {
  Badge,
  Button,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { ShieldAlert, Search, RefreshCw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenantAuditEvent, AuditSeverity } from "./types";

interface AuditLogsTableProps {
  filteredEvents: TenantAuditEvent[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (severity: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  isRefetching: boolean;
  onRefresh: () => void;
  onInspect: (event: TenantAuditEvent) => void;
}

const CATEGORIES = ["ALL", "AUTH", "GIS_TOPOLOGY", "CONFIG", "SECURITY"] as const;
const SEVERITIES: ("ALL" | AuditSeverity)[] = ["ALL", "INFO", "WARN", "CRITICAL"];

export function AuditLogsTable({
  filteredEvents,
  searchQuery,
  setSearchQuery,
  selectedSeverity,
  setSelectedSeverity,
  selectedCategory,
  setSelectedCategory,
  isRefetching,
  onRefresh,
  onInspect,
}: AuditLogsTableProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs space-y-0">
      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Tenant Audit Events ({filteredEvents.length})
          </h4>
          <Badge variant="outline" className="border-border text-[9px] font-mono">
            gateway-audit:5009
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60 text-[10px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2 py-1 rounded-md font-medium transition-colors",
                  selectedCategory === cat
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60 text-[10px]">
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={cn(
                  "px-2 py-1 rounded-md font-medium transition-colors",
                  selectedSeverity === sev
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aksi / user..."
              className="h-7 text-xs pl-7 w-36 sm:w-44 bg-card border-border"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefetching}
            className="h-7 px-2 text-xs border-border gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-foreground">Waktu</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Aktor / User</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">IP Client</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Aksi Event</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Entitas Target</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Severity</TableHead>
            <TableHead className="text-xs font-semibold text-foreground text-right">Detail Diff</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                Tidak ada event audit yang sesuai dengan filter.
              </TableCell>
            </TableRow>
          ) : (
            filteredEvents.map((evt) => (
              <TableRow key={evt.id} className="border-border hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {evt.timestamp}
                </TableCell>
                <TableCell className="text-xs font-medium text-foreground">
                  <div>
                    <span className="font-semibold block">{evt.actorUsername}</span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-[140px]">{evt.actorEmail}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {evt.ipAddress}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-border font-mono text-[9px]">
                    {evt.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground">
                  <span className="text-muted-foreground">{evt.targetEntity}:</span> {evt.targetId}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[9px]",
                      evt.severity === "INFO" && "border-blue-500/30 bg-blue-500/10 text-blue-500",
                      evt.severity === "WARN" && "border-amber-500/30 bg-amber-500/10 text-amber-500",
                      evt.severity === "CRITICAL" && "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {evt.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInspect(evt)}
                    className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1 cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Inspect</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
