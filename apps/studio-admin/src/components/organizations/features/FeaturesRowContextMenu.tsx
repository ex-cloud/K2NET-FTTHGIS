import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  Badge,
} from "@k2net/ui";
import {
  Sliders,
  Map,
  Radio,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Copy,
  FlaskConical,
  Network,
} from "lucide-react";
import type { EnrichedOrganization } from "../types";
import { getTenantUrl } from "@/lib/domain";
import type { FeatureFlagKey } from "./types";

interface FeaturesRowContextMenuProps {
  org: EnrichedOrganization;
  onNavigateDetail: (slug: string) => void;
  onToggleFlag: (slug: string, orgName: string, flagKey: FeatureFlagKey) => void;
  onCopy: (text: string, label: string) => void;
}

export function FeaturesRowContextMenu({
  org,
  onNavigateDetail,
  onToggleFlag,
  onCopy,
}: FeaturesRowContextMenuProps) {
  return (
    <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
      <ContextMenuItem
        onClick={() => onNavigateDetail(org.slug)}
        className="cursor-pointer font-semibold text-foreground focus:bg-accent gap-2"
      >
        <Network className="w-3.5 h-3.5 text-primary" />
        <span>Open Organization Detail</span>
        <ContextMenuShortcut>↵</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuItem
        onClick={() => window.open(getTenantUrl(org.slug), "_blank")}
        className="cursor-pointer font-medium text-primary focus:bg-primary/10 focus:text-primary gap-2"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Login as Tenant Admin</span>
        <ContextMenuShortcut>Ctrl ↵</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuSeparator className="bg-border/40 my-1" />

      <ContextMenuSub>
        <ContextMenuSubTrigger className="cursor-pointer gap-2 focus:bg-muted">
          <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Toggle Entitlements</span>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-56 bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl rounded-xl py-1">
          <ContextMenuItem
            onClick={() => onToggleFlag(org.slug, org.name, "gisCore")}
            className="cursor-pointer gap-2 justify-between"
          >
            <div className="flex items-center gap-2">
              <Map className="w-3.5 h-3.5 text-primary" />
              <span>GIS Spatial Core</span>
            </div>
            <Badge variant="outline" className="text-[9px] font-mono">
              {org.featureFlags.gisCore ? "ON" : "OFF"}
            </Badge>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => onToggleFlag(org.slug, org.name, "oltPoller")}
            className="cursor-pointer gap-2 justify-between"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span>OLT Telemetry</span>
            </div>
            <Badge variant="outline" className="text-[9px] font-mono">
              {org.featureFlags.oltPoller ? "ON" : "OFF"}
            </Badge>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => onToggleFlag(org.slug, org.name, "whatsappEngine")}
            className="cursor-pointer gap-2 justify-between"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>WhatsApp Engine</span>
            </div>
            <Badge variant="outline" className="text-[9px] font-mono">
              {org.featureFlags.whatsappEngine ? "ON" : "OFF"}
            </Badge>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => onToggleFlag(org.slug, org.name, "aiCopilot")}
            className="cursor-pointer gap-2 justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>AI Fiber Copilot</span>
            </div>
            <Badge variant="outline" className="text-[9px] font-mono">
              {org.featureFlags.aiCopilot ? "ON" : "OFF"}
            </Badge>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => onToggleFlag(org.slug, org.name, "sandboxMode")}
            className="cursor-pointer gap-2 justify-between"
          >
            <div className="flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
              <span>Sandbox Mode</span>
            </div>
            <Badge variant="outline" className="text-[9px] font-mono">
              {org.featureFlags.sandboxMode ? "ON" : "OFF"}
            </Badge>
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator className="bg-border/40 my-1" />

      <ContextMenuItem
        onClick={() => onCopy(org.slug, "Tenant Slug")}
        className="cursor-pointer gap-2 focus:bg-muted"
      >
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Copy Slug ({org.slug})</span>
        <ContextMenuShortcut>C</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuItem
        onClick={() => onCopy(getTenantUrl(org.slug), "Tenant Portal URL")}
        className="cursor-pointer gap-2 focus:bg-muted"
      >
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Copy Portal URL</span>
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
