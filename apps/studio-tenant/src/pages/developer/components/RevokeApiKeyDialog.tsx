import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface RevokeApiKeyDialogProps {
  apiKey: {
    id: string;
    name: string;
    maskedKey: string;
  } | null;
  onClose: () => void;
  onConfirm: (keyId: string) => void;
  isPending: boolean;
}

export function RevokeApiKeyDialog({
  apiKey,
  onClose,
  onConfirm,
  isPending,
}: RevokeApiKeyDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={Boolean(apiKey)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.developer.revoke_confirm_title")}</DialogTitle>
          <DialogDescription>
            {t("settings.developer.revoke_confirm_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-muted rounded font-mono text-xs text-foreground">
          {apiKey?.name} ({apiKey?.maskedKey})
        </div>

        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (apiKey) onConfirm(apiKey.id);
            }}
          >
            {isPending ? t("common.saving") : t("settings.developer.revoke_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
