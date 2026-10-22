import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  GitBranch,
  PlusCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCcw,
  Boxes,
} from "lucide-react";
import type { SubscriptionPlanMaster } from "@/hooks/useSubscriptionPlans";
import {
  usePlanVersions,
  usePublishPlanVersion,
  type PlanVersion,
} from "@/hooks/usePlanVersions";
import { PublishVersionConfirmDialog } from "@/components/licenses/PublishVersionConfirmDialog";
import { CreatePlanVersionModal } from "@/components/licenses/CreatePlanVersionModal";

interface PlanVersionsModalProps {
  plan: SubscriptionPlanMaster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function PlanVersionsModal({
  plan,
  open,
  onOpenChange,
}: PlanVersionsModalProps) {
  const { t } = useTranslation();
  const { data: versions = [], isLoading, refetch, isFetching } = usePlanVersions(plan?.id);
  const publishMutation = usePublishPlanVersion(plan?.id);

  const [versionToPublish, setVersionToPublish] = React.useState<PlanVersion | null>(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = React.useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = React.useState<boolean>(false);

  if (!plan) return null;

  const handleOpenPublish = (version: PlanVersion) => {
    setVersionToPublish(version);
    setPublishConfirmOpen(true);
  };

  const handleConfirmPublish = async (versionId: string) => {
    await publishMutation.mutateAsync(versionId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-card border-border max-h-[85vh] flex flex-col p-6 text-foreground">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <GitBranch className="size-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span>{t("license.plans.versions_drawer_title", { name: plan.name })}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {versions.length} Versions
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {t("license.plans.versions_drawer_subtitle")}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="gap-1.5"
                >
                  <RefreshCcw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{t("common.refresh")}</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                  className="gap-1.5"
                >
                  <PlusCircle className="size-3.5" />
                  <span>{t("license.plans.create_version_btn")}</span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Versions Content List */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted/20 border border-border animate-pulse" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-dashed border-border/80">
                <Boxes className="size-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {t("license.plans.no_versions_found")}
                </p>
              </div>
            ) : (
              versions.map((ver) => {
                const isActive = ver.status === "ACTIVE";
                const isDraft = ver.status === "DRAFT";
                const isArchived = ver.status === "ARCHIVED";

                return (
                  <div
                    key={ver.id}
                    className={`p-4 rounded-lg border transition-all text-xs ${
                      isActive
                        ? "bg-primary/5 border-primary/40 shadow-sm"
                        : "bg-background/60 border-border/70 hover:border-border"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {ver.version}
                        </span>
                        {isActive && (
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-mono gap-1">
                            <CheckCircle2 className="size-3" />
                            {t("license.plans.active_version")}
                          </Badge>
                        )}
                        {isDraft && (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px] font-mono gap-1">
                            <Clock className="size-3" />
                            {t("license.plans.draft_version")}
                          </Badge>
                        )}
                        {isArchived && (
                          <Badge variant="outline" className="text-muted-foreground/70 border-border text-[10px] font-mono gap-1">
                            <Archive className="size-3" />
                            {t("license.plans.archived_version")}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">
                          {formatIdr(ver.priceMonthly)} / bln
                        </span>
                        {isDraft && (
                          <Button
                            variant="default"
                            size="xs"
                            onClick={() => handleOpenPublish(ver)}
                            disabled={publishMutation.isPending}
                            className="gap-1 text-[11px]"
                          >
                            <ArrowUpCircle className="size-3" />
                            <span>{t("license.plans.publish_action")}</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <span className="block text-muted-foreground/70">Hardware Quotas</span>
                        <span className="font-mono text-foreground font-medium">
                          {ver.maxOlts} OLT · {ver.maxOdps ?? 0} ODP · {ver.maxProjects} Proj
                        </span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground/70">Storage & Rate</span>
                        <span className="font-mono text-foreground font-medium">
                          {ver.maxStorageGb} GB · {ver.apiRateLimitRpm} RPM
                        </span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground/70">Features</span>
                        <span className="text-foreground font-medium">
                          {ver.hasSso ? "SSO" : "No SSO"} · {ver.hasApiAccess ? "API" : "No API"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground/70">Publisher</span>
                        <span className="font-mono text-foreground font-medium">
                          {ver.publishedBy || "SYSTEM"}
                        </span>
                      </div>
                    </div>

                    {ver.changelog && (
                      <div className="mt-2.5 pt-2 border-t border-border/40 text-[11px] text-muted-foreground/90 italic">
                        "{ver.changelog}"
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Dialogs */}
      <PublishVersionConfirmDialog
        version={versionToPublish}
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
        onConfirm={handleConfirmPublish}
        isSubmitting={publishMutation.isPending}
      />

      <CreatePlanVersionModal
        plan={plan}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => refetch()}
      />
    </>
  );
}
