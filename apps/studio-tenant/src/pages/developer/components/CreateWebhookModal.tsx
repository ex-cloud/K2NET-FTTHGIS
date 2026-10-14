import * as React from "react";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export interface SupportedEvent {
  id: string;
  label: string;
  desc: string;
}

export const SUPPORTED_EVENTS: SupportedEvent[] = [
  { id: "network.olt.status", label: "network.olt.status", desc: "OLT online/offline state change" },
  { id: "network.outage", label: "network.outage", desc: "Fiber cut / LOS optical alarms" },
  { id: "customer.created", label: "customer.created", desc: "New subscriber provisioned" },
  { id: "invoice.paid", label: "invoice.paid", desc: "B2B billing payment confirmation" },
];

interface CreateWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string; url: string; events: string[] }) => void;
  isPending: boolean;
}

export function CreateWebhookModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CreateWebhookModalProps) {
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<string[]>([
    "network.olt.status",
    "network.outage",
  ]);

  const toggleEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleCreate = () => {
    if (!name.trim() || !url.trim()) return;
    onSubmit({
      name: name.trim(),
      url: url.trim(),
      events,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("settings.developer.create_webhook_btn")}
          </DialogTitle>
          <DialogDescription>
            {t("settings.developer.webhooks_subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="webhook-name">
              {t("settings.developer.webhook_name_label")}
            </Label>
            <Input
              id="webhook-name"
              placeholder={t("settings.developer.webhook_name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="webhook-url">
              {t("settings.developer.webhook_url_label")}
            </Label>
            <Input
              id="webhook-url"
              placeholder={t("settings.developer.webhook_url_placeholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("settings.developer.events_label")}</Label>
            <div className="space-y-2 border border-border rounded-md p-3 bg-muted/20">
              {SUPPORTED_EVENTS.map((ev) => {
                const isChecked = events.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleEvent(ev.id)}
                    className="flex items-start gap-2.5 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-border"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-mono font-medium text-foreground">
                        {ev.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {ev.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!name.trim() || !url.trim() || isPending}
            onClick={handleCreate}
          >
            {isPending
              ? t("common.saving")
              : t("settings.developer.create_webhook_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
