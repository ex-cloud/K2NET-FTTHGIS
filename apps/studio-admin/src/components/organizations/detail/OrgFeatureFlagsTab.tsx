"use client";

import { useState } from "react";
import { Badge, Button, Switch } from "@k2net/ui";
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
    <div className="space-y-6">
      {/* 1. Header with Save Action */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">B2B Module Entitlements & Feature Flags</h3>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-mono">
              {Object.values(flags).filter(Boolean).length} of 5 Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Kelola modul fitur tambahan yang dibeli oleh mitra ISP ini secara real-time.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? "Saving..." : "Save Entitlements"}</span>
        </Button>
      </div>

      {/* 2. Feature Toggles List */}
      <div className="space-y-3">
        {/* Flag 1: GIS Spatial Core */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 transition-all hover:border-primary/30">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  GIS Spatial Mapping Core
                </span>
                <Badge variant="outline" className="border-border text-[9px] font-mono">CORE</Badge>
              </div>
              <span className="text-xs text-muted-foreground block mt-0.5">
                PostGIS spatial map rendering, ODC/ODP splitters, and fiber cable route tracing.
              </span>
            </div>
          </div>
          <Switch
            checked={flags.gisCore}
            onCheckedChange={() => handleToggle("gisCore")}
          />
        </div>

        {/* Flag 2: OLT Poller Gateway */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 transition-all hover:border-primary/30">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  OLT Snmp / Ssh Poller Gateway
                </span>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">PRO / ENT</Badge>
              </div>
              <span className="text-xs text-muted-foreground block mt-0.5">
                Real-time optical telemetry, optical power level dBm monitoring, and port status tracking.
              </span>
            </div>
          </div>
          <Switch
            checked={flags.oltPoller}
            onCheckedChange={() => handleToggle("oltPoller")}
          />
        </div>

        {/* Flag 3: WhatsApp Engine */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 transition-all hover:border-primary/30">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  WhatsApp Notification & Billing Engine
                </span>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-[9px] font-mono">ADD-ON</Badge>
              </div>
              <span className="text-xs text-muted-foreground block mt-0.5">
                Automated monthly invoice reminders and optical outage alerts to subscribers.
              </span>
            </div>
          </div>
          <Switch
            checked={flags.whatsappEngine}
            onCheckedChange={() => handleToggle("whatsappEngine")}
          />
        </div>

        {/* Flag 4: AI Copilot */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 transition-all hover:border-primary/30">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  AI Automated Fiber Routing Copilot
                </span>
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 text-[9px] font-mono">PREMIUM</Badge>
              </div>
              <span className="text-xs text-muted-foreground block mt-0.5">
                AI automated cable shortest-path routing algorithm with obstacle detection.
              </span>
            </div>
          </div>
          <Switch
            checked={flags.aiCopilot}
            onCheckedChange={() => handleToggle("aiCopilot")}
          />
        </div>

        {/* Flag 5: Sandbox Mode */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 transition-all hover:border-primary/30">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Sandbox & Topology Simulation Mode
                </span>
                <Badge variant="outline" className="border-border text-[9px] font-mono">TESTING</Badge>
              </div>
              <span className="text-xs text-muted-foreground block mt-0.5">
                Isolated sandbox testing environment with simulated OLTs and test customers.
              </span>
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
