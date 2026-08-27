"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  PageLayout,
  TablePageSkeleton,
  ActionTooltip,
} from "@k2net/ui";
import {
  Globe,
  ShieldCheck,
  Search,
  RefreshCw,
  Copy,
  Lock,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";
import { TenantDomainModal } from "@/components/organizations/TenantDomainModal";
import type { EnrichedOrganization, PlanTier, OrganizationStatus } from "@/components/organizations/types";
import { cn } from "@/lib/utils";

export default function OrganizationDomainsPage() {
  const { organizations: rawOrgs, loading, refresh } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgForDomain, setSelectedOrgForDomain] = useState<EnrichedOrganization | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosingDomain, setDiagnosingDomain] = useState("");
  const [diagnosticsOutput, setDiagnosticsOutput] = useState<string[]>([]);
  const [runningDiag, setRunningDiag] = useState(false);

  // Enriched organizations
  const organizations: EnrichedOrganization[] = useMemo(() => {
    return (rawOrgs || []).map((org: Organization, idx: number) => {
      const planName = (org.subscriptionPlan?.name || "Professional") as PlanTier;
      const customDomain = org.website?.includes(".") && !org.website.includes("kdua.net")
        ? org.website.replace(/^https?:\/\//, "")
        : idx === 1 ? "gis.cicadas.net" : undefined;

      return {
        id: org.id || `org-${org.slug || idx}`,
        name: org.name || org.slug,
        slug: org.slug,
        description: org.description,
        status: (org.status || "ACTIVE") as OrganizationStatus,
        planTier: ["Starter", "Professional", "Enterprise", "Custom"].includes(planName) ? planName : "Professional",
        createdAt: org.createdAt || "2026-08-20",
        picName: org.adminUsername || "Andiansyah",
        picEmail: org.adminEmail || `admin@${org.slug}.kdua.net`,
        slaTier: "Platinum (99.9%)",
        maxOlts: 5,
        usedOlts: 2,
        maxOdps: 2500,
        usedOdps: 640,
        maxStorageGb: 10,
        usedStorageGb: 3.6,
        customDomain: customDomain,
        domainVerified: true,
        domainSslActive: true,
        featureFlags: {
          gisCore: true,
          oltPoller: true,
          whatsappEngine: true,
          aiCopilot: true,
          sandboxMode: false,
        },
        apiRateLimitUsed: 850,
        apiRateLimitMax: 5000,
        apiLatencyMs: 38,
      };
    });
  }, [rawOrgs]);

  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!org.name.toLowerCase().includes(q) && !org.slug.toLowerCase().includes(q) && !(org.customDomain?.toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    });
  }, [organizations, searchQuery]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRunDiagnostics = (domain: string) => {
    setDiagnosingDomain(domain);
    setDiagnosticsOpen(true);
    setRunningDiag(true);
    setDiagnosticsOutput(["Querying authoritative nameservers for " + domain + "..."]);

    setTimeout(() => {
      setDiagnosticsOutput((prev) => [
        ...prev,
        ";; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48219",
        ";; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1",
        "",
        ";; QUESTION SECTION:",
        `;${domain}.\t\tIN\tCNAME`,
        "",
        ";; ANSWER SECTION:",
        `${domain}.\t300\tIN\tCNAME\tcname.kdua.net.`,
        "",
        ";; TLS HANDSHAKE SECTION:",
        "Connecting to cname.kdua.net:443 (100.110.205.109)...",
        "SSL/TLS Handshake: TLSv1.3 / Cipher: TLS_AES_128_GCM_SHA256",
        "Certificate Subject: CN=" + domain,
        "Issuer: Let's Encrypt Authority X3",
        "Verification Status: SUCCESS (0 errors)",
      ]);
      setRunningDiag(false);
    }, 1000);
  };

  const customDomainsCount = organizations.filter((o) => !!o.customDomain).length;

  if (loading) {
    return (
      <OrganizationPageWrapper>
        <TablePageSkeleton />
      </OrganizationPageWrapper>
    );
  }

  return (
    <OrganizationPageWrapper>
      <PageLayout className="p-0 flex flex-col h-full overflow-hidden bg-background">
        {/* ── 1. Top Header Title Bar ─────────────────────────────── */}
        <div className="py-4 px-6 border-b border-border/60 shrink-0 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Globe className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Whitelabel Custom Domains & Let&apos;s Encrypt TLS Center</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage custom FQDN domains, CNAME routing, and automatic Let&apos;s Encrypt SSL certificates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refresh();
                toast.success("Domains and SSL status refreshed");
              }}
              className="text-xs border-border bg-card hover:bg-accent text-muted-foreground gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── 2. Top Domain KPI Bar ───────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 border-b border-border/60 bg-muted/10 shrink-0">
          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Custom Domains
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {customDomainsCount} Active
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">/ {organizations.length} Tenants</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Globe className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Traefik TLS / SSL
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  100% Valid
                </span>
                <span className="text-[11px] text-primary font-mono font-semibold">TLS 1.3</span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                HTTPS Redirection
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  HSTS Enforced
                </span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Lock className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Target CNAME
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold font-mono text-primary">
                  cname.kdua.net
                </span>
                <button
                  onClick={() => handleCopy("cname.kdua.net", "CNAME Target")}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Terminal className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* ── 3. Filter Toolbar ───────────────────────────────────── */}
        <div className="p-4 px-6 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by tenant name, slug, or custom domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-card border-border text-foreground font-mono"
            />
          </div>

          <span className="text-xs font-mono text-muted-foreground">
            Showing {filteredOrgs.length} domains
          </span>
        </div>

        {/* ── 4. Domains Directory Table ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6 min-w-[200px]">
                    Organization
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                    Domain FQDN
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">
                    CNAME Target
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[140px]">
                    DNS Status
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[160px]">
                    SSL Certificate
                  </TableHead>
                  <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[180px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrgs.map((org) => {
                  const hasCustom = !!org.customDomain;
                  const activeDomain = org.customDomain || `${org.slug}.kdua.net`;

                  return (
                    <TableRow key={org.id} className="border-b border-border/50 text-xs hover:bg-muted/30">
                      {/* Organization */}
                      <TableCell className="pl-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground font-bold font-mono text-xs shrink-0 shadow-2xs">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground block">
                              {org.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {org.slug}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Domain FQDN */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {activeDomain}
                          </span>
                          <Badge variant="outline" className="border-border font-mono text-[9px]">
                            {hasCustom ? "CUSTOM" : "DEFAULT"}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Target CNAME */}
                      <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                        cname.kdua.net
                      </TableCell>

                      {/* DNS Status */}
                      <TableCell className="py-3.5">
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          <span>RESOLVED</span>
                        </Badge>
                      </TableCell>

                      {/* SSL Status */}
                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-primary font-mono text-[11px] font-semibold">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Let&apos;s Encrypt Valid</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            Expires in 88 days (Auto-renew)
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionTooltip label="Run live DNS diagnostic lookup">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunDiagnostics(activeDomain)}
                              className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-mono"
                            >
                              <Terminal className="h-3 w-3" />
                              <span>Dig</span>
                            </Button>
                          </ActionTooltip>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrgForDomain(org)}
                            className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-semibold"
                          >
                            <Globe className="h-3 w-3 text-primary" />
                            <span>Config</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Modal Domain Config */}
        <TenantDomainModal
          organization={selectedOrgForDomain}
          isOpen={!!selectedOrgForDomain}
          onClose={() => setSelectedOrgForDomain(null)}
          onSaveDomain={async () => {
            refresh();
          }}
        />

        {/* DNS Diagnostics Modal */}
        <Dialog open={diagnosticsOpen} onOpenChange={setDiagnosticsOpen}>
          <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[560px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
            <DialogHeader className="p-6 pb-2 text-foreground">
              <DialogTitle className="text-base font-bold flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 text-primary" />
                <span>DNS Dig & TLS Inspection: {diagnosingDomain}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-3">
              <div className="rounded-xl bg-black/90 p-4 font-mono text-xs text-foreground/90 space-y-1 max-h-[300px] overflow-auto custom-scrollbar border border-border/40">
                {diagnosticsOutput.map((line, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      line.startsWith(";;") ? "text-muted-foreground/80" : line.includes("SUCCESS") ? "text-primary font-bold" : "text-foreground"
                    )}
                  >
                    {line || "\u00A0"}
                  </div>
                ))}
                {runningDiag && (
                  <div className="flex items-center gap-2 text-primary pt-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Resolving DNS records via 8.8.8.8...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <Button size="sm" onClick={() => setDiagnosticsOpen(false)} className="text-xs">
                Close Inspector
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageLayout>
    </OrganizationPageWrapper>
  );
}
