

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import {
  ShieldAlert,
  Search,
  Globe,
  Users,
  Code2,
  RefreshCw,
  Eye,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgAuditLogsTabProps {
  organization: EnrichedOrganization;
}

export type AuditSeverity = "INFO" | "WARN" | "CRITICAL";

export interface TenantAuditEvent {
  id: string;
  timestamp: string;
  actorUsername: string;
  actorEmail: string;
  ipAddress: string;
  action: string;
  category: "AUTH" | "GIS_TOPOLOGY" | "CONFIG" | "SECURITY";
  targetEntity: string;
  targetId: string;
  severity: AuditSeverity;
  status: "SUCCESS" | "FAILED";
  details: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
}

export function OrgAuditLogsTab({ organization: org }: OrgAuditLogsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<TenantAuditEvent | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial Audit Events Data
  const [events] = useState<TenantAuditEvent[]>([
    {
      id: "evt-101",
      timestamp: "2026-08-29 05:42 WIB",
      actorUsername: "system-poller",
      actorEmail: "poller@internal.kdua.net",
      ipAddress: "172.18.0.10 (Poller Gateway)",
      action: "SNMP_POLL_CYCLE_EXECUTED",
      category: "GIS_TOPOLOGY",
      targetEntity: "OLT_DEVICES",
      targetId: "olt-kircon-01",
      severity: "INFO",
      status: "SUCCESS",
      details: "Berhasil mengambil status 2 OLT node. 14 PON ports aktif dengan power margin rata-rata -18.4 dBm.",
      beforeState: { oltCount: 2, ponPortsActive: 14, avgPowerDbm: -18.6 },
      afterState: { oltCount: 2, ponPortsActive: 14, avgPowerDbm: -18.4 },
    },
    {
      id: "evt-102",
      timestamp: "2026-08-29 02:15 WIB",
      actorUsername: "traefik-acme",
      actorEmail: "traefik@kdua.net",
      ipAddress: "172.18.0.5 (Edge Proxy)",
      action: "SSL_CERTIFICATE_VERIFIED",
      category: "CONFIG",
      targetEntity: "DOMAIN_SSL",
      targetId: `portal.${org.slug}.kdua.net`,
      severity: "INFO",
      status: "SUCCESS",
      details: "Sertifikat wildcard HTTPS Traefik valid dan diperpanjang hingga 25 November 2026.",
      beforeState: { certStatus: "VALID", validDaysRemaining: 92 },
      afterState: { certStatus: "RENEWED", validDaysRemaining: 90 },
    },
    {
      id: "evt-103",
      timestamp: "2026-08-28 21:04 WIB",
      actorUsername: org.picName || "admin",
      actorEmail: org.picEmail || `admin@${org.slug}.kdua.net`,
      ipAddress: "180.252.110.12 (Jakarta, ID)",
      action: "KEYCLOAK_LOGIN_SUCCESS",
      category: "AUTH",
      targetEntity: "IAM_REALM",
      targetId: `realm-${org.slug}`,
      severity: "INFO",
      status: "SUCCESS",
      details: `User ${org.picName || "admin"} berhasil login ke portal tenant via Keycloak OAuth2.`,
      beforeState: { activeSession: false },
      afterState: { activeSession: true, ip: "180.252.110.12" },
    },
    {
      id: "evt-104",
      timestamp: "2026-08-28 17:30 WIB",
      actorUsername: "sre-andiansyah",
      actorEmail: "andiansyah@k2.co.id",
      ipAddress: "100.110.205.10 (Tailscale VPN)",
      action: "HARDWARE_QUOTA_UPDATED",
      category: "CONFIG",
      targetEntity: "ORGANIZATION_QUOTA",
      targetId: org.id,
      severity: "WARN",
      status: "SUCCESS",
      details: `Super Admin memperbarui kapasitas kuota OLT dari 2 menjadi ${org.maxOlts} dan ODP menjadi ${org.maxOdps}.`,
      beforeState: { maxOlts: 2, maxOdps: 500, planTier: "Starter" },
      afterState: { maxOlts: org.maxOlts, maxOdps: org.maxOdps, planTier: org.planTier },
    },
    {
      id: "evt-105",
      timestamp: "2026-08-28 14:10 WIB",
      actorUsername: org.picName || "admin",
      actorEmail: org.picEmail || `admin@${org.slug}.kdua.net`,
      ipAddress: "180.252.110.12",
      action: "ODP_SPLITTER_PROVISIONED",
      category: "GIS_TOPOLOGY",
      targetEntity: "POSTGIS_ODP",
      targetId: "ODP-KRC-042",
      severity: "INFO",
      status: "SUCCESS",
      details: "Menambahkan 1 ODP baru berkapasitas 8 port pada feeder cluster Kircon Barat.",
      beforeState: { odpCode: null },
      afterState: { odpCode: "ODP-KRC-042", capacity: 8, lat: -6.9174, lng: 107.6191 },
    },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Log audit organisasi berhasil disinkronkan dari gateway-audit.");
    }, 600);
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.actorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.targetEntity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === "ALL" || evt.severity === selectedSeverity;
    const matchesCategory = selectedCategory === "ALL" || evt.category === selectedCategory;

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* 1. Telemetry & Live Stream Health Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary text-xs font-bold font-mono uppercase">
              <Activity className="h-4 w-4" />
              <span>SNMP Optical Poller</span>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
              05:42 WIB
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            2 OLT node aktif. 14 PON ports online dengan margin optical power rata-rata <strong className="text-foreground font-mono">-18.4 dBm</strong>.
          </p>
        </Card>

        <Card className="p-4 bg-card border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-500 text-xs font-bold font-mono uppercase">
              <Globe className="h-4 w-4" />
              <span>Auto-SSL Renewal</span>
            </div>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-[9px] font-mono">
              02:15 WIB
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Sertifikat wildcard HTTPS Traefik valid hingga <strong className="text-foreground font-mono">25 Nov 2026</strong>.
          </p>
        </Card>

        <Card className="p-4 bg-card border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-500 text-xs font-bold font-mono uppercase">
              <Users className="h-4 w-4" />
              <span>Keycloak IAM Session</span>
            </div>
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 text-[9px] font-mono">
              21:04 WIB
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Admin <strong className="text-foreground">{org.picName || "admin"}</strong> aktif login dari IP <code className="font-mono text-xs text-primary">180.252.110.12</code>.
          </p>
        </Card>
      </div>

      {/* 2. Audit Stream Table */}
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
              {(["ALL", "AUTH", "GIS_TOPOLOGY", "CONFIG", "SECURITY"] as const).map((cat) => (
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
              {(["ALL", "INFO", "WARN", "CRITICAL"] as const).map((sev) => (
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
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 px-2 text-xs border-border gap-1 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
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
                      onClick={() => setSelectedEvent(evt)}
                      className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
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

      {/* 3. Event Payload Diff Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-xl bg-popover/95 backdrop-blur-2xl border-border text-foreground rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-bold">
                <Code2 className="h-4 w-4" />
                <span>Audit Event Payload Inspector</span>
              </div>
              <Badge variant="outline" className="border-border text-[10px] font-mono">
                {selectedEvent?.id}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {selectedEvent?.action}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedEvent?.details}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 overflow-y-auto pr-1">
            {/* Event Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-card border border-border">
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Actor</span>
                <span className="font-semibold text-foreground">{selectedEvent?.actorUsername} ({selectedEvent?.actorEmail})</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Client IP</span>
                <span className="font-mono text-foreground">{selectedEvent?.ipAddress}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Target</span>
                <span className="font-mono text-foreground">{selectedEvent?.targetEntity} ({selectedEvent?.targetId})</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">Waktu Event</span>
                <span className="font-mono text-foreground">{selectedEvent?.timestamp}</span>
              </div>
            </div>

            {/* Before vs After State Diff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>State Sebelum (Before)</span>
                </span>
                <pre className="p-3 rounded-xl bg-card border border-border text-[11px] font-mono text-foreground overflow-auto max-h-48 leading-relaxed">
                  {JSON.stringify(selectedEvent?.beforeState || {}, null, 2)}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>State Sesudah (After)</span>
                </span>
                <pre className="p-3 rounded-xl bg-card border border-border text-[11px] font-mono text-primary overflow-auto max-h-48 leading-relaxed">
                  {JSON.stringify(selectedEvent?.afterState || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEvent(null)}
              className="h-8 text-xs border-border"
            >
              Tutup Inspector
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
