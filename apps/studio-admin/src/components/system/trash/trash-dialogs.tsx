import {
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import type { TrashItem } from "@/hooks/useTrashCan";

interface TrashDialogsProps {
  activeItemToRestore: TrashItem | null;
  onCloseRestore: () => void;
  onConfirmRestore: () => void;
  activeItemToDelete: TrashItem | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  showEmptyConfirm: boolean;
  onCloseEmptyConfirm: () => void;
  onConfirmEmptyTrash: () => void;
  isProcessing: boolean;
  totalStats: number;
}

export function TrashDialogs({
  activeItemToRestore,
  onCloseRestore,
  onConfirmRestore,
  activeItemToDelete,
  onCloseDelete,
  onConfirmDelete,
  showEmptyConfirm,
  onCloseEmptyConfirm,
  onConfirmEmptyTrash,
  isProcessing,
  totalStats,
}: TrashDialogsProps) {
  return (
    <>
      {/* Confirmation Dialog: Pre-flight Restore Single Item */}
      <Dialog
        open={!!activeItemToRestore}
        onOpenChange={(open) => !open && onCloseRestore()}
      >
        <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-xl border-border">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <RotateCcw className="h-5 w-5 text-primary" />
              <DialogTitle className="text-foreground">Pulihkan Data dari Recycle Bin?</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1.5 text-muted-foreground">
              Entitas <strong className="text-foreground">&ldquo;{activeItemToRestore?.name}&rdquo;</strong> akan dikembalikan ke status aktif dan siap digunakan kembali.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2.5">
            <div className="p-3 rounded-xl bg-card border border-border text-xs space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Rincian Dampak Pemulihan:
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                {activeItemToRestore?.type === "ORGANIZATION" ? (
                  <>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span><strong>Keycloak IAM Realm</strong> diaktifkan kembali (<span className="font-mono text-foreground">enabled: true</span>), seluruh pengguna tenant dapat langsung login kembali.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span>Status organisasi dikembalikan ke status <strong className="text-primary font-bold">ACTIVE</strong>.</span>
                    </li>
                  </>
                ) : (
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>Item akan kembali muncul di dashboard operasional harian dan peta aktif.</span>
                  </li>
                )}
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span>Tenggat hitung mundur retensi 30 hari dibatalkan.</span>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseRestore}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmRestore}
              disabled={isProcessing}
              className="gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Memulihkan...
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Ya, Pulihkan Sekarang
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Permanent Delete Single Item */}
      <Dialog
        open={!!activeItemToDelete}
        onOpenChange={(open) => !open && onCloseDelete()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Hapus Permanen Data?</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              Tindakan ini bersifat <strong>permanen dan tidak dapat dibatalkan</strong>. Data{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{activeItemToDelete?.name}&rdquo;
              </span>{" "}
              akan dihapus secara fisik dari database PostgreSQL.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseDelete}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={isProcessing}
            >
              {isProcessing ? "Menghapus..." : "Ya, Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Empty Whole Trash */}
      <Dialog open={showEmptyConfirm} onOpenChange={(open) => !open && onCloseEmptyConfirm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle>Kosongkan Seluruh Recycle Bin?</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              Anda akan menghapus fisik <strong>seluruh {totalStats} item</strong> yang ada di Recycle Bin. Pastikan tidak ada data penting yang masih perlu dipulihkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseEmptyConfirm}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirmEmptyTrash}
              disabled={isProcessing}
            >
              {isProcessing ? "Mengosongkan..." : "Ya, Kosongkan Semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
