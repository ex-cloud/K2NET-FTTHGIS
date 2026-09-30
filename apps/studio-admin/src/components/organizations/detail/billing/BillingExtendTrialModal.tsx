import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from "@k2net/ui";
import { Calendar, Clock, Loader2, ArrowRight } from "lucide-react";
import type { TenantSubscriptionSummary } from "@/hooks/useTenantSubscription";

interface BillingExtendTrialModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  summary: TenantSubscriptionSummary | null;
  onConfirmExtend: (days: number, reason: string) => Promise<void>;
}

export function BillingExtendTrialModal({
  isOpen,
  onOpenChange,
  orgName,
  summary,
  onConfirmExtend,
}: BillingExtendTrialModalProps) {
  const [selectedDays, setSelectedDays] = React.useState<number>(7);
  const [customDays, setCustomDays] = React.useState<string>("");
  const [isCustom, setIsCustom] = React.useState<boolean>(false);
  const [reason, setReason] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const effectiveDays = isCustom ? Math.max(1, parseInt(customDays || "1", 10)) : selectedDays;

  // Calculate current and new expiry dates
  const currentExpiryDate = React.useMemo(() => {
    if (summary?.trialExpiresAt) {
      try {
        return new Date(summary.trialExpiresAt);
      } catch {
        return new Date();
      }
    }
    return new Date();
  }, [summary?.trialExpiresAt]);

  const newExpiryDate = React.useMemo(() => {
    const base = currentExpiryDate.getTime() > Date.now() ? currentExpiryDate : new Date();
    const target = new Date(base);
    target.setDate(target.getDate() + effectiveDays);
    return target;
  }, [currentExpiryDate, effectiveDays]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const handleConfirm = async () => {
    if (effectiveDays <= 0) return;
    setIsSubmitting(true);
    try {
      await onConfirmExtend(
        effectiveDays,
        reason.trim() || `Perpanjangan masa trial +${effectiveDays} hari untuk ${orgName}`
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 bg-card border-border overflow-hidden rounded-xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-groove-b bg-muted/20 text-left">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
              Trial Lifecycle Management
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            Perpanjang Masa Evaluasi Trial
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Pilih durasi penambahan masa trial untuk <strong className="text-foreground">{orgName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Timeline Expiry Preview Card */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Kedaluwarsa Saat Ini</span>
              <span className="font-medium text-foreground font-mono">
                {formatDate(currentExpiryDate)} ({summary?.trialDaysRemaining ?? 0} hari tersisa)
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 py-0.5 text-primary">
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">+{effectiveDays} Hari Penambahan</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-groove-t text-foreground font-semibold">
              <span>Kedaluwarsa Baru</span>
              <span className="text-primary font-mono bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-md">
                {formatDate(newExpiryDate)}
              </span>
            </div>
          </div>

          {/* Preset Durations (7, 14, 30, Custom) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Pilihan Durasi Penambahan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map((days) => {
                const isSelected = !isCustom && selectedDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedDays(days);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${isSelected
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "border-border bg-card hover:bg-muted/60 text-foreground"
                      }`}
                  >
                    <span>+{days} Hari</span>
                    <span className="text-[9.5px] font-normal text-muted-foreground">
                      {days === 7 ? "1 Minggu" : days === 14 ? "2 Minggu" : "1 Bulan"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Duration Input Toggle */}
          <div className="pt-1">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
              >
                {isCustom ? "← Gunakan Pilihan Preset" : "+ Masukkan Durasi Custom (Hari)"}
              </button>

              {isCustom && (
                <div className="flex items-center gap-1.5 w-36">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Contoh: 21"
                    className="h-7 text-xs font-mono"
                  />
                  <span className="text-muted-foreground text-xs">Hari</span>
                </div>
              )}
            </div>
          </div>

          {/* Reason / Ticket Number Input */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Alasan / Catatan Admin (Opsional):
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Permintaan perpanjangan POC teknis dari klien"
              className="h-8 text-xs bg-muted/20 border-border"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-groove-t bg-muted/20 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || effectiveDays <= 0}
            onClick={handleConfirm}
            className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-2xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Calendar className="h-3.5 w-3.5" />
                <span>Konfirmasi Perpanjang</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
