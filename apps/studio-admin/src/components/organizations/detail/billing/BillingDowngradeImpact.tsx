import {
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Checkbox,
} from "@k2net/ui";
import { AlertTriangle } from "lucide-react";
import type { SubscriptionPlanInfo } from "./billing-types";

interface BillingDowngradeImpactProps {
  selectedPlanTarget: SubscriptionPlanInfo;
  usedOlts: number;
  usedOdps: number;
  downgradeReason: string;
  setDowngradeReason: (v: string) => void;
  ackOverQuota: boolean;
  setAckOverQuota: (v: boolean) => void;
}

export function BillingDowngradeImpact({
  selectedPlanTarget,
  usedOlts,
  usedOdps,
  downgradeReason,
  setDowngradeReason,
  ackOverQuota,
  setAckOverQuota,
}: BillingDowngradeImpactProps) {
  const isOltsOver = usedOlts > selectedPlanTarget.maxOlts;
  const isOdpsOver = usedOdps > selectedPlanTarget.maxOdps;

  return (
    <>
      <div className="space-y-1.5">
        <DialogTitle className="text-base font-bold text-amber-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>Analisis Dampak Downgrade ({selectedPlanTarget.name})</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Kebijakan Zero Data Loss menjamin seluruh data topologi fisik tidak dihapus, namun kuota baru akan dievaluasi.
        </DialogDescription>
      </div>

      {/* Impact comparison table */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between font-mono pb-1 border-b border-border text-[11px]">
          <span className="text-muted-foreground">Perangkat / Sumber Daya</span>
          <span>Kapasitas Terpakai vs Batas Baru</span>
        </div>
        <div className="flex items-center justify-between font-mono">
          <span className="text-foreground">Perangkat OLT:</span>
          <span className={isOltsOver ? "text-amber-500 font-bold" : "text-foreground"}>
            {usedOlts} / {selectedPlanTarget.maxOlts} OLT {isOltsOver ? "(Kapasitas Lebih)" : "✓"}
          </span>
        </div>
        <div className="flex items-center justify-between font-mono">
          <span className="text-foreground">Node ODP / FAT:</span>
          <span className={isOdpsOver ? "text-amber-500 font-bold" : "text-foreground"}>
            {usedOdps.toLocaleString("id-ID")} / {selectedPlanTarget.maxOdps.toLocaleString("id-ID")} ODP {isOdpsOver ? "(Kapasitas Lebih)" : "✓"}
          </span>
        </div>
      </div>

      {/* Protection Notice */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground block mb-0.5">🛡️ Kebijakan Perlindungan Aset:</strong>
        Seluruh {usedOlts} OLT dan {usedOdps} ODP yang telah terpetakan di lapangan tetap aktif melayani pelanggan. Penambahan node baru akan di-lock dalam <strong>Read-Only Mode</strong> sampai kuota disesuaikan.
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold text-foreground">Alasan Resmi / Nomor Surat Downgrade *</Label>
        <Input
          placeholder="Contoh: Permintaan resmi tenant nomor surat 042/ISP/VIII/2026"
          value={downgradeReason}
          onChange={(e) => setDowngradeReason(e.target.value)}
          className="h-8 text-xs bg-card border-border text-foreground"
        />
      </div>

      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="ack-overquota-split-modal"
          checked={ackOverQuota}
          onCheckedChange={(c: boolean) => setAckOverQuota(!!c)}
        />
        <Label htmlFor="ack-overquota-split-modal" className="text-[11px] text-muted-foreground leading-tight cursor-pointer">
          Saya memahami bahwa status akun akan menjadi OVER_QUOTA dan fitur add-on Enterprise akan dinonaktifkan.
        </Label>
      </div>
    </>
  );
}
