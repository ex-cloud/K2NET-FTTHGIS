import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Card,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Network, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import type { PlatformPackageItem } from "@/hooks/usePlatformPackages";

export interface DependencyMatrixModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: PlatformPackageItem[];
}

export function DependencyMatrixModal({
  open,
  onOpenChange,
  packages,
}: DependencyMatrixModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border text-foreground max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {t("packages.rules.title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("packages.rules.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 text-xs">
          {/* Explanation 3 Layers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-3.5 bg-muted/20 border-border flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{t("packages.rules.layer1_title")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("packages.rules.layer1_desc")}
              </p>
            </Card>

            <Card className="p-3.5 bg-muted/20 border-border flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-bold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t("packages.rules.layer2_title")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("packages.rules.layer2_desc")}
              </p>
            </Card>

            <Card className="p-3.5 bg-muted/20 border-border flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-sky-500 font-bold">
                <Layers className="h-3.5 w-3.5" />
                <span>{t("packages.rules.layer3_title")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("packages.rules.layer3_desc")}
              </p>
            </Card>
          </div>

          {/* Matrix Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 font-mono text-[11px] text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-3 py-2">{t("packages.rules.th_package")}</th>
                  <th className="px-3 py-2">{t("packages.rules.th_min_tier")}</th>
                  <th className="px-3 py-2">{t("packages.rules.th_prerequisites")}</th>
                  <th className="px-3 py-2">{t("packages.rules.th_conflicts")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {packages.map((pkg) => {
                  const hasPrereq = pkg.prerequisiteCodes && pkg.prerequisiteCodes.length > 0;
                  const hasConflict = pkg.conflictCodes && pkg.conflictCodes.length > 0;

                  return (
                    <tr key={pkg.packageCode} className="hover:bg-muted/10 transition-colors">
                      <td className="px-3 py-2 font-medium">
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">{pkg.packageName}</span>
                          <code className="text-[10px] text-muted-foreground font-mono">{pkg.packageCode}</code>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-primary font-semibold">
                        {pkg.minimumTier || "FREE"}
                      </td>
                      <td className="px-3 py-2">
                        {hasPrereq ? (
                          <div className="flex flex-wrap gap-1">
                            {pkg.prerequisiteCodes?.map((code) => (
                              <span key={code} className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20 font-mono text-[10px]">
                                {code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">{t("packages.rules.none_standalone")}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {hasConflict ? (
                          <div className="flex flex-wrap gap-1">
                            {pkg.conflictCodes?.map((code) => (
                              <span key={code} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono text-[10px] flex items-center gap-1">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 px-3 text-xs"
          >
            {t("packages.rules.close_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
