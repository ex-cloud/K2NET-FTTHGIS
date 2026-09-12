import {
  TableRow,
  TableCell,
  Badge,
  Button,
  Switch,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
} from "@k2net/ui";
import { ExternalLink } from "lucide-react";
import type { EnrichedOrganization } from "../types";
import { cn } from "@/lib/utils";
import type { FeatureFlagKey } from "./types";
import { FeaturesRowContextMenu } from "./FeaturesRowContextMenu";

interface FeaturesTableRowProps {
  org: EnrichedOrganization;
  onNavigateDetail: (slug: string) => void;
  onToggleFlag: (slug: string, orgName: string, flagKey: FeatureFlagKey) => void;
  onCopy: (text: string, label: string) => void;
}

function renderPlanTierBadge(planTier: string) {
  if (planTier === "Enterprise") {
    return (
      <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-400 font-mono text-[10px] font-bold tracking-wider">
        ENTERPRISE
      </Badge>
    );
  }
  if (planTier === "Professional") {
    return (
      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-bold tracking-wider">
        PROFESSIONAL
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground font-mono text-[10px] font-semibold tracking-wider">
      STARTER
    </Badge>
  );
}

interface SwitchCellProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  activeColorClass?: string;
}

function SwitchCell({ label, checked, onToggle, activeColorClass = "text-primary" }: SwitchCellProps) {
  return (
    <TableCell className="py-3.5 text-center">
      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
        <ActionTooltip label={label}>
          <Switch checked={checked} onCheckedChange={onToggle} />
        </ActionTooltip>
        <span
          className={cn(
            "text-[10px] font-mono font-bold w-6 text-left transition-colors",
            checked ? activeColorClass : "text-muted-foreground/40"
          )}
        >
          {checked ? "ON" : "OFF"}
        </span>
      </div>
    </TableCell>
  );
}

export function FeaturesTableRow({
  org,
  onNavigateDetail,
  onToggleFlag,
  onCopy,
}: FeaturesTableRowProps) {
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
                <span className="text-[10px] font-mono text-muted-foreground">{org.slug}</span>
              </div>
            </div>
          </TableCell>

          {/* Plan Tier Badge */}
          <TableCell className="py-3.5">
            {renderPlanTierBadge(org.planTier)}
          </TableCell>

          {/* Feature Switches */}
          <SwitchCell
            label={`Toggle GIS Core for ${org.name}`}
            checked={org.featureFlags.gisCore}
            onToggle={() => onToggleFlag(org.slug, org.name, "gisCore")}
            activeColorClass="text-primary"
          />

          <SwitchCell
            label={`Toggle OLT Poller for ${org.name}`}
            checked={org.featureFlags.oltPoller}
            onToggle={() => onToggleFlag(org.slug, org.name, "oltPoller")}
            activeColorClass="text-primary"
          />

          <SwitchCell
            label={`Toggle WhatsApp Engine for ${org.name}`}
            checked={org.featureFlags.whatsappEngine}
            onToggle={() => onToggleFlag(org.slug, org.name, "whatsappEngine")}
            activeColorClass="text-blue-500"
          />

          <SwitchCell
            label={`Toggle AI Copilot for ${org.name}`}
            checked={org.featureFlags.aiCopilot}
            onToggle={() => onToggleFlag(org.slug, org.name, "aiCopilot")}
            activeColorClass="text-purple-400"
          />

          <SwitchCell
            label={`Toggle Sandbox Mode for ${org.name}`}
            checked={org.featureFlags.sandboxMode}
            onToggle={() => onToggleFlag(org.slug, org.name, "sandboxMode")}
            activeColorClass="text-amber-500"
          />

          {/* Detail Link */}
          <TableCell className="py-3.5 pr-6 text-right">
            <ActionTooltip label={`Manage ${org.name} details`} shortcut="Enter">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateDetail(org.slug)}
                className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 px-2 font-semibold cursor-pointer"
              >
                <span>Manage</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </ActionTooltip>
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      <FeaturesRowContextMenu
        org={org}
        onNavigateDetail={onNavigateDetail}
        onToggleFlag={onToggleFlag}
        onCopy={onCopy}
      />
    </ContextMenu>
  );
}
