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
import { useTranslation } from "@k2net/i18n";

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
  const { t } = useTranslation();
  if (!revokeTarget) return null;

  return (
    <Dialog open={Boolean(revokeTarget)} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-card text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              {t("organizations.impersonation_emergency_revoke_badge")}
            </span>
          </div>
          <DialogTitle className="text-base font-bold">
            {t("organizations.impersonation_revoke_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("organizations.impersonation_revoke_desc", { orgName: revokeTarget.targetOrgName })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button size="sm" variant="ghost" onClick={onClose} className="text-xs cursor-pointer">
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onConfirm(revokeTarget)}
            className="text-xs font-semibold cursor-pointer"
          >
            {t("organizations.impersonation_revoke_confirm_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
