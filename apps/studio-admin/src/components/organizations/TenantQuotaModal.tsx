"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@k2net/ui";
import { Network, Server, HardDrive, Cpu } from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization, PlanTier } from "./types";

interface TenantQuotaModalProps {
  organization: EnrichedOrganization | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveQuotas: (orgId: string, quotas: Partial<EnrichedOrganization>) => Promise<void>;
}

export function TenantQuotaModal({
  organization,
  isOpen,
  onClose,
  onSaveQuotas,
}: TenantQuotaModalProps) {
  const [planTier, setPlanTier] = useState<PlanTier>(organization?.planTier || "Professional");
  const [maxOlts, setMaxOlts] = useState(organization?.maxOlts || 5);
  const [maxOdps, setMaxOdps] = useState(organization?.maxOdps || 1000);
  const [maxStorageGb, setMaxStorageGb] = useState(organization?.maxStorageGb || 10);
  const [apiRateLimitMax, setApiRateLimitMax] = useState(organization?.apiRateLimitMax || 5000);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (organization) {
      setPlanTier(organization.planTier);
      setMaxOlts(organization.maxOlts);
      setMaxOdps(organization.maxOdps);
      setMaxStorageGb(organization.maxStorageGb);
      setApiRateLimitMax(organization.apiRateLimitMax);
    }
  }, [organization]);

  if (!organization) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveQuotas(organization.id, {
        planTier,
        maxOlts: Number(maxOlts),
        maxOdps: Number(maxOdps),
        maxStorageGb: Number(maxStorageGb),
        apiRateLimitMax: Number(apiRateLimitMax),
      });
      toast.success("Hardware capacity and quotas updated");
      onClose();
    } catch {
      toast.error("Failed to update quotas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-popover/95 backdrop-blur-xl border-border/80 text-foreground shadow-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-bold">
            <Network className="h-4 w-4" />
            <span>FTTH Hardware Capacity & Limits</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {organization.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure device caps, spatial node quotas, and edge rate-limiting for this tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Plan Tier Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Subscription Tier</Label>
            <Select value={planTier} onValueChange={(v) => setPlanTier(v as PlanTier)}>
              <SelectTrigger className="h-9 text-xs bg-card border-border text-foreground">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-xs">
                <SelectItem value="Starter">Starter Tier (Small ISP / Trial)</SelectItem>
                <SelectItem value="Professional">Professional Tier (Regional ISP)</SelectItem>
                <SelectItem value="Enterprise">Enterprise Tier (National ISP)</SelectItem>
                <SelectItem value="Custom">Custom Tier (Dedicated SLA)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Max OLTs */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Max OLT Devices</span>
              </Label>
              <Input
                type="number"
                value={maxOlts}
                onChange={(e) => setMaxOlts(Number(e.target.value))}
                className="h-9 text-xs bg-card border-border text-foreground font-mono"
              />
            </div>

            {/* Max ODP Nodes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Max ODP Nodes</span>
              </Label>
              <Input
                type="number"
                value={maxOdps}
                onChange={(e) => setMaxOdps(Number(e.target.value))}
                className="h-9 text-xs bg-card border-border text-foreground font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Storage Limit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                <span>MinIO S3 Storage (GB)</span>
              </Label>
              <Input
                type="number"
                value={maxStorageGb}
                onChange={(e) => setMaxStorageGb(Number(e.target.value))}
                className="h-9 text-xs bg-card border-border text-foreground font-mono"
              />
            </div>

            {/* API Rate Limit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Kong Rate Limit (req/m)</span>
              </Label>
              <Input
                type="number"
                value={apiRateLimitMax}
                onChange={(e) => setApiRateLimitMax(Number(e.target.value))}
                className="h-9 text-xs bg-card border-border text-foreground font-mono"
              />
            </div>
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
            {saving ? "Saving..." : "Save Quotas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
