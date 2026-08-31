

import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Checkbox,
} from "@k2net/ui";
import {
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { SubscriptionPlanInfo, ProrationEstimate } from "./billing-types";

interface BillingPlanDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  selectedPlanTarget: SubscriptionPlanInfo | null;
  isDowngradeMode: boolean;
  usedOlts: number;
  usedOdps: number;
  prorateData: ProrationEstimate | null;
  upgradeNotes: string;
  setUpgradeNotes: (v: string) => void;
  downgradeReason: string;
  setDowngradeReason: (v: string) => void;
  ackOverQuota: boolean;
  setAckOverQuota: (v: boolean) => void;
  isExecuting: boolean;
  onExecuteUpgrade: () => void;
  onExecuteDowngrade: () => void;
}

export function BillingPlanDetailModal({
  isOpen,
  onOpenChange,
  orgName,
  selectedPlanTarget,
  isDowngradeMode,
  usedOlts,
  usedOdps,
  prorateData,
  upgradeNotes,
  setUpgradeNotes,
  downgradeReason,
  setDowngradeReason,
  ackOverQuota,
  setAckOverQuota,
  isExecuting,
  onExecuteUpgrade,
  onExecuteDowngrade,
}: BillingPlanDetailModalProps) {
  if (!selectedPlanTarget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-2xl border-border sm:max-w-[900px] p-0 overflow-hidden shadow-2xl rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          {/* ── LEFT COLUMN (Features & Inclusions OR Downgrade Impact) ───── */}
          <div className="md:col-span-7 p-6 md:p-7 space-y-5 border-b md:border-b-0 md:border-r border-border/70 bg-card/40">
            {!isDowngradeMode ? (
              // UPGRADE FLOW
              <>
                <div className="space-y-1.5">
                  <DialogTitle className="text-base font-bold text-foreground leading-snug">
                    Upgrade {orgName} to the {selectedPlanTarget.name} plan to unlock more spatial compute resources, AI diagnostics, daily backups, and SLA support.
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Upgrade features & Included Quotas
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {selectedPlanTarget.features.map((feat) => (
                    <div key={feat.title} className="flex items-start gap-2.5 text-xs">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground block text-xs">{feat.title}</span>
                        <span className="text-[11px] text-muted-foreground block">{feat.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed">
                  ✨ Begitu diaktivasi, semua batas kuota dan fitur premium langsung terbuka saat itu juga (*Instant Unfreeze*).
                </div>
              </>
            ) : (
              // DOWNGRADE FLOW (Zero Data Loss)
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
                    <span className={usedOlts > selectedPlanTarget.maxOlts ? "text-amber-500 font-bold" : "text-foreground"}>
                      {usedOlts} / {selectedPlanTarget.maxOlts} OLT {usedOlts > selectedPlanTarget.maxOlts ? "(Kapasitas Lebih)" : "✓"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-foreground">Node ODP / FAT:</span>
                    <span className={usedOdps > selectedPlanTarget.maxOdps ? "text-amber-500 font-bold" : "text-foreground"}>
                      {usedOdps.toLocaleString("id-ID")} / {selectedPlanTarget.maxOdps.toLocaleString("id-ID")} ODP {usedOdps > selectedPlanTarget.maxOdps ? "(Kapasitas Lebih)" : "✓"}
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
            )}
          </div>

          {/* ── RIGHT COLUMN (Billing Summary, Proration & Execution) ─────── */}
          <div className="md:col-span-5 p-6 md:p-7 flex flex-col justify-between space-y-6 bg-muted/10">
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                Billing Summary
              </h5>

              {/* Proration / Cost Breakdown Box */}
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-foreground pb-1.5 border-b border-border">
                  <span>{selectedPlanTarget.name} Plan</span>
                  <span className="font-mono">{selectedPlanTarget.price} / bln</span>
                </div>

                {!isDowngradeMode && (
                  <>
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Parameter Siklus</span>
                      <span>Sisa {prorateData?.remainingDays ?? 30} dari {prorateData?.totalCycleDays ?? 30} Hari</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground">Kredit Paket Lama:</span>
                      <span className="font-mono text-primary font-semibold">
                        - Rp {(prorateData?.unusedOldPlanCredit ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground">Biaya Prorata Baru:</span>
                      <span className="font-mono text-foreground font-semibold">
                        + Rp {(prorateData?.newPlanProratedCost ?? selectedPlanTarget.numericPrice ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border font-bold text-xs">
                      <span className="text-foreground">Tagihan Bersih:</span>
                      <span className="font-mono text-primary text-sm">
                        Rp {(prorateData?.netPayableDelta ?? selectedPlanTarget.numericPrice ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!isDowngradeMode && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Referensi PO / Catatan (Opsional)</Label>
                  <Input
                    placeholder="Contoh: PO-KIR-2026-08 / BAST Billing"
                    value={upgradeNotes}
                    onChange={(e) => setUpgradeNotes(e.target.value)}
                    className="h-8 text-xs bg-card border-border text-foreground"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-border/60">
              <Button
                size="sm"
                disabled={isExecuting || (isDowngradeMode && (!ackOverQuota || !downgradeReason.trim()))}
                onClick={isDowngradeMode ? onExecuteDowngrade : onExecuteUpgrade}
                className="w-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 shadow-xs cursor-pointer"
              >
                {isExecuting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isDowngradeMode ? (
                  "Eksekusi Downgrade"
                ) : (
                  "Aktivasi Upgrade Sekarang"
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground h-7 cursor-pointer"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
