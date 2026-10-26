"use client";

import * as React from "react";
import {
  Inbox,
  ShieldAlert,
  Clock,
  Building2,
  KeyRound,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { PageLayout, Card, Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Link } from "@/lib/navigation-compat";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useLicenseOverview } from "@/hooks/useOrganizationLicenses";
import { useImpersonationCenter } from "@/hooks/useImpersonationCenter";
import { useTaskStore } from "@/store/task-store";

export default function InboxApprovalsPage() {
  const { t } = useTranslation();
  const { organizations, loading: loadingOrgs } = useOrganizations();
  const { data: licenseOverview, isLoading: loadingLicenses } = useLicenseOverview();
  const { stats: impersonationStats, loading: loadingImpersonation } = useImpersonationCenter();
  const unreadB2BCount = useTaskStore((state) => state.unreadB2BCount);

  const trialOrgs = React.useMemo(() => {
    if (!organizations) return [];
    return organizations.filter((o) => o.status === "TRIAL");
  }, [organizations]);

  const flaggedLicenses = React.useMemo(() => {
    if (!licenseOverview) return { expiring: 0, suspended: 0, total: 0 };
    const expiring = licenseOverview.expiringIn30Days || 0;
    const suspended = (licenseOverview.suspendedLicenses || 0) + (licenseOverview.gracePeriodLicenses || 0);
    return {
      expiring,
      suspended,
      total: expiring + suspended,
    };
  }, [licenseOverview]);

  return (
    <PageLayout variant="dashboard">
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Inbox className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {t("common.inbox_title")}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              {t("common.inbox_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[11px] px-2.5 py-0.5">
              <ShieldCheck className="w-3 h-3 mr-1 text-primary" />
              {t("common.inbox_badge_protected")}
            </Badge>
          </div>
        </div>

        {/* 4 Summary Triage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Impersonation */}
          <Card className="p-4 flex flex-col justify-between gap-3 border-border/70 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wider">
                {t("common.inbox_tab_impersonation")}
              </span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {loadingImpersonation ? "..." : impersonationStats.activeCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("common.inbox_card1_title")}
              </p>
            </div>
            <Link href="/organizations/impersonation">
              <Button size="sm" variant="outline" className="w-full text-xs justify-between">
                <span>{t("common.inbox_action_review")}</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          {/* Card 2: Trial Accounts */}
          <Card className="p-4 flex flex-col justify-between gap-3 border-border/70 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wider">
                {t("common.inbox_tab_trials")}
              </span>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {loadingOrgs ? "..." : trialOrgs.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("common.inbox_card2_desc")}
              </p>
            </div>
            <Link href="/organizations?status=TRIAL">
              <Button size="sm" variant="outline" className="w-full text-xs justify-between">
                <span>{t("common.inbox_action_view")}</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          {/* Card 3: License Flags & Kill-Switch */}
          <Card className="p-4 flex flex-col justify-between gap-3 border-border/70 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wider">
                {t("common.inbox_tab_licenses")}
              </span>
              <KeyRound className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {loadingLicenses ? "..." : flaggedLicenses.total}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("common.inbox_card3_desc", {
                  expiring: flaggedLicenses.expiring,
                  suspended: flaggedLicenses.suspended,
                })}
              </p>
            </div>
            <Link href="/licensing/revocations">
              <Button size="sm" variant="outline" className="w-full text-xs justify-between">
                <span>{t("common.inbox_action_review")}</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          {/* Card 4: B2B Escalations */}
          <Card className="p-4 flex flex-col justify-between gap-3 border-border/70 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wider">
                {t("common.inbox_tab_escalations")}
              </span>
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {unreadB2BCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("common.inbox_card4_desc")}
              </p>
            </div>
            <Link href="/support/tickets">
              <Button size="sm" variant="outline" className="w-full text-xs justify-between">
                <span>{t("common.inbox_action_view")}</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </Card>
        </div>

        {/* Actionable Triage Feeds */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
            {t("common.inbox_tab_all")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feed Item 1: Impersonation Authorization Policy */}
            <Card className="p-5 border-border/80 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                    {t("common.inbox_feed1_badge")}
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {impersonationStats.activeCount > 0
                      ? t("common.inbox_feed1_count", { count: impersonationStats.activeCount })
                      : t("common.inbox_feed1_ttl")}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("common.inbox_feed1_title")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("common.inbox_feed1_desc")}
                </p>
              </div>
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">system.support.impersonate</span>
                <Link href="/organizations/impersonation">
                  <Button size="sm" className="h-7 text-xs px-3">
                    <ExternalLink className="size-3 mr-1.5" />
                    {t("common.inbox_action_review")}
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Feed Item 2: Tenant Trial Queue */}
            <Card className="p-5 border-border/80 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                    {t("common.inbox_feed2_badge")}
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {t("common.inbox_feed2_count", { count: trialOrgs.length })}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("common.inbox_feed2_title")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("common.inbox_feed2_desc")}
                </p>
              </div>
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">system.organizations.manage</span>
                <Link href="/organizations?status=TRIAL">
                  <Button size="sm" className="h-7 text-xs px-3">
                    <ExternalLink className="size-3 mr-1.5" />
                    {t("common.inbox_action_view")}
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Feed Item 3: Licensing Integrity & Kill-Switch */}
            <Card className="p-5 border-border/80 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                    {t("common.inbox_feed3_badge")}
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {t("common.inbox_feed3_sign")}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("common.inbox_feed3_title")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("common.inbox_feed3_desc")}
                </p>
              </div>
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">licensing.killswitch</span>
                <Link href="/licensing/revocations">
                  <Button size="sm" variant="outline" className="h-7 text-xs px-3 text-destructive border-destructive/40 hover:bg-destructive/10">
                    <AlertTriangle className="size-3 mr-1.5" />
                    {t("common.inbox_action_review")}
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Feed Item 4: B2B Mitra Escalation Hub */}
            <Card className="p-5 border-border/80 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                    {t("common.inbox_feed4_badge")}
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {t("common.inbox_feed4_count", { count: unreadB2BCount })}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t("common.inbox_feed4_title")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("common.inbox_feed4_desc")}
                </p>
              </div>
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">support.tickets.view</span>
                <Link href="/support/tickets">
                  <Button size="sm" className="h-7 text-xs px-3">
                    <ExternalLink className="size-3 mr-1.5" />
                    {t("common.inbox_action_view")}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
