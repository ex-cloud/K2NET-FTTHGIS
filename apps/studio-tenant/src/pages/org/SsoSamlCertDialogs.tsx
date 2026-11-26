import * as React from "react";
import { Loader2, Upload } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export interface StageSamlCertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificatePem: string;
  onCertificatePemChange: (val: string) => void;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
}

export function StageSamlCertDialog({
  open,
  onOpenChange,
  certificatePem,
  onCertificatePemChange,
  isSubmitting,
  onConfirm,
}: StageSamlCertDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      onCertificatePemChange(text.trim());
    } finally {
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {t("settings.sso_saml_rot_stage_modal_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("settings.sso_saml_rot_stage_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="stage-saml-pem" className="text-xs font-semibold">
              {t("settings.sso_saml_rot_pem_label")}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pem,.crt,.cer,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isSubmitting}
              onClick={() => fileInputRef.current?.click()}
              className="h-6 px-2 text-[11px] gap-1"
            >
              <Upload className="size-3" />
              {t("settings.sso_saml_rot_upload_file_btn")}
            </Button>
          </div>
          <Textarea
            id="stage-saml-pem"
            disabled={isSubmitting}
            value={certificatePem}
            onChange={(e) => onCertificatePemChange(e.target.value)}
            placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"
            className="min-h-36 text-xs font-mono bg-background border-border/80"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isSubmitting || !certificatePem.trim()}
            onClick={onConfirm}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            {isSubmitting
              ? t("settings.sso_saml_rot_staging")
              : t("settings.sso_saml_rot_stage_confirm_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface PromoteSamlCertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keepPreviousAsSecondary: boolean;
  onKeepPreviousChange: (val: boolean) => void;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
}

export function PromoteSamlCertDialog({
  open,
  onOpenChange,
  keepPreviousAsSecondary,
  onKeepPreviousChange,
  isSubmitting,
  onConfirm,
}: PromoteSamlCertDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {t("settings.sso_saml_rot_promote_modal_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("settings.sso_saml_rot_promote_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/20 cursor-pointer">
          <input
            type="checkbox"
            checked={keepPreviousAsSecondary}
            onChange={(e) => onKeepPreviousChange(e.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary"
          />
          <span className="text-xs text-foreground">
            {t("settings.sso_saml_rot_keep_rollback_label")}
          </span>
        </label>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            {isSubmitting
              ? t("settings.sso_saml_rot_promoting")
              : t("settings.sso_saml_rot_promote_confirm_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface RetireSamlCertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
}

export function RetireSamlCertDialog({
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
}: RetireSamlCertDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {t("settings.sso_saml_rot_retire_modal_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("settings.sso_saml_rot_retire_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="h-7 px-2.5 text-xs font-medium"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            {isSubmitting
              ? t("settings.sso_saml_rot_retiring")
              : t("settings.sso_saml_rot_retire_confirm_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
