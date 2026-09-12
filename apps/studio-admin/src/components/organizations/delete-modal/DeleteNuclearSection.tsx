import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Label, Input, Checkbox } from "@k2net/ui";

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
  return (
    <div className="space-y-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
      <div className="flex items-start gap-2 text-destructive">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Tindakan ini permanen. Seluruh Keycloak realm, user, ODP, ODC, dan kabel untuk{" "}
          <strong className="text-foreground">{orgName}</strong> akan langsung dihapus tanpa bisa dibatalkan.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="confirm-nuclear"
          checked={confirmUnderstandNuclear}
          onCheckedChange={(checked: boolean) => setConfirmUnderstandNuclear(!!checked)}
        />
        <Label htmlFor="confirm-nuclear" className="text-xs font-medium text-foreground cursor-pointer">
          Saya memahami data akan dimusnahkan secara permanen
        </Label>
      </div>

      <div className="space-y-1.5 pt-1">
        <Label className="text-[11px] text-muted-foreground">
          Ketik slug{" "}
          <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            {orgSlug}
          </span>{" "}
          untuk konfirmasi:
        </Label>
        <Input
          value={deleteConfirmSlug}
          onChange={(e) => setDeleteConfirmSlug(e.target.value)}
          placeholder="Masukkan slug organisasi"
          className="bg-card border-border text-foreground h-9 text-xs font-mono"
        />
      </div>
    </div>
  );
}
