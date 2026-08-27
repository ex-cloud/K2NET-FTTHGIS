"use client";

import { Badge, Button } from "@k2net/ui";
import {
  Activity,
  Server,
  Network,
  Database,
  Users,
  CreditCard,
  CheckCircle2,
  Radio,
  ShieldCheck,
  Cpu,
  Clock,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgOverviewTabProps {
  organization: EnrichedOrganization;
  onOpenPlanUpgrade?: () => void;
}

export function OrgOverviewTab({
  organization: org,
  onOpenPlanUpgrade,
}: OrgOverviewTabProps) {
  const oltPct = org.maxOlts > 0 ? Math.round((org.usedOlts / org.maxOlts) * 100) : 0;
  const odpPct = org.maxOdps > 0 ? Math.round((org.usedOdps / org.maxOdps) * 100) : 0;
  const storagePct = org.maxStorageGb > 0 ? Math.round((org.usedStorageGb / org.maxStorageGb) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Live Health & Operational Status Banner */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Live Telemetry & Tenant Health</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-mono px-2 py-0.5">
                OPERATIONAL
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Poller engine active • Latency {org.apiLatencyMs}ms • Keycloak Realm Isolation Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-background border border-border flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Poller Cycle:</span>
            <span className="font-semibold text-foreground">4s ago</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-background border border-border flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">SLA Target:</span>
            <span className="font-semibold text-foreground">{org.slaTier}</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Capacity & Resource Usage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: OLT Capacity */}
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
              OLT Nodes
            </span>
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Network className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {org.usedOlts} <span className="text-sm font-normal text-muted-foreground">/ {org.maxOlts}</span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {oltPct}% Slot
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {org.maxOlts - org.usedOlts} slot perangkat tersedia
            </p>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-3">
              <div
                className={cn("h-full rounded-full transition-all duration-500", oltPct > 80 ? "bg-amber-500" : "bg-primary")}
                style={{ width: `${Math.min(100, oltPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: ODP Enclosures */}
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
              Mapped ODPs
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Server className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {org.usedOdps} <span className="text-sm font-normal text-muted-foreground">/ {org.maxOdps}</span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {odpPct}% Quota
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Optical Distribution Points terpetakan
            </p>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, odpPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Storage MinIO */}
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
              GIS S3 Storage
            </span>
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Database className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {org.usedStorageGb} <span className="text-sm font-normal text-muted-foreground">/ {org.maxStorageGb} GB</span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {storagePct}% Space
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Bucket MinIO terisolasi per tenant
            </p>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, storagePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: API Rate Limit */}
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
              Kong Gateway RPM
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Cpu className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {org.apiRateLimitUsed} <span className="text-sm font-normal text-muted-foreground">/ {org.apiRateLimitMax}</span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Req/Min
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Traffic rate limit batas keamanan
            </p>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (org.apiRateLimitUsed / org.apiRateLimitMax) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Subscription & Tenant Info Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Plan Card */}
        <div className="lg:col-span-1 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Subscription Tier
            </h4>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-xs font-semibold">
              {org.planTier}
            </Badge>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {org.planTier === "Enterprise" ? "Rp 12.500.000" : org.planTier === "Professional" ? "Rp 4.500.000" : "Rp 1.500.000"}
              </span>
              <span className="text-xs text-muted-foreground">/ bulan</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Paket lisensi komputasi FTTH GIS SaaS aktif untuk operasional mitra ISP.
            </p>
          </div>

          <div className="border-t border-border/50 pt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing Cycle:</span>
              <span className="font-semibold text-foreground">Tahunan (Diskon 15%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Renewal:</span>
              <span className="font-mono text-foreground">01 September 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Gateway:</span>
              <span className="text-foreground">Xendit Virtual Account</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPlanUpgrade}
              className="w-full text-xs font-semibold border-border bg-card hover:bg-accent gap-2"
            >
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>Upgrade / Ubah Paket</span>
            </Button>
          </div>
        </div>

        {/* Operational Telemetry & Activity Feed */}
        <div className="lg:col-span-2 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Audit & System Telemetry Log (Last 24 Hours)
            </h4>
            <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>Auto-refresh 30s</span>
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
              <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">SNMP Optical Poller Heartbeat</span>
                  <span className="text-[10px] font-mono text-muted-foreground">05:42 WIB</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Berhasil mengambil status 2 OLT node. 14 PON ports aktif dengan power margin rata-rata -18.4 dBm.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
              <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                <Globe className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Let&apos;s Encrypt Auto-SSL Renewal Check</span>
                  <span className="text-[10px] font-mono text-muted-foreground">02:15 WIB</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Sertifikat wildcard HTTPS Traefik valid hingga 25 November 2026.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
              <div className="h-6 w-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
                <Users className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Admin Session Login via Keycloak</span>
                  <span className="text-[10px] font-mono text-muted-foreground">Kemarin 21:04</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  User <strong className="text-foreground">{org.picName || "admin"}</strong> berhasil login ke portal tenant dari IP 180.252.110.12.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
