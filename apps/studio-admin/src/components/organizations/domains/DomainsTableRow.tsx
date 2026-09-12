import {
  TableRow,
  TableCell,
  Badge,
  Button,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import {
  Globe,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Copy,
  Network,
} from "lucide-react";
import type { EnrichedOrganization } from "../types";
import { getDefaultTenantHost, getTenantUrl } from "@/lib/domain";

interface DomainsTableRowProps {
  org: EnrichedOrganization;
  onNavigateDetail: (slug: string) => void;
  onRunDiagnostics: (domain: string) => void;
  onConfigDomain: (org: EnrichedOrganization) => void;
  onCopy: (text: string, label: string) => void;
}

export function DomainsTableRow({
  org,
  onNavigateDetail,
  onRunDiagnostics,
  onConfigDomain,
  onCopy,
}: DomainsTableRowProps) {
  const hasCustom = !!org.customDomain;
  const activeDomain = org.customDomain || getDefaultTenantHost(org.slug);

  return (
    <ContextMenu key={org.id}>
      <ContextMenuTrigger asChild>
        <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
          {/* Organization */}
          <TableCell className="pl-6 py-3.5" onClick={() => onNavigateDetail(org.slug)}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-foreground font-bold font-mono text-xs shrink-0 shadow-2xs">
                {org.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground block hover:text-primary transition-colors">
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
                  onClick={() => onRunDiagnostics(activeDomain)}
                  className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-mono cursor-pointer"
                >
                  <Terminal className="h-3 w-3" />
                  <span>Dig</span>
                </Button>
              </ActionTooltip>

              <ActionTooltip label={`Configure domain for ${org.name}`} shortcut="D">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConfigDomain(org)}
                  className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-semibold cursor-pointer"
                >
                  <Globe className="h-3 w-3 text-primary" />
                  <span>Config</span>
                </Button>
              </ActionTooltip>
            </div>
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
        <ContextMenuItem
          onClick={() => onConfigDomain(org)}
          className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
        >
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>Configure Domain &amp; SSL</span>
          <ContextMenuShortcut>D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onRunDiagnostics(activeDomain)}
          className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
        >
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Run DNS Dig Inspection</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onNavigateDetail(org.slug)}
          className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
        >
          <Network className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Open Organization Detail</span>
          <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => window.open(hasCustom ? `https://${org.customDomain}` : getTenantUrl(org.slug), "_blank")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Open Tenant Portal URL</span>
          <ContextMenuShortcut>Ctrl ↵</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border/40 my-1" />

        <ContextMenuItem
          onClick={() => onCopy("cname.kdua.net", "CNAME Target")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Copy CNAME (cname.kdua.net)</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onCopy(activeDomain, "Domain FQDN")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Copy Domain ({activeDomain})</span>
          <ContextMenuShortcut>C</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onCopy(org.slug, "Tenant Slug")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Copy Slug ({org.slug})</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
