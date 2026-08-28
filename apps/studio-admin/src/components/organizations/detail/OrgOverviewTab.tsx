"use client";

import { Badge, Button, Card } from "@k2net/ui";
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
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenantUrl } from "@/lib/domain";
import type { EnrichedOrganization } from "../types";

interface OrgOverviewTabProps {
  organization: EnrichedOrganization;
  onOpenPlanUpgrade?: () => void;
}

function RadialProgressGauge({
  percentage,
  strokeColor,
  size = 54,
  strokeWidth = 5,
}: {
  percentage: number;
  strokeColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn("transition-all duration-700 ease-out", strokeColor)}
          fill="transparent"
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-bold text-foreground">
        {clamped}%
      </span>
    </div>
  );
}

export function OrgOverviewTab({
  organization: org,
  onOpenPlanUpgrade,
}: OrgOverviewTabProps) {
  const oltPct = org.maxOlts > 0 ? Math.round((org.usedOlts / org.maxOlts) * 100) : 0;
  const odpPct = org.maxOdps > 0 ? Math.round((org.usedOdps / org.maxOdps) * 100) : 0;
  const storagePct = org.maxStorageGb > 0 ? Math.round((org.usedStorageGb / org.maxStorageGb) * 100) : 0;
  const rpmPct = org.apiRateLimitMax > 0 ? Math.min(100, Math.round((org.apiRateLimitUsed / org.apiRateLimitMax) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Master Identity & Key Properties Card */}
      <Card className="p-5 space-y-4">
        {/* Top Identity Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono text-base shadow-xs">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold tracking-tight text-foreground">
                  {org.name}
                </h1>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border/60">
                  slug: {org.slug}
                </span>
                <a
                  href={getTenantUrl(org.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary flex items-center gap-1 text-[11px] text-muted-foreground/80 font-mono underline"
                >
                  <span>subdomain portal</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                {org.description || "Enterprise FTTH ISP Tenant Environment"}
              </p>
            </div>
          </div>

          {/* Status & Plan Badges */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-xs gap-1.5 px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>{org.status}</span>
            </Badge>
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono text-xs font-semibold px-2.5 py-1">
              {org.planTier} PLAN
            </Badge>
          </div>
        </div>

        {/* Key Properties Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-border/50 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">Lead PIC</span>
            <span className="font-semibold text-foreground truncate block">{org.picName}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">SLA Support</span>
            <span className="font-semibold text-primary block">{org.slaTier}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">Hardware Slots</span>
            <span className="font-mono text-foreground block">{org.usedOlts}/{org.maxOlts} OLTs</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">ODP Quota</span>
            <span className="font-mono text-foreground block">{org.usedOdps}/{org.maxOdps}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">MinIO Storage</span>
            <span className="font-mono text-foreground block">{org.usedStorageGb}/{org.maxStorageGb} GB</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-foreground/75 dark:text-muted-foreground font-semibold block">API Latency</span>
            <span className="font-mono text-primary block">{org.apiLatencyMs} ms</span>
          </div>
        </div>
      </Card>

      {/* 2. Live Health & Operational Status Banner */}
      <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
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

      {/* 2. Visual Capacity & Resource Usage Cards (Radial Gauge) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: OLT Capacity */}
        <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              OLT Nodes
            </span>
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Network className="h-3.5 w-3.5" />
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {org.usedOlts} <span className="text-sm font-normal text-muted-foreground">/ {org.maxOlts}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {org.maxOlts - org.usedOlts} slot perangkat tersedia
              </p>
            </div>
            <RadialProgressGauge
              percentage={oltPct}
              strokeColor={oltPct > 80 ? "text-amber-500" : "text-primary"}
            />
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Hardware Utilization</span>
            <span className="font-semibold text-foreground">{oltPct}%</span>
          </div>
        </Card>

        {/* Card 2: ODP Enclosures */}
        <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              Mapped ODPs
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Server className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {org.usedOdps} <span className="text-sm font-normal text-muted-foreground">/ {org.maxOdps}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Distribution enclosures
              </p>
            </div>
            <RadialProgressGauge
              percentage={odpPct}
              strokeColor="text-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Spatial Quota</span>
            <span className="font-semibold text-foreground">{odpPct}%</span>
          </div>
        </Card>

        {/* Card 3: Storage MinIO */}
        <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              GIS S3 Storage
            </span>
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Database className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {org.usedStorageGb} <span className="text-sm font-normal text-muted-foreground">/ {org.maxStorageGb} GB</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                MinIO Bucket terisolasi
              </p>
            </div>
            <RadialProgressGauge
              percentage={storagePct}
              strokeColor="text-purple-500"
            />
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Bucket Capacity</span>
            <span className="font-semibold text-foreground">{storagePct}%</span>
          </div>
        </Card>

        {/* Card 4: API Rate Limit */}
        <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
              Kong Gateway RPM
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Cpu className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {org.apiRateLimitUsed} <span className="text-sm font-normal text-muted-foreground">/ {org.apiRateLimitMax}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Req/Min rate safety
              </p>
            </div>
            <RadialProgressGauge
              percentage={rpmPct}
              strokeColor="text-amber-500"
            />
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Throughput Traffic</span>
            <span className="font-semibold text-foreground">{rpmPct}%</span>
          </div>
        </Card>
      </div>

      {/* 3. Subscription & Tenant Info Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Plan Card */}
        <Card className="lg:col-span-1 p-5 space-y-4">
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
        </Card>

        {/* Operational Telemetry & Activity Feed */}
        <Card className="lg:col-span-2 p-5 space-y-4">
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
        </Card>
      </div>
    </div>
  );
}
