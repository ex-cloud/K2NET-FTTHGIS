import * as React from "react";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export interface ScopeOption {
  id: string;
  label: string;
  desc: string;
}

export const AVAILABLE_SCOPES: ScopeOption[] = [
  { id: "read:network", label: "read:network", desc: "View GIS topology, OLTs, and ODP boxes" },
  { id: "write:network", label: "write:network", desc: "Mutate network assets and connections" },
  { id: "read:telemetry", label: "read:telemetry", desc: "Stream real-time optical power and alarms" },
  { id: "read:customer", label: "read:customer", desc: "Query subscriber directory & status" },
  { id: "write:customer", label: "write:customer", desc: "Create and update subscriber accounts" },
];

interface CreateApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string; scopes: string[]; expirationDays: number }) => void;
  isPending: boolean;
}

export function CreateApiKeyModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CreateApiKeyModalProps) {
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [scopes, setScopes] = React.useState<string[]>(["read:network", "read:telemetry"]);
  const [expirationDays, setExpirationDays] = React.useState<number>(90);

  const toggleScope = (scopeId: string) => {
    setScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      scopes,
      expirationDays,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.developer.create_key_btn")}</DialogTitle>
          <DialogDescription>
            {t("settings.developer.api_keys_subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="key-name">
              {t("settings.developer.key_name_label")}
            </Label>
            <Input
              id="key-name"
              placeholder={t("settings.developer.key_name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("settings.developer.expiration_label")}</Label>
            <select
              className="w-full h-8 text-xs bg-background border border-border rounded-md px-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
              value={expirationDays}
              onChange={(e) => setExpirationDays(Number(e.target.value))}
            >
              <option value={30}>{t("settings.developer.days_30")}</option>
              <option value={90}>{t("settings.developer.days_90")}</option>
              <option value={365}>{t("settings.developer.days_365")}</option>
              <option value={0}>{t("settings.developer.no_expiration")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t("settings.developer.scopes_label")}</Label>
            <div className="space-y-2 border border-border rounded-md p-3 bg-muted/20">
              {AVAILABLE_SCOPES.map((sc) => {
                const isChecked = scopes.includes(sc.id);
                return (
                  <div
                    key={sc.id}
                    onClick={() => toggleScope(sc.id)}
                    className="flex items-start gap-2.5 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-border"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-mono font-medium text-foreground">
                        {sc.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {sc.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!name.trim() || isPending}
            onClick={handleCreate}
          >
            {isPending ? t("common.saving") : t("settings.developer.create_key_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
