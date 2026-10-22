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
import { Eye, Mail, Smartphone, CheckCircle } from "lucide-react";
import {
  usePreviewMessageTemplate,
  type MessageTemplate,
} from "@/hooks/useMessageTemplates";

interface PreviewTemplateModalProps {
  template: MessageTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewTemplateModal({
  template,
  open,
  onOpenChange,
}: PreviewTemplateModalProps) {
  const { t } = useTranslation();
  const { mutateAsync: previewMutate } = usePreviewMessageTemplate();
  const [renderedSubject, setRenderedSubject] = React.useState<string>("");
  const [renderedBody, setRenderedBody] = React.useState<string>("");
  const [appliedVars, setAppliedVars] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (template && open) {
      previewMutate({
        subjectTemplate: template.subjectTemplate,
        bodyTemplate: template.bodyTemplate,
      })
        .then((res) => {
          setRenderedSubject(res.subject);
          setRenderedBody(res.body);
          if (res.appliedVariables) {
            setAppliedVars(res.appliedVariables);
          }
        })
        .catch(() => {
          setRenderedSubject(template.subjectTemplate || "");
          setRenderedBody(template.bodyTemplate);
          setAppliedVars({});
        });
    }
  }, [template, open, previewMutate]);

  if (!template) return null;

  const isWa = template.channel === "WHATSAPP";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] flex flex-col p-6 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Eye className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>{t("billing.templates_preview_title")}</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {template.channel}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {template.name} ({template.code})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs">
          {/* Header Preview for Email */}
          {template.subjectTemplate && (
            <div className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t("billing.templates_subject_label")}
              </span>
              <p className="font-mono text-xs font-semibold text-foreground">
                {renderedSubject || template.subjectTemplate}
              </p>
            </div>
          )}

          {/* Visual Container (Mockup Email vs WhatsApp) */}
          <div className="rounded-lg border border-border/80 overflow-hidden bg-background">
            <div className="px-3 py-2 border-b border-border/60 bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                {isWa ? <Smartphone className="size-3.5 text-primary" /> : <Mail className="size-3.5 text-primary" />}
                {isWa ? t("billing.templates_preview_mockup_wa") : t("billing.templates_preview_mockup_email")}
              </span>
              <span className="text-[10px] text-muted-foreground/80 font-mono">
                {t("billing.templates_preview_recipient")}
              </span>
            </div>

            <div className="p-4">
              {isWa ? (
                <div className="max-w-md mx-auto p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-foreground font-sans text-xs leading-relaxed whitespace-pre-line shadow-sm">
                  {renderedBody || template.bodyTemplate}
                </div>
              ) : (
                <div className="max-w-lg mx-auto p-4 rounded-md border border-border/60 bg-card text-foreground font-sans text-xs leading-relaxed whitespace-pre-line">
                  {renderedBody || template.bodyTemplate}
                </div>
              )}
            </div>
          </div>

          {/* Variables Reference */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-[11px] space-y-1.5 text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <CheckCircle className="size-3 text-primary" />
              <span>{t("billing.templates_preview_variables_applied")}</span>
            </span>
            {Object.keys(appliedVars).length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(appliedVars).map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-mono border border-border/50 text-foreground"
                  >
                    <span className="text-primary font-semibold">{k}:</span>
                    <span className="truncate max-w-[200px]" title={v}>{v}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[10px] text-muted-foreground/80">
                tenant_name · plan_name · due_date · license_key · invoice_number · invoice_amount · payment_link · grace_days_remaining
              </p>
            )}
          </div>
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
  );
}
