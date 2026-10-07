import * as React from "react";
import { Archive, RotateCcw, Loader2 } from "lucide-react";
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
import { useProjects } from "../../hooks/useProjects";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { TenantFeatureUpgradeModal } from "./TenantFeatureUpgradeModal";
import { useNavigate } from "@tanstack/react-router";

export interface ArchivedProjectBannerProps {
  projectId?: string;
}

export function ArchivedProjectBanner({ projectId }: ArchivedProjectBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects, unarchiveProject } = useProjects();
  const { canCreateProject, usedProjects, maxProjects, tier } = useTenantSubscription();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

  const currentProject = React.useMemo(() => {
    if (!projectId || !projects) return null;
    return projects.find((p) => p.id === projectId) || null;
  }, [projectId, projects]);

  if (!currentProject || currentProject.status !== "ARCHIVED") {
    return null;
  }

  const handleOpenRestore = () => {
    if (!canCreateProject) {
      setUpgradeModalOpen(true);
    } else {
      setConfirmOpen(true);
    }
  };

  const handleConfirmRestore = async () => {
    if (!currentProject) return;
    setIsRestoring(true);
    try {
      await unarchiveProject(currentProject.id);
      setConfirmOpen(false);
    } catch (err: unknown) {
      setConfirmOpen(false);
      const isQuotaError =
        (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 409) ||
        !canCreateProject;
      if (isQuotaError) {
        setUpgradeModalOpen(true);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 py-2 border-b border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 text-foreground transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Archive className="h-3.5 w-3.5" />
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-tight truncate">
            <strong className="font-bold">{t("projects.archived_badge")}:</strong>{" "}
            {t("projects.archived_read_only_banner")}
          </p>
        </div>

        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={handleOpenRestore}
          className="h-6.5 px-2.5 text-[11px] font-semibold gap-1.5 shrink-0 border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 shadow-xs cursor-pointer"
        >
          <RotateCcw className="size-3 text-amber-600 dark:text-amber-400" />
          <span>{t("projects.restore_project")}</span>
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left space-y-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
              <RotateCcw className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {t("projects.restore_confirm_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("projects.restore_confirm_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/30 text-xs font-mono">
            <div className="flex justify-between items-center text-foreground">
              <span className="font-bold">{currentProject.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                {currentProject.code}
              </span>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={isRestoring}
              className="text-xs"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="text-xs font-semibold gap-1.5"
            >
              {isRestoring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("projects.restore_project")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quota Full Modal Interception */}
      <TenantFeatureUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        featureName={t("projects.project_capacity")}
        featureDescription={t("projects.quota_exceeded_desc", {
          used: usedProjects,
          max: maxProjects,
          tier: tier.toUpperCase(),
        })}
        onUpgradeClick={() => navigate({ to: "/billing" })}
      />
    </>
  );
}
