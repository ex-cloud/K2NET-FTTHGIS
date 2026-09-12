import { AlertTriangle, ShieldAlert, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@k2net/ui";
import type { Role, ImpactData } from "./types";

interface RolesMatrixModalsProps {
  showConfirmDialog: boolean;
  setShowConfirmDialog: (open: boolean) => void;
  pendingRoleToSave: Role | null;
  onConfirmStandardTemplate: (role: Role) => void;
  impactModalOpen: boolean;
  setImpactModalOpen: (open: boolean) => void;
  impactData: ImpactData | null;
  onConfirmImpact: (data: ImpactData) => void;
}

export function RolesMatrixModals({
  showConfirmDialog,
  setShowConfirmDialog,
  pendingRoleToSave,
  onConfirmStandardTemplate,
  impactModalOpen,
  setImpactModalOpen,
  impactData,
  onConfirmImpact,
}: RolesMatrixModalsProps) {
  return (
    <>
      {/* Confirmation Dialog for Standard Template */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-blue-500/10">
                <AlertTriangle className="w-6 h-6 text-blue-400" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Standard Template
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-base leading-relaxed">
              Ini adalah template standar global untuk role{" "}
              <span className="text-blue-400 font-semibold uppercase">
                {pendingRoleToSave?.displayName || pendingRoleToSave?.name}
              </span>
              . Menyimpan perubahan akan membuat{" "}
              <span className="text-primary font-semibold underline decoration-primary/30 underline-offset-4">
                versi kustom
              </span>{" "}
              khusus untuk organisasi Anda.
              <br />
              <br />
              Seluruh anggota tim yang memiliki role ini akan otomatis dimigrasikan ke versi kustom yang baru.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingRoleToSave) {
                  setShowConfirmDialog(false);
                  onConfirmStandardTemplate(pendingRoleToSave);
                }
              }}
              className="bg-blue-600 hover:bg-blue-500 text-foreground shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all font-semibold"
            >
              Continue &amp; Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMPACT PREVIEW CONFIRMATION MODAL */}
      <Dialog open={impactModalOpen} onOpenChange={setImpactModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Konfirmasi Dampak Perubahan Akses
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              Pencabutan hak akses terdeteksi pada role yang sedang digunakan oleh akun aktif:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 max-h-[250px] overflow-y-auto custom-scrollbar">
            {impactData?.roles.map((r) => {
              const count = impactData.userCounts[r.id];
              const revoked = impactData.revocations[r.id] || [];
              if (!count || count.activeUserCount === 0 || revoked.length === 0) return null;

              return (
                <div key={r.id} className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{r.displayName || r.name}</span>
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                      <UserCheck className="w-3.5 h-3.5" />
                      {count.activeUserCount} Pengguna Aktif
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground block mb-1">
                      Hak akses yang akan dicabut ({revoked.length}):
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-amber-300">
                      {revoked.map((p) => (
                        <li key={p.id}>{p.code}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setImpactModalOpen(false)}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              Batalkan
            </Button>
            <Button
              onClick={() => {
                setImpactModalOpen(false);
                if (impactData) {
                  onConfirmImpact(impactData);
                }
              }}
              className="bg-amber-600 hover:bg-amber-500 text-foreground font-semibold shadow-lg shadow-amber-600/30"
            >
              Saya Mengerti &amp; Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
