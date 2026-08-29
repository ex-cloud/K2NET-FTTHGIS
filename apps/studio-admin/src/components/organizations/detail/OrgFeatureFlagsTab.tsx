"use client";

import { useState } from "react";
import { Badge, Button, Switch, ActionTooltip } from "@k2net/ui";
import {
  Sliders,
  Map,
  Radio,
  MessageSquare,
  Sparkles,
  FlaskConical,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization, OrganizationFeatureFlags } from "../types";

interface OrgFeatureFlagsTabProps {
  organization: EnrichedOrganization;
  onSaveFlags?: (flags: OrganizationFeatureFlags) => void;
}

export function OrgFeatureFlagsTab({
  organization: org,
  onSaveFlags,
}: OrgFeatureFlagsTabProps) {
  const [flags, setFlags] = useState<OrganizationFeatureFlags>(org.featureFlags);
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof OrganizationFeatureFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSaveFlags?.(flags);
      toast.success(`Feature flags and entitlements updated for ${org.name}`, {
        description: "Add-on permissions are now active across tenant sessions.",
      });
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with Save Action */}
      <div className="p-3.5 rounded-xl border border-border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">B2B Module Entitlements & Feature Flags</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0.2">
                {Object.values(flags).filter(Boolean).length} of 5 Active
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Kelola modul fitur tambahan yang dibeli oleh mitra ISP ini secara real-time.
            </p>
          </div>
        </div>

        <ActionTooltip label="Save updated feature flag permissions for this tenant" shortcut="S">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save Entitlements"}</span>
          </Button>
        </ActionTooltip>
      </div>

      {/* 2. Compact Feature Toggles List */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md divide-y divide-border/60 overflow-hidden shadow-2xs">
        {/* Flag 1: GIS Spatial Core */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Map className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  GIS Spatial Mapping Core
                </span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">CORE</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PostGIS spatial map rendering, ODC/ODP splitters, and fiber cable route tracing.
              </p>
            </div>
          </div>
          <Switch
            checked={flags.gisCore}
            onCheckedChange={() => handleToggle("gisCore")}
          />
        </div>

        {/* Flag 2: OLT Poller Gateway */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Radio className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  OLT SNMP / SSH Poller Gateway
                </span>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0">PRO / ENT</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Real-time optical telemetry, optical power level dBm monitoring, and port status tracking.
              </p>
            </div>
          </div>
          <Switch
            checked={flags.oltPoller}
            onCheckedChange={() => handleToggle("oltPoller")}
          />
        </div>

        {/* Flag 3: WhatsApp Engine */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  WhatsApp Notification & Billing Engine
                </span>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-[9px] font-mono px-1.5 py-0">ADD-ON</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Automated monthly invoice reminders and optical outage alerts to subscribers.
              </p>
            </div>
          </div>
          <Switch
            checked={flags.whatsappEngine}
            onCheckedChange={() => handleToggle("whatsappEngine")}
          />
        </div>

        {/* Flag 4: AI Copilot */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  AI Automated Fiber Routing Copilot
                </span>
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 text-[9px] font-mono px-1.5 py-0">PREMIUM</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                AI automated cable shortest-path routing algorithm with obstacle detection.
              </p>
            </div>
          </div>
          <Switch
            checked={flags.aiCopilot}
            onCheckedChange={() => handleToggle("aiCopilot")}
          />
        </div>

        {/* Flag 5: Sandbox Mode */}
        <div className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <FlaskConical className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Sandbox & Topology Simulation Mode
                </span>
                <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">TESTING</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Isolated sandbox testing environment with simulated OLTs and test customers.
              </p>
            </div>
          </div>
          <Switch
            checked={flags.sandboxMode}
            onCheckedChange={() => handleToggle("sandboxMode")}
          />
        </div>
      </div>
    </div>
  );
}
