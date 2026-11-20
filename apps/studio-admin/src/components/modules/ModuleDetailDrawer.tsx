import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  type PlatformModuleItem,
  type ModuleStatus,
  type ModulePlanTier,
  useUpdateModuleStatus,
} from "@/hooks/usePlatformModules";
import {
  Layers,
  Shield,
  Server,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

interface ModuleDetailDrawerProps {
  module: PlatformModuleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModuleDetailDrawer({
  module,
  open,
  onOpenChange,
}: ModuleDetailDrawerProps) {
  const { t } = useTranslation();
  const updateStatusMutation = useUpdateModuleStatus();

  const [selectedStatus, setSelectedStatus] = React.useState<ModuleStatus>("ACTIVE");
  const [selectedTier, setSelectedTier] = React.useState<ModulePlanTier>("FREE");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (module) {
      setSelectedStatus(module.status);
      setSelectedTier(module.minPlanTier);
      setReason("");
    }
  }, [module]);

  if (!module) return null;

  const handleSave = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        code: module.code,
        status: selectedStatus,
        minPlanTier: selectedTier,
        reason: reason.trim() || undefined,
      });
      toast.success(t("modules.toast_status_updated"));
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("modules.toast_status_failed")
      );
    }
  };

  const getStatusIcon = (status: ModuleStatus) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle2 className="size-3.5 text-primary" />;
      case "MAINTENANCE":
        return <AlertTriangle className="size-3.5 text-amber-500" />;
      case "DISABLED":
        return <XCircle className="size-3.5 text-rose-500" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 bg-background border-border"
      >
        <SheetHeader className="p-6 border-b border-border bg-card/40 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
              {module.code}
            </span>
            <Badge
              variant={module.scope === "SYSTEM" ? "secondary" : "outline"}
              className="text-[10px] tracking-wide uppercase font-semibold"
            >
              {module.scope}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
            {module.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
            {module.description || t("modules.drawer_subtitle")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-border/80 bg-muted/20 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Server className="size-3.5 text-muted-foreground" />
                {t("modules.field_target")}
              </span>
              <span className="font-mono font-medium text-foreground block truncate">
                {module.serviceTarget}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Layers className="size-3.5 text-muted-foreground" />
                {t("modules.field_category")}
              </span>
              <span className="font-semibold text-foreground block truncate">
                {module.category}
              </span>
            </div>
          </div>

          {/* Governance Form: Status & Min Tier */}
          <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
            <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
              <Shield className="size-3.5 text-primary" />
              {t("modules.field_status")}
            </h4>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  {t("modules.field_status")}
                </Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val as ModuleStatus)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground text-xs">
                    <SelectItem value="ACTIVE">
                      <div className="flex items-center gap-2">
                        {getStatusIcon("ACTIVE")}
                        <span>{t("modules.status_active")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MAINTENANCE">
                      <div className="flex items-center gap-2">
                        {getStatusIcon("MAINTENANCE")}
                        <span>{t("modules.status_maintenance")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DISABLED">
                      <div className="flex items-center gap-2">
                        {getStatusIcon("DISABLED")}
                        <span>{t("modules.status_disabled")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {t("modules.field_status_desc")}
                </p>
              </div>

              {module.scope === "TENANT" && (
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Lock className="size-3 text-muted-foreground" />
                    {t("modules.field_min_tier")}
                  </Label>
                  <Select
                    value={selectedTier}
                    onValueChange={(val) => setSelectedTier(val as ModulePlanTier)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground text-xs">
                      <SelectItem value="FREE">{t("modules.tier_free")}</SelectItem>
                      <SelectItem value="STARTER">{t("modules.tier_starter")}</SelectItem>
                      <SelectItem value="PRO">{t("modules.tier_pro")}</SelectItem>
                      <SelectItem value="ENTERPRISE">{t("modules.tier_enterprise")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <Label className="text-xs font-medium text-foreground">
                  {t("modules.field_reason")}
                </Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("modules.field_reason_placeholder")}
                  className="h-8 text-xs bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* Mapped PBAC Permissions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
                <Lock className="size-3.5 text-primary" />
                {t("modules.field_mapped_permissions")}
              </h4>
              <Badge variant="outline" className="text-[10px] font-mono">
                {module.permissions.length}
              </Badge>
            </div>

            {module.permissions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-3 border border-dashed border-border rounded-lg text-center">
                {t("modules.no_permissions_mapped")}
              </p>
            ) : (
              <div className="divide-y divide-border/60 rounded-lg border border-border bg-card/50 overflow-hidden">
                {module.permissions.map((perm) => (
                  <div key={perm.code} className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {perm.code}
                      </span>
                      {perm.scope && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                          {perm.scope}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/90 font-medium">
                      {perm.name}
                    </p>
                    {perm.description && (
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {perm.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="p-4 border-t border-border bg-card/40 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {t("modules.action_cancel")}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? t("common.saving") : t("modules.action_save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
