import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Label, Input, Checkbox } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface DeleteNuclearSectionProps {
  orgName?: string;
  orgSlug?: string;
  confirmUnderstandNuclear: boolean;
  setConfirmUnderstandNuclear: (checked: boolean) => void;
  deleteConfirmSlug: string;
  setDeleteConfirmSlug: (slug: string) => void;
}

export function DeleteNuclearSection({
  orgName,
  orgSlug,
  confirmUnderstandNuclear,
  setConfirmUnderstandNuclear,
  deleteConfirmSlug,
  setDeleteConfirmSlug,
}: DeleteNuclearSectionProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
      <div className="flex items-start gap-2 text-destructive">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t("organizations.delete_nuclear_warning", { orgName: orgName || "" })}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="confirm-nuclear"
          checked={confirmUnderstandNuclear}
          onCheckedChange={(checked: boolean) => setConfirmUnderstandNuclear(!!checked)}
        />
        <Label htmlFor="confirm-nuclear" className="text-xs font-medium text-foreground cursor-pointer">
          {t("organizations.delete_nuclear_confirm_check")}
        </Label>
      </div>

      <div className="space-y-1.5 pt-1">
        <Label className="text-[11px] text-muted-foreground">
          {t("organizations.delete_nuclear_type_slug", { orgSlug: orgSlug || "" })}
        </Label>
        <Input
          value={deleteConfirmSlug}
          onChange={(e) => setDeleteConfirmSlug(e.target.value)}
          placeholder={t("organizations.delete_nuclear_placeholder")}
          className="bg-card border-border text-foreground h-9 text-xs font-mono"
        />
      </div>
    </div>
  );
}
