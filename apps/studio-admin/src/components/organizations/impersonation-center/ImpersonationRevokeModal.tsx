import { AlertTriangle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import type { ImpersonationSessionItem } from "@/hooks/useImpersonationCenter";

interface ImpersonationRevokeModalProps {
  revokeTarget: ImpersonationSessionItem | null;
  onClose: () => void;
  onConfirm: (target: ImpersonationSessionItem) => void;
}

export function ImpersonationRevokeModal({
  revokeTarget,
  onClose,
  onConfirm,
}: ImpersonationRevokeModalProps) {
  if (!revokeTarget) return null;

  return (
    <Dialog open={Boolean(revokeTarget)} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-card text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              Emergency Revoke
            </span>
          </div>
          <DialogTitle className="text-base font-bold">
            Putus Akses Impersonasi Darurat?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tindakan ini akan langsung mencabut token dan memutus akses sesi Super Admin ke portal <strong>{revokeTarget.targetOrgName}</strong>. Rekaman audit forensik <code className="font-mono text-destructive">IMPERSONATION_FORCE_REVOKED</code> akan dicatat.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-xs cursor-pointer">
            Batal
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onConfirm(revokeTarget)}
            className="text-xs font-semibold cursor-pointer"
          >
            Putus Akses Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
