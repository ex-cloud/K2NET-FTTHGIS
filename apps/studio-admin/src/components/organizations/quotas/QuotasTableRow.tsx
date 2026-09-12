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
  Network,
  Sliders,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { EnrichedOrganization } from "../types";
import { cn } from "@/lib/utils";
import { getTenantUrl } from "@/lib/domain";

interface QuotasTableRowProps {
  org: EnrichedOrganization;
  onNavigateDetail: (slug: string) => void;
  onAdjustQuotas: (org: EnrichedOrganization) => void;
  onCopy: (text: string, label: string) => void;
}

export function QuotasTableRow({
  org,
  onNavigateDetail,
  onAdjustQuotas,
  onCopy,
}: QuotasTableRowProps) {
  const oltPct = org.maxOlts > 0 ? Math.round((org.usedOlts / org.maxOlts) * 100) : 0;
  const odpPct = org.maxOdps > 0 ? Math.round((org.usedOdps / org.maxOdps) * 100) : 0;
  const storagePct = org.maxStorageGb > 0 ? Math.round((org.usedStorageGb / org.maxStorageGb) * 100) : 0;

  return (
    <ContextMenu key={org.id}>
      <ContextMenuTrigger asChild>
        <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
          {/* Organization Name */}
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

          {/* Plan Tier */}
          <TableCell className="py-3.5">
            <Badge variant="outline" className="border-border font-mono text-[10px]">
              {org.planTier}
            </Badge>
          </TableCell>

          {/* OLT Allocation */}
          <TableCell className="py-3.5">
            <div className="space-y-1 w-full max-w-[150px]">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-foreground font-semibold">
                  {org.usedOlts}/{org.maxOlts} OLTs
                </span>
                <span className="text-muted-foreground">{oltPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", oltPct > 80 ? "bg-amber-500" : "bg-primary")}
                  style={{ width: `${Math.min(100, oltPct)}%` }}
                />
              </div>
            </div>
          </TableCell>

          {/* ODP Allocation */}
          <TableCell className="py-3.5">
            <div className="space-y-1 w-full max-w-[150px]">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-foreground font-semibold">
                  {org.usedOdps}/{org.maxOdps} ODPs
                </span>
                <span className="text-muted-foreground">{odpPct}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, odpPct)}%` }}
                />
              </div>
            </div>
          </TableCell>

          {/* MinIO Storage */}
          <TableCell className="py-3.5">
            <div className="space-y-1 w-full max-w-[130px]">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-foreground font-semibold">
                  {org.usedStorageGb}/{org.maxStorageGb} GB
                </span>
                <span className="text-muted-foreground">{storagePct}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, storagePct)}%` }}
                />
              </div>
            </div>
          </TableCell>

          {/* Rate Limit */}
          <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
            <span className="text-foreground font-semibold">{org.apiRateLimitMax}</span> RPM
          </TableCell>

          {/* Actions */}
          <TableCell className="py-3.5 pr-6 text-right">
            <ActionTooltip label={`Adjust quotas for ${org.name}`} shortcut="Q">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAdjustQuotas(org)}
                className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1 px-2.5 font-semibold cursor-pointer"
              >
                <Sliders className="h-3 w-3 text-primary" />
                <span>Adjust</span>
              </Button>
            </ActionTooltip>
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
        <ContextMenuItem
          onClick={() => onAdjustQuotas(org)}
          className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
        >
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <span>Adjust Hardware Quotas</span>
          <ContextMenuShortcut>Q</ContextMenuShortcut>
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
          onClick={() => window.open(getTenantUrl(org.slug), "_blank")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Login as Tenant Admin</span>
          <ContextMenuShortcut>Ctrl ↵</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border/40 my-1" />

        <ContextMenuItem
          onClick={() =>
            onCopy(
              `OLTs: ${org.usedOlts}/${org.maxOlts}, ODPs: ${org.usedOdps}/${org.maxOdps}, Storage: ${org.usedStorageGb}/${org.maxStorageGb} GB`,
              "Quota summary"
            )
          }
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Copy Quota Summary</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onCopy(org.slug, "Tenant Slug")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Copy Slug ({org.slug})</span>
          <ContextMenuShortcut>C</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
