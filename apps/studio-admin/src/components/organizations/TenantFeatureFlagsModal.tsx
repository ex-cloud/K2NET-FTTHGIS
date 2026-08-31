

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Switch,
} from "@k2net/ui";
import { Sliders, Map, Radio, MessageSquare, Sparkles, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization, OrganizationFeatureFlags } from "./types";

interface TenantFeatureFlagsModalProps {
  organization: EnrichedOrganization | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveFlags: (orgId: string, flags: OrganizationFeatureFlags) => Promise<void>;
}

export function TenantFeatureFlagsModal({
  organization,
  isOpen,
  onClose,
  onSaveFlags,
}: TenantFeatureFlagsModalProps) {
  const [flags, setFlags] = useState<OrganizationFeatureFlags>(
    organization?.featureFlags || {
      gisCore: true,
      oltPoller: true,
      whatsappEngine: true,
      aiCopilot: false,
      sandboxMode: false,
    }
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setFlags(organization.featureFlags);
    }
  }, [organization]);

  if (!organization) return null;

  const handleToggle = (key: keyof OrganizationFeatureFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveFlags(organization.id, flags);
      toast.success("Feature flags and module entitlements updated");
      onClose();
    } catch {
      toast.error("Failed to update feature flags");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-popover/95 backdrop-blur-xl border-border/80 text-foreground shadow-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-bold">
            <Sliders className="h-4 w-4" />
            <span>Module Entitlements & Feature Flags</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {organization.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enable or disable specific B2B microservices and capabilities for this tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 1. GIS Core */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Map className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  GIS Spatial Mapping Core
                </span>
                <span className="text-[10px] text-muted-foreground">
                  PostGIS map layer rendering, ODC/ODP and cable tracing
                </span>
              </div>
            </div>
            <Switch
              checked={flags.gisCore}
              onCheckedChange={() => handleToggle("gisCore")}
            />
          </div>

          {/* 2. OLT Poller Gateway */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  OLT Snmp / Ssh Poller Gateway
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Real-time optical telemetry & power level monitoring
                </span>
              </div>
            </div>
            <Switch
              checked={flags.oltPoller}
              onCheckedChange={() => handleToggle("oltPoller")}
            />
          </div>

          {/* 3. WhatsApp Notification Engine */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  WhatsApp Notification Engine
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Twilio WABA / SMS alerts for technicians and customer billing
                </span>
              </div>
            </div>
            <Switch
              checked={flags.whatsappEngine}
              onCheckedChange={() => handleToggle("whatsappEngine")}
            />
          </div>

          {/* 4. AI Copilot */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  AI Automated Fiber Routing (Premium)
                </span>
                <span className="text-[10px] text-muted-foreground">
                  RAG pgvector AI assistant for automated cable routing
                </span>
              </div>
            </div>
            <Switch
              checked={flags.aiCopilot}
              onCheckedChange={() => handleToggle("aiCopilot")}
            />
          </div>

          {/* 5. Sandbox Mode */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Sandbox Staging Environment
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Isolated testing area for technician training and data import
                </span>
              </div>
            </div>
            <Switch
              checked={flags.sandboxMode}
              onCheckedChange={() => handleToggle("sandboxMode")}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs border-border">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? "Saving..." : "Save Entitlements"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
