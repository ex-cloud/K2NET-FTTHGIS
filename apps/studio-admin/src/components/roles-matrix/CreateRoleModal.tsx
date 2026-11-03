import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Textarea,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { ShieldPlus, Pencil, Server, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRole, updateRole } from "./rolesMatrixApi";
import type { Role } from "./types";
import { cn } from "@/lib/utils";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope: "SYSTEM" | "TENANT";
  editingRole?: Role | null;
  token?: string;
  onSuccess: () => void;
}

export function CreateRoleModal({
  open,
  onOpenChange,
  defaultScope,
  editingRole,
  token,
  onSuccess,
}: CreateRoleModalProps) {
  const { t } = useTranslation();
  const [scope, setScope] = useState<"SYSTEM" | "TENANT">(defaultScope);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(editingRole);

  useEffect(() => {
    if (!open) return;
    if (editingRole) {
      setScope(editingRole.scope === "SYSTEM" ? "SYSTEM" : "TENANT");
      setName(editingRole.name || "");
      setDisplayName(editingRole.displayName || editingRole.name || "");
      setDescription(editingRole.description || "");
    } else {
      setScope(defaultScope);
      setName("");
      setDisplayName("");
      setDescription("");
    }
  }, [open, editingRole, defaultScope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const cleanKey = name.trim().toLowerCase().replaceAll(/[^a-z0-9_]/g, "_");
      const cleanDisplay = displayName.trim() || name.trim().toUpperCase();
      const cleanDesc = description.trim() || undefined;

      if (editingRole) {
        await updateRole(
          editingRole.id,
          {
            name: editingRole.isSystemRole ? undefined : cleanKey,
            displayName: cleanDisplay,
            description: cleanDesc,
          },
          token
        );
        toast.success(t("security.role_updated_success", { name: cleanDisplay }));
      } else {
        await createRole(
          {
            name: cleanKey,
            displayName: cleanDisplay,
            description: cleanDesc,
            scope,
            permissionIds: [],
          },
          token
        );
        toast.success(t("security.role_created_success", { name: cleanDisplay }));
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const fallback = editingRole ? t("security.failed_update_role") : t("security.failed_create_role");
      const msg = err instanceof Error ? err.message : fallback;
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[460px] p-0 overflow-hidden shadow-xl text-foreground">
        <DialogHeader className="p-6 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            {isEditMode ? (
              <Pencil className="w-4 h-4 text-primary" />
            ) : (
              <ShieldPlus className="w-4 h-4 text-primary" />
            )}
            <span>
              {isEditMode ? t("security.edit_role_modal_title") : t("security.create_role_modal_title")}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditMode ? t("security.edit_role_modal_desc") : t("security.create_role_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Scope Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">{t("security.role_scope")}</Label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/40 border border-border">
              <button
                type="button"
                disabled={isEditMode}
                onClick={() => setScope("TENANT")}
                className={cn(
                  "py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  isEditMode ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                  scope === "TENANT"
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="size-3.5" />
                <span>{t("security.tenant_templates")}</span>
              </button>
              <button
                type="button"
                disabled={isEditMode}
                onClick={() => setScope("SYSTEM")}
                className={cn(
                  "py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  isEditMode ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                  scope === "SYSTEM"
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Server className="size-3.5" />
                <span>{t("security.system_plane")}</span>
              </button>
            </div>
          </div>

          {/* 2. Identifier Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              {t("security.role_identifier_label")} <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder={t("security.role_identifier_placeholder")}
              value={name}
              disabled={Boolean(editingRole?.isSystemRole)}
              onChange={(e) => {
                setName(e.target.value);
                if (!displayName && !isEditMode) {
                  setDisplayName(e.target.value.replace(/_/g, " ").toUpperCase());
                }
              }}
              className="bg-card border-border text-foreground h-9 text-xs font-mono"
              required
            />
          </div>

          {/* 3. Display Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">{t("security.role_display_name")}</Label>
            <Input
              placeholder={t("security.role_display_name_placeholder")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-card border-border text-foreground h-9 text-xs"
            />
          </div>

          {/* 4. Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">{t("security.role_description_label")}</Label>
            <Textarea
              placeholder={t("security.role_description_placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-card border-border text-foreground text-xs min-h-[70px]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs cursor-pointer"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || isSubmitting}
              className="text-xs font-medium bg-primary text-primary-foreground cursor-pointer gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{isEditMode ? t("security.saving_role") : t("security.creating_role")}</span>
                </>
              ) : isEditMode ? (
                t("common.save")
              ) : (
                t("security.create_role")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
