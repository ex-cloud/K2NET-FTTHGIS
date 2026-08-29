"use client";

import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
} from "@k2net/ui";
import { ShieldAlert, Check, Loader2 } from "lucide-react";

interface BillingDunningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDunningLevel: number;
  setSelectedDunningLevel: (level: number) => void;
  dunningNotes: string;
  setDunningNotes: (notes: string) => void;
  isExecuting: boolean;
  onExecuteDunning: () => void;
}

const DUNNING_LEVELS = [
  { level: 0, title: "Level 0: Normal / Lunas", desc: "Status ACTIVE penuh tanpa pembatasan." },
  { level: 1, title: "Level 1: Peringatan H+1", desc: "Notifikasi WA & email peringatan jatuh tempo dikirim ke PIC." },
  { level: 2, title: "Level 2: Peringatan Keras H+3", desc: "Fitur add-on non-esensial (AI Copilot, SMS blast) dinonaktifkan." },
  { level: 3, title: "Level 3: Soft-Lock H+7", desc: "Mode Read-Only GIS. Pembuatan node dikunci, hanya Billing yang aktif." },
];

export function BillingDunningModal({
  isOpen,
  onOpenChange,
  selectedDunningLevel,
  setSelectedDunningLevel,
  dunningNotes,
  setDunningNotes,
  isExecuting,
  onExecuteDunning,
}: BillingDunningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[480px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
        <DialogHeader className="p-5 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-500">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>Kontrol Eskalasi Dunning & Gagal Bayar</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Atur status dunning untuk tagihan yang telah melewati batas jatuh tempo.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Tingkat Eskalasi Dunning</Label>
            <div className="space-y-2">
              {DUNNING_LEVELS.map((item) => (
                <div
                  key={item.level}
                  onClick={() => setSelectedDunningLevel(item.level)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedDunningLevel === item.level
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card/60 hover:bg-card text-foreground/80"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{item.title}</span>
                    {selectedDunningLevel === item.level && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Catatan Petugas Kolektibilitas</Label>
            <Input
              placeholder="Contoh: Janji bayar via transfer tanggal 05 September"
              value={dunningNotes}
              onChange={(e) => setDunningNotes(e.target.value)}
              className="h-8 text-xs bg-card border-border text-foreground"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs cursor-pointer">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={onExecuteDunning}
            disabled={isExecuting}
            className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer"
          >
            {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Simpan Status Dunning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
