import * as React from "react";
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
  Switch,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Edit3, PlusCircle, Loader2, Tag } from "lucide-react";
import {
  useCreateMessageTemplate,
  useUpdateMessageTemplate,
  type MessageTemplate,
  type CreateMessageTemplateInput,
  type UpdateMessageTemplateInput,
} from "@/hooks/useMessageTemplates";

interface EditMessageTemplateModalProps {
  template: MessageTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AVAILABLE_VARIABLES = [
  "{{tenant_name}}",
  "{{plan_name}}",
  "{{due_date}}",
  "{{license_key}}",
  "{{invoice_number}}",
  "{{invoice_amount}}",
  "{{payment_link}}",
  "{{grace_days_remaining}}",
];

export function EditMessageTemplateModal({
  template,
  open,
  onOpenChange,
  onSuccess,
}: EditMessageTemplateModalProps) {
  const { t } = useTranslation();
  const isEditing = Boolean(template);

  const createMutation = useCreateMessageTemplate();
  const updateMutation = useUpdateMessageTemplate();

  const [code, setCode] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [channel, setChannel] = React.useState<string>("EMAIL");
  const [category, setCategory] = React.useState<string>("DUNNING");
  const [subjectTemplate, setSubjectTemplate] = React.useState<string>("");
  const [bodyTemplate, setBodyTemplate] = React.useState<string>("");
  const [active, setActive] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (open) {
      if (template) {
        setCode(template.code);
        setName(template.name);
        setChannel(template.channel);
        setCategory(template.category);
        setSubjectTemplate(template.subjectTemplate || "");
        setBodyTemplate(template.bodyTemplate);
        setActive(template.active);
      } else {
        setCode("");
        setName("");
        setChannel("EMAIL");
        setCategory("DUNNING");
        setSubjectTemplate("");
        setBodyTemplate("");
        setActive(true);
      }
      setErrorMsg(null);
    }
  }, [template, open]);

  const handleInsertVariable = (varText: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = bodyTemplate;
      const updated = current.substring(0, start) + varText + current.substring(end);
      setBodyTemplate(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + varText.length, start + varText.length);
      }, 0);
    } else {
      setBodyTemplate((prev) => prev + " " + varText);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isEditing && !code.trim()) {
      setErrorMsg("Template code is required (e.g. EXPIRING_7D)");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Template name is required");
      return;
    }
    if (!bodyTemplate.trim()) {
      setErrorMsg("Body template is required");
      return;
    }

    try {
      if (isEditing && template) {
        const payload: UpdateMessageTemplateInput = {
          name: name.trim(),
          channel,
          category,
          subjectTemplate: channel !== "WHATSAPP" ? subjectTemplate.trim() : undefined,
          bodyTemplate: bodyTemplate.trim(),
          active,
        };
        await updateMutation.mutateAsync({ id: template.id, payload });
      } else {
        const payload: CreateMessageTemplateInput = {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          channel,
          category,
          subjectTemplate: channel !== "WHATSAPP" ? subjectTemplate.trim() : undefined,
          bodyTemplate: bodyTemplate.trim(),
          active,
        };
        await createMutation.mutateAsync(payload);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save message template";
      setErrorMsg(message);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto p-6 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {isEditing ? (
                <Edit3 className="size-5 text-primary" />
              ) : (
                <PlusCircle className="size-5 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {isEditing
                  ? t("billing.templates_modal_edit_title")
                  : t("billing.templates_modal_create_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("billing.templates_modal_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-foreground">
                {t("billing.templates_code_label")}
              </Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isEditing}
                placeholder="EXPIRING_7D"
                className="h-8 text-xs font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-foreground">
                {t("billing.templates_name_label")}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pengingat H-7 Tagihan"
                className="h-8 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-foreground">
                {t("billing.templates_channel_label")}
              </Label>
              <div className="flex items-center gap-1.5 pt-0.5">
                {(["EMAIL", "WHATSAPP", "SMS"] as const).map((ch) => (
                  <Button
                    key={ch}
                    type="button"
                    variant={channel === ch ? "default" : "outline"}
                    size="xs"
                    onClick={() => setChannel(ch)}
                  >
                    {ch}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-foreground">
                {t("billing.templates_category_label")}
              </Label>
              <div className="flex items-center gap-1.5 pt-0.5">
                {(["DUNNING", "BILLING", "SYSTEM"] as const).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={category === cat ? "default" : "outline"}
                    size="xs"
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {channel !== "WHATSAPP" && (
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-foreground">
                {t("billing.templates_subject_label")}
              </Label>
              <Input
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                placeholder="[K2NET FTTH GIS] Pengingat H-7 Lisensi {{tenant_name}}"
                className="h-8 text-xs font-mono"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-foreground">
                {t("billing.templates_body_label")}
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Markdown / Text
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              placeholder="Tulis pesan template di sini..."
              rows={6}
              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-xs font-mono text-foreground shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
          </div>

          {/* Helper Variable Chips */}
          <div className="p-3 rounded-lg border border-border/70 bg-background/40 space-y-2">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag className="size-3 text-primary" />
              <span>{t("billing.templates_variables_label")}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVariable(v)}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted/60 hover:bg-muted text-foreground border border-border/80 transition-colors cursor-pointer"
                  title="Click to insert into message body"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-foreground font-medium">
              {t("billing.templates_active_label")}
            </span>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isEditing ? (
                <Edit3 className="size-3.5" />
              ) : (
                <PlusCircle className="size-3.5" />
              )}
              <span>{t("common.save")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
