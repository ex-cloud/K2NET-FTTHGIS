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
import { Zap, Loader2 } from "lucide-react";

interface HardwareBoosterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boosterOlts: number;
  setBoosterOlts: (v: number) => void;
  boosterOdps: number;
  setBoosterOdps: (v: number) => void;
  boosterDuration: number;
  setBoosterDuration: (v: number) => void;
  boosterReason: string;
  setBoosterReason: (v: string) => void;
  isSavingBooster: boolean;
  onApplyBooster: () => void;
}

export function HardwareBoosterModal({
  open,
  onOpenChange,
  boosterOlts,
  setBoosterOlts,
  boosterOdps,
  setBoosterOdps,
  boosterDuration,
  setBoosterDuration,
  boosterReason,
  setBoosterReason,
  isSavingBooster,
  onApplyBooster,
}: HardwareBoosterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[480px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
        <DialogHeader className="p-5 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-500">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Aktivasi Emergency Quota Booster</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tambahkan kuota kapasitas sementara (bursting) selama proyek tender berlangsung tanpa upgrade permanen.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tambahan Kuota OLT (+)</Label>
              <Input
                type="number"
                value={boosterOlts}
                onChange={(e) => setBoosterOlts(Number(e.target.value))}
                className="h-8 text-xs bg-card border-border text-foreground font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tambahan Kuota ODP (+)</Label>
              <Input
                type="number"
                value={boosterOdps}
                onChange={(e) => setBoosterOdps(Number(e.target.value))}
                className="h-8 text-xs bg-card border-border text-foreground font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Durasi Masa Berlaku Booster (Hari)</Label>
            <Input
              type="number"
              value={boosterDuration}
              onChange={(e) => setBoosterDuration(Number(e.target.value))}
              className="h-8 text-xs bg-card border-border text-foreground font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Alasan Kebutuhan Proyek *</Label>
            <Input
              placeholder="Contoh: Proyek Tender Fiber Kawasan Industri MM2100"
              value={boosterReason}
              onChange={(e) => setBoosterReason(e.target.value)}
              className="h-8 text-xs bg-card border-border text-foreground"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-muted-foreground leading-relaxed">
            Setelah {boosterDuration} hari berakhir, jika kapasitas terpakai masih di atas kuota dasar, akun akan beralih secara aman ke mode <strong>OVER_QUOTA (Read-Only)</strong> tanpa kehilangan data.
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs cursor-pointer">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={onApplyBooster}
            disabled={isSavingBooster || !boosterReason.trim()}
            className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer"
          >
            {isSavingBooster ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aktifkan Booster Sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
