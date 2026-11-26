import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import type { useTranslation } from "@k2net/i18n";
import type {
  IamIntegrityFinding,
  IamIntegrityScanSummary,
} from "@/hooks/useSecuritySettings";

export type TranslateFn = ReturnType<typeof useTranslation>["t"];

export function FindingStatusBadge({
  kind,
  t,
}: {
  kind: string;
  t: TranslateFn;
}) {
  if (kind === "ORPHAN_ELIGIBLE") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/40 text-destructive bg-destructive/10 text-[10px] gap-1"
      >
        <ShieldAlert className="size-3" />
        {t("security.iam_integrity_type_eligible")}
      </Badge>
    );
  }
  if (kind === "UUID_DRIFT") {
    return (
      <Badge
        variant="outline"
        className="border-border text-foreground bg-muted text-[10px] gap-1"
      >
        <AlertTriangle className="size-3" />
        {t("security.iam_integrity_type_drift")}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-border text-muted-foreground text-[10px] gap-1"
    >
      <Clock className="size-3" />
      {t("security.iam_integrity_type_grace")}
    </Badge>
  );
}

export function IamIntegrityStatsGrid({
  summary,
  t,
}: {
  summary?: IamIntegrityScanSummary;
  t: TranslateFn;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="text-[11px] text-muted-foreground">
          {t("security.iam_integrity_stat_users")}
        </div>
        <div className="text-lg font-bold font-mono text-foreground mt-0.5">
          {summary ? `${summary.totalKeycloakUsers} / ${summary.totalDatabaseUsers}` : "—"}
        </div>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="text-[11px] text-muted-foreground">
          {t("security.iam_integrity_stat_eligible")}
        </div>
        <div className="text-lg font-bold font-mono text-destructive mt-0.5">
          {summary ? summary.orphanEligibleCount : "—"}
        </div>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="text-[11px] text-muted-foreground">
          {t("security.iam_integrity_stat_grace")}
        </div>
        <div className="text-lg font-bold font-mono text-foreground mt-0.5">
          {summary ? summary.orphanGracePeriodCount : "—"}
        </div>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/60 p-3">
        <div className="text-[11px] text-muted-foreground">
          {t("security.iam_integrity_stat_drift")}
        </div>
        <div className="text-lg font-bold font-mono text-foreground mt-0.5">
          {summary ? summary.uuidDriftCount : "—"}
        </div>
      </div>
    </div>
  );
}

export function IamIntegrityConfirmDialogs({
  confirmAllOpen,
  setConfirmAllOpen,
  purgeableCount,
  singleTarget,
  setSingleTarget,
  onConfirmAll,
  onConfirmSingle,
  t,
}: {
  confirmAllOpen: boolean;
  setConfirmAllOpen: (open: boolean) => void;
  purgeableCount: number;
  singleTarget: IamIntegrityFinding | null;
  setSingleTarget: (item: IamIntegrityFinding | null) => void;
  onConfirmAll: () => void;
  onConfirmSingle: () => void;
  t: TranslateFn;
}) {
  const singleLabel =
    singleTarget?.email || singleTarget?.username || singleTarget?.keycloakUserId || "";

  return (
    <>
      <Dialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {t("security.iam_integrity_confirm_all_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("security.iam_integrity_confirm_all_desc", { count: purgeableCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmAllOpen(false)}
              className="h-7 px-2.5 text-xs"
            >
              {t("security.iam_integrity_confirm_cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmAll}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {t("security.iam_integrity_confirm_submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(singleTarget)} onOpenChange={(open) => !open && setSingleTarget(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {t("security.iam_integrity_confirm_single_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("security.iam_integrity_confirm_single_desc", {
                user: singleLabel,
                realm: singleTarget?.realm || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSingleTarget(null)}
              className="h-7 px-2.5 text-xs"
            >
              {t("security.iam_integrity_confirm_cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmSingle}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {t("security.iam_integrity_confirm_submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
