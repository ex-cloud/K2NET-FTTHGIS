import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
} from "@k2net/ui";
import { Box, MapPin, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "../../hooks/useProjects";
import { useTranslation } from "@k2net/i18n";

interface ProjectCreateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectCreateWizard({ open, onOpenChange }: ProjectCreateWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createProject, isCreating } = useProjects();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    region: "",
    description: "",
    centerLng: "107.6191",
    centerLat: "-6.9175",
    targetSubscribers: "1000",
  });

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: "",
      code: "",
      region: "",
      description: "",
      centerLng: "107.6191",
      centerLat: "-6.9175",
      targetSubscribers: "1000",
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error(t("projects.validation_name_required"));
        return;
      }
      if (!formData.code.trim()) {
        toast.error(t("projects.validation_code_required"));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        region: formData.region.trim() || undefined,
        description: formData.description.trim(),
        status: "ACTIVE" as const,
      };

      const result = await createProject(payload);
      toast.success(t("projects.create_success"));
      handleClose();

      if (result && result.id) {
        navigate({ to: `/project/${result.id}/overview` });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("projects.create_error");
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 border border-border/80 text-foreground/80">
              <Box className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {t("projects.wizard_modal_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("projects.wizard_step_of", { step })}:{" "}
                {step === 1
                  ? t("projects.wizard_step1_label")
                  : step === 2
                    ? t("projects.wizard_step2_label")
                    : t("projects.wizard_step3_label")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-2 py-1">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
        </div>

        {/* Step 1: Informasi Dasar */}
        {step === 1 && (
          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t("projects.project_name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder={t("projects.name_placeholder")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-8.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t("projects.project_code_label")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder={t("projects.code_placeholder")}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("projects.col_project_region")}</Label>
                <Input
                  placeholder="e.g. Jawa Barat / Bandung"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="h-8.5 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("projects.description_label")}</Label>
              <Textarea
                placeholder={t("projects.description_placeholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-xs min-h-[70px] resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Konfigurasi GIS & Koordinat */}
        {step === 2 && (
          <div className="space-y-3.5 py-2">
            <div className="rounded-lg bg-muted/40 p-3 border border-border/60 flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("projects.center_coords_hint")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("projects.center_lng_label")}</Label>
                <Input
                  placeholder="107.6191"
                  value={formData.centerLng}
                  onChange={(e) => setFormData({ ...formData, centerLng: e.target.value })}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("projects.center_lat_label")}</Label>
                <Input
                  placeholder="-6.9175"
                  value={formData.centerLat}
                  onChange={(e) => setFormData({ ...formData, centerLat: e.target.value })}
                  className="h-8.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("projects.target_subscribers_label")}</Label>
              <Input
                type="number"
                placeholder="1000"
                value={formData.targetSubscribers}
                onChange={(e) => setFormData({ ...formData, targetSubscribers: e.target.value })}
                className="h-8.5 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirmation Summary */}
        {step === 3 && (
          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">{t("projects.project_name")}:</span>
                <span className="text-xs font-bold text-foreground">{formData.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">{t("projects.project_code")}:</span>
                <span className="text-xs font-mono font-semibold text-primary">{formData.code}</span>
              </div>
              {formData.region && (
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">{t("projects.col_project_region")}:</span>
                  <span className="text-xs font-semibold text-foreground">{formData.region}</span>
                </div>
              )}
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">{t("common.status")}:</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {t("projects.status_active")}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">{t("projects.center_coords_label")}:</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {formData.centerLng}, {formData.centerLat}
                </span>
              </div>
              {formData.description && (
                <div className="pt-1">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">{t("common.description")}:</span>
                  <p className="text-xs text-foreground bg-muted/30 p-2 rounded-md">
                    {formData.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2 pt-2 sm:justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={isCreating}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("common.back")}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isCreating}
              className="text-xs"
            >
              {t("common.cancel")}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleNext}
                className="text-xs gap-1.5 font-semibold"
              >
                {t("common.next")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSubmit}
                disabled={isCreating}
                className="text-xs gap-1.5 font-semibold"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("inventory.saving")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("projects.create_project_btn")}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
