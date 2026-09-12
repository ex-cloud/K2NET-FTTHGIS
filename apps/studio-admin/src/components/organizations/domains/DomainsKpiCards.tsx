import { Globe, Lock, ShieldCheck, Terminal, Copy } from "lucide-react";
import { Card } from "@k2net/ui";
import type { EnrichedOrganization } from "../types";

interface DomainsKpiCardsProps {
  organizations: EnrichedOrganization[];
  onCopy: (text: string, label: string) => void;
}

export function DomainsKpiCards({ organizations, onCopy }: DomainsKpiCardsProps) {
  const customDomainsCount = organizations.filter((o) => !!o.customDomain).length;

  return (
    <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Custom Domains Active */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Custom Domains Active
            </span>
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Globe className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {customDomainsCount}
              </p>
              <span className="text-xs font-mono text-primary font-semibold">100% Valid</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Whitelabel FQDNs configured</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
          </div>
        </Card>

        {/* Default Subdomains */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Default Subdomains
            </span>
            <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {organizations.length}
              </p>
              <span className="text-xs font-mono text-muted-foreground">*.kdua.net</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Wildcard DNS routed via Traefik</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </Card>

        {/* Let's Encrypt Auto-SSL */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Let&apos;s Encrypt Auto-SSL
            </span>
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                Active (TLS 1.3)
              </p>
              <span className="text-xs font-mono text-primary font-semibold">Auto-Renew</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated ACME challenge</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
          </div>
        </Card>

        {/* CNAME Ingress Target */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              CNAME Ingress Target
            </span>
            <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Terminal className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-base font-bold font-mono text-primary truncate max-w-[160px]">
                cname.kdua.net
              </p>
              <button
                onClick={() => onCopy("cname.kdua.net", "CNAME Target")}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
                title="Copy CNAME"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Global load balancer target</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
