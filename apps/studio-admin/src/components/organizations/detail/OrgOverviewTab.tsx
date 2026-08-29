"use client";

import { Badge, Button, Card } from "@k2net/ui";
import {
  Activity,
  Server,
  Network,
  Database,
  CreditCard,
  Radio,
  ShieldCheck,
  Cpu,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenantUrl } from "@/lib/domain";
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
  const rpmPct = org.apiRateLimitMax > 0 ? Math.min(100, Math.round((org.apiRateLimitUsed / org.apiRateLimitMax) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Master Identity & Key Properties Card */}
      <Card className="p-4 md:p-5 space-y-4">
        {/* Top Identity Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold font-mono text-sm shadow-xs shrink-0">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  {org.name}
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border/60">
                  slug: {org.slug}
                </span>
                <a
                  href={getTenantUrl(org.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary flex items-center gap-1 text-[11px] text-muted-foreground hover:underline font-mono transition-colors"
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
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>{org.status}</span>
            </Badge>
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono text-[10px] font-semibold px-2 py-0.5">
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
      <div className="p-3.5 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Activity className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Live Telemetry & Tenant Health</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0.2">
                OPERATIONAL
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Poller engine active • Latency {org.apiLatencyMs}ms • Keycloak Realm Isolation Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-md bg-background border border-border flex items-center gap-1.5 text-[11px]">
            <Radio className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Poller:</span>
            <span className="font-semibold text-foreground">4s ago</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-background border border-border flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">SLA:</span>
            <span className="font-semibold text-foreground">{org.slaTier}</span>
          </div>
        </div>
      </div>

      {/* 3. Visual Capacity & Resource Usage Cards (Linear Precision Gauge) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: OLT Capacity */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              OLT Nodes
            </span>
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Network className="h-3 w-3" />
            </div>
          </div>
          
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {org.usedOlts} <span className="text-xs font-normal text-muted-foreground">/ {org.maxOlts}</span>
              </p>
              <span className="text-xs font-mono font-semibold text-primary">{oltPct}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, oltPct))}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>{org.maxOlts - org.usedOlts} slot tersedia</span>
            <span className="text-[10px] text-muted-foreground/80 font-normal">Cap: {org.maxOlts}</span>
          </div>
        </Card>

        {/* Card 2: ODP Enclosures */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Mapped ODPs
            </span>
            <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Server className="h-3 w-3" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {org.usedOdps} <span className="text-xs font-normal text-muted-foreground">/ {org.maxOdps}</span>
              </p>
              <span className="text-xs font-mono font-semibold text-blue-500">{odpPct}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
              <div 
                className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, odpPct))}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Distribution splitters</span>
            <span className="text-[10px] text-muted-foreground/80 font-normal">Cap: {org.maxOdps}</span>
          </div>
        </Card>

        {/* Card 3: Storage MinIO */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              GIS S3 Storage
            </span>
            <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Database className="h-3 w-3" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {org.usedStorageGb} <span className="text-xs font-normal text-muted-foreground">/ {org.maxStorageGb} GB</span>
              </p>
              <span className="text-xs font-mono font-semibold text-purple-500">{storagePct}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
              <div 
                className="h-full rounded-full bg-purple-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, storagePct))}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>MinIO Bucket</span>
            <span className="text-[10px] text-muted-foreground/80 font-normal">Cap: {org.maxStorageGb} GB</span>
          </div>
        </Card>

        {/* Card 4: API Rate Limit */}
        <Card glowingEffect className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Kong Gateway RPM
            </span>
            <div className="h-6 w-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Cpu className="h-3 w-3" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {org.apiRateLimitUsed} <span className="text-xs font-normal text-muted-foreground">/ {org.apiRateLimitMax}</span>
              </p>
              <span className="text-xs font-mono font-semibold text-amber-500">{rpmPct}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
              <div 
                className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, rpmPct))}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Req/Min safety</span>
            <span className="text-[10px] text-muted-foreground/80 font-normal">Cap: {org.apiRateLimitMax}</span>
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

        {/* B2B Feature Flags & Module Entitlements Engine */}
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                B2B Module Entitlements & Feature Flags
              </h4>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0.2">
                {Object.values(org.featureFlags || {}).filter(Boolean).length} of 5 Active
              </Badge>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Instant Tenant Sync
            </span>
          </div>

          <div className="space-y-2.5">
            {/* GIS Core */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Database className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">GIS Spatial Mapping Core</span>
                    <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">CORE</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    PostGIS spatial rendering, ODC/ODP splitters, dan fiber cable route tracing.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
                ENABLED
              </Badge>
            </div>

            {/* OLT Poller */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <Radio className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Dedicated SNMP OLT Poller</span>
                    <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">DAEMON</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Background SNMP daemon polling live optical RX/TX power dan ONT alarms.
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px]",
                  org.featureFlags?.oltPoller
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {org.featureFlags?.oltPoller ? "ENABLED" : "DISABLED"}
              </Badge>
            </div>

            {/* WhatsApp Engine */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">WhatsApp & SMS Gateway Engine</span>
                    <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">GATEWAY</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Notifikasi tagihan invoice otomatis, blast broadcast tiket, dan SMS OTP via port 5001.
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px]",
                  org.featureFlags?.whatsappEngine
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {org.featureFlags?.whatsappEngine ? "ENABLED" : "DISABLED"}
              </Badge>
            </div>

            {/* AI Copilot */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/50 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                  <Cpu className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">AI Fiber Copilot & Diagnostics</span>
                    <Badge variant="outline" className="border-border text-[9px] font-mono px-1 py-0">ENTERPRISE</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Analisis kerusakan kabel fiber optik otomatis dan asisten troubleshooting NOC cerdas.
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px]",
                  org.featureFlags?.aiCopilot
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {org.featureFlags?.aiCopilot ? "ENABLED" : "TIER LOCKED"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
