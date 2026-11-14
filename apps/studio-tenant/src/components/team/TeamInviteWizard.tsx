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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { UserPlus, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";
import { useTranslation } from "@k2net/i18n";

interface RoleOptionDto {
  id: number;
  name: string;
  displayName?: string;
}

interface TeamInviteWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TeamInviteWizard({ open, onOpenChange, onSuccess }: TeamInviteWizardProps) {
  const { t } = useTranslation();
  const orgSlug = getCurrentOrgSlug() || "system";
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [role, setRole] = React.useState("noc");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { data: availableRoles } = useQuery<RoleOptionDto[]>({
    queryKey: ["tenant-roles-catalog", orgSlug],
    queryFn: async () => {
      try {
        return await apiClient<RoleOptionDto[]>("/api/v1/roles?scope=TENANT");
      } catch {
        return [];
      }
    },
    enabled: open,
    staleTime: 60 * 1000,
  });

  const roleOptions = React.useMemo(() => {
    if (Array.isArray(availableRoles) && availableRoles.length > 0) {
      return availableRoles.map((r) => ({
        value: r.name.toLowerCase(),
        label: r.displayName || r.name.toUpperCase(),
      }));
    }
    return [
      { value: "noc", label: t("users.role_operator") },
      { value: "admin", label: t("users.role_org_admin") },
      { value: "technician", label: t("users.role_field_tech") },
      { value: "surveyor", label: t("users.role_surveyor") },
      { value: "finance", label: t("users.role_finance") },
      { value: "helpdesk", label: t("users.role_helpdesk") },
      { value: "viewer", label: t("users.role_viewer") },
    ];
  }, [availableRoles, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error(t("users.invite_error_email"));
      return;
    }
    if (!fullName.trim()) {
      toast.error(t("users.invite_error_name"));
      return;
    }

    setIsSubmitting(true);
    try {
      const orgSlug = getCurrentOrgSlug() || "system";
      await apiClient(`/api/v1/organizations/${orgSlug}/members/invite`, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          roleName: role,
        }),
      });

      toast.success(t("users.invite_success", { email }));
      setEmail("");
      setFullName("");
      setRole("noc");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || t("users.invite_error_email");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">{t("users.invite_title")}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("users.invite_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("users.invite_full_name")}</Label>
            <Input
              placeholder={t("users.invite_full_name_placeholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-8.5 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("users.invite_email")}</Label>
            <Input
              type="email"
              placeholder="budi@ispnet.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8.5 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("users.invite_role_label")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
            {t("users.invite_notice")}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("users.invite_sending")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("users.invite_send_btn")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
