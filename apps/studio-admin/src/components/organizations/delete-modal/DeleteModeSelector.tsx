import * as React from "react";
import { Archive, Flame } from "lucide-react";
import { Label } from "@k2net/ui";
import { cn } from "@/lib/utils";

interface DeleteModeSelectorProps {
  deleteMode: "soft" | "nuclear";
  setDeleteMode: (mode: "soft" | "nuclear") => void;
}

export function DeleteModeSelector({ deleteMode, setDeleteMode }: DeleteModeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-foreground">Pilih Metode Penghapusan</Label>
      <div className="grid grid-cols-1 gap-2.5">
        <div
          onClick={() => setDeleteMode("soft")}
          className={cn(
            "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
            deleteMode === "soft"
              ? "bg-primary/5 border-primary shadow-sm"
              : "bg-card border-border hover:border-border/80 opacity-80"
          )}
        >
          <div className="pt-0.5">
            <div
              className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center",
                deleteMode === "soft"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground"
              )}
            >
              {deleteMode === "soft" && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
            </div>
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-amber-500" />
                Pindahkan ke Recycle Bin (Grace Period 30 Hari)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Direkomendasikan (Aman)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Keycloak Realm dinonaktifkan seketika (semua user langsung logout). Data tersimpan aman di{" "}
              <strong>Recycle Bin</strong> selama 30 hari dan dapat dipulihkan sewaktu-waktu dengan 1-klik.
            </p>
          </div>
        </div>

        <div
          onClick={() => setDeleteMode("nuclear")}
          className={cn(
            "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
            deleteMode === "nuclear"
              ? "bg-destructive/5 border-destructive shadow-sm"
              : "bg-card border-border hover:border-border/80 opacity-80"
          )}
        >
          <div className="pt-0.5">
            <div
              className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center",
                deleteMode === "nuclear"
                  ? "border-destructive bg-destructive text-destructive-foreground"
                  : "border-muted-foreground"
              )}
            >
              {deleteMode === "nuclear" && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
            </div>
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-destructive flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-destructive" />
                Hapus Fisik Permanen Langsung (Nuclear Wipe)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                Danger Zone
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Keycloak Realm, seluruh titik PostGIS, dan berkas di storage akan{" "}
              <strong>dimusnahkan fisik seketika</strong> tanpa masa tenggang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
