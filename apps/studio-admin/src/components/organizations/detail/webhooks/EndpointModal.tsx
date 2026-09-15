import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Input,
  Label,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { Network, CheckCircle2 } from "lucide-react";
import type { WebhookEndpoint, WebhookSubscriptions } from "./types";

interface EndpointModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEndpoint: WebhookEndpoint | null;
  onSubmit: (data: {
    name: string;
    targetUrl: string;
    description: string;
    subscribedEvents: WebhookSubscriptions;
    isActive: boolean;
  }) => Promise<void>;
}

export function EndpointModal({
  isOpen,
  onOpenChange,
  editingEndpoint,
  onSubmit,
}: EndpointModalProps) {
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [subscribedEvents, setSubscribedEvents] = useState<WebhookSubscriptions>({
    fiberCut: true,
    oltDown: true,
    odpFull: false,
    quotaAlert: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEndpoint) {
      setName(editingEndpoint.name);
      setTargetUrl(editingEndpoint.targetUrl);
      setDescription(editingEndpoint.description || "");
      setIsActive(editingEndpoint.isActive);
      setSubscribedEvents(editingEndpoint.subscribedEvents);
    } else {
      setName("");
      setTargetUrl("");
      setDescription("");
      setIsActive(true);
      setSubscribedEvents({
        fiberCut: true,
        oltDown: true,
        odpFull: false,
        quotaAlert: false,
      });
    }
  }, [editingEndpoint, isOpen]);

  const handleFormSubmit = async () => {
    if (!name.trim() || !targetUrl.trim()) return;
    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        targetUrl: targetUrl.trim(),
        description: description.trim(),
        subscribedEvents,
        isActive,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border shadow-lg p-6 space-y-4">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Network className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {editingEndpoint ? "Edit Webhook Endpoint" : "Tambah Webhook Endpoint Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Konfigurasikan URL penerima webhook dan pilih kategori event yang ingin dikirimkan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 pt-1">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Nama Endpoint</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: NOC Incident Discord, Telegram Alert Bot"
              className="h-9 text-xs bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Webhook URL (HTTPS)</span>
              <Badge variant="outline" className="text-[9px] font-mono border-primary/30 bg-primary/10 text-primary">
                SSRF L2 GUARDED (HTTPS ONLY)
              </Badge>
            </Label>
            <Input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.noc-tools.com/incoming-alarm"
              className="h-9 text-xs font-mono bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Deskripsi / Catatan Integrasi</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opsional: Tujuan penggunaan webhook ini"
              className="h-9 text-xs bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-border/60">
            <Label className="text-xs font-semibold text-foreground">Langganan Event</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                <Checkbox
                  id="ep-fiber-cut"
                  checked={subscribedEvents.fiberCut}
                  onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, fiberCut: !!c }))}
                />
                <Label htmlFor="ep-fiber-cut" className="text-xs text-foreground cursor-pointer">
                  cable.fiber_cut
                </Label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                <Checkbox
                  id="ep-olt-down"
                  checked={subscribedEvents.oltDown}
                  onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, oltDown: !!c }))}
                />
                <Label htmlFor="ep-olt-down" className="text-xs text-foreground cursor-pointer">
                  device.olt_down
                </Label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                <Checkbox
                  id="ep-odp-full"
                  checked={subscribedEvents.odpFull}
                  onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, odpFull: !!c }))}
                />
                <Label htmlFor="ep-odp-full" className="text-xs text-foreground cursor-pointer">
                  odp.capacity_full
                </Label>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                <Checkbox
                  id="ep-quota-alert"
                  checked={subscribedEvents.quotaAlert}
                  onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, quotaAlert: !!c }))}
                />
                <Label htmlFor="ep-quota-alert" className="text-xs text-foreground cursor-pointer">
                  tenant.quota_warning
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="ep-active"
              checked={isActive}
              onCheckedChange={(c) => setIsActive(!!c)}
            />
            <Label htmlFor="ep-active" className="text-xs font-semibold text-foreground cursor-pointer">
              Aktifkan pengiriman webhook ke endpoint ini
            </Label>
          </div>
        </div>

        <DialogFooter className="pt-2 sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs border-border"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleFormSubmit}
            disabled={!name.trim() || !targetUrl.trim() || isSubmitting}
            className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{isSubmitting ? "Menyimpan..." : editingEndpoint ? "Simpan Perubahan" : "Buat Endpoint"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
