import { Checkbox, Label } from "@k2net/ui";
import type { WebhookSubscriptions } from "./types";

interface WebhookEventCheckboxesProps {
  subscribedEvents: WebhookSubscriptions;
  setSubscribedEvents: React.Dispatch<React.SetStateAction<WebhookSubscriptions>>;
}

export function WebhookEventCheckboxes({
  subscribedEvents,
  setSubscribedEvents,
}: WebhookEventCheckboxesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/60">
        <Checkbox
          id="evt-fiber-cut"
          checked={subscribedEvents.fiberCut}
          onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, fiberCut: !!c }))}
        />
        <div>
          <Label htmlFor="evt-fiber-cut" className="text-xs font-semibold text-foreground cursor-pointer block">
            cable.fiber_cut (LOS / Putus Jalur)
          </Label>
          <span className="text-[10px] text-muted-foreground block">
            Trigger seketika saat kabel feeder atau distribusi terindikasi putus.
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/60">
        <Checkbox
          id="evt-olt-down"
          checked={subscribedEvents.oltDown}
          onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, oltDown: !!c }))}
        />
        <div>
          <Label htmlFor="evt-olt-down" className="text-xs font-semibold text-foreground cursor-pointer block">
            device.olt_down (OLT Unreachable)
          </Label>
          <span className="text-[10px] text-muted-foreground block">
            Trigger jika poller daemon gagal melakukan SNMP polling 3 siklus berturut-turut.
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/60">
        <Checkbox
          id="evt-odp-full"
          checked={subscribedEvents.odpFull}
          onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, odpFull: !!c }))}
        />
        <div>
          <Label htmlFor="evt-odp-full" className="text-xs font-semibold text-foreground cursor-pointer block">
            odp.capacity_full (Port ODP 100%)
          </Label>
          <span className="text-[10px] text-muted-foreground block">
            Trigger saat seluruh port splitter pada suatu ODP telah teralokasikan.
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background/50 border border-border/60">
        <Checkbox
          id="evt-quota-alert"
          checked={subscribedEvents.quotaAlert}
          onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, quotaAlert: !!c }))}
        />
        <div>
          <Label htmlFor="evt-quota-alert" className="text-xs font-semibold text-foreground cursor-pointer block">
            tenant.quota_warning (Batas Kuota 90%)
          </Label>
          <span className="text-[10px] text-muted-foreground block">
            Peringatan otomatis jika penyimpanan MinIO atau batas OLT mencapai 90%.
          </span>
        </div>
      </div>
    </div>
  );
}
