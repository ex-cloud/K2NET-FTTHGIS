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
import { UserCog, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@k2net/i18n";
import { apiClient } from "../../lib/api-client";
import { getCurrentOrgSlug } from "../../lib/domain";

export interface EditableMember {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  status: string;
  roleName?: string;
  roleDisplayName?: string;
}

interface RoleOptionDto {
  id: number;
  name: string;
  displayName?: string;
  code?: string;
}

interface TeamMemberEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: EditableMember | null;
  onSuccess?: () => void;
}

export function TeamMemberEditModal({
  open,
  onOpenChange,
  member,
  onSuccess,
}: TeamMemberEditModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const orgSlug = getCurrentOrgSlug() || "system";

  const [fullName, setFullName] = React.useState("");
  const [roleName, setRoleName] = React.useState("noc");
  const [jobTitle, setJobTitle] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [status, setStatus] = React.useState("ACTIVE");
  const [isSaving, setIsSaving] = React.useState(false);

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

  React.useEffect(() => {
    if (member && open) {
      setFullName(member.fullName || member.username || "");
      setRoleName((member.roleName || "viewer").toLowerCase());
      setJobTitle(member.jobTitle || "");
      setPhone(member.phone && member.phone !== "—" ? member.phone : "");
      setStatus(member.status || "ACTIVE");
    }
  }, [member, open]);

  const roleOptions = React.useMemo(() => {
    if (Array.isArray(availableRoles) && availableRoles.length > 0) {
      return availableRoles.map((r) => ({
        value: r.name.toLowerCase(),
        label: r.displayName || r.name.toUpperCase(),
      }));
    }
    return [
      { value: "admin", label: t("users.role_org_admin") },
      { value: "noc", label: t("users.role_operator") },
      { value: "technician", label: t("users.role_field_tech") },
      { value: "surveyor", label: t("users.role_surveyor") },
      { value: "finance", label: t("users.role_finance") },
      { value: "helpdesk", label: t("users.role_helpdesk") },
      { value: "viewer", label: t("users.role_viewer") },
    ];
  }, [availableRoles, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsSaving(true);
    try {
      await apiClient(`/api/v1/users/${encodeURIComponent(member.id)}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: fullName.trim() || member.fullName,
          role: roleName,
          status,
          jobTitle: jobTitle.trim(),
          phone: phone.trim(),
          reason: "Updated by Tenant Administrator",
        }),
      });

      toast.success(t("users.member_updated_success"));
      await queryClient.invalidateQueries({ queryKey: ["tenant-team-members", orgSlug] });
      await queryClient.invalidateQueries({ queryKey: ["user-profile-pbac"] });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/80 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <UserCog className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {t("users.edit_member_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("users.edit_member_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("users.invite_email")}</Label>
            <Input
              value={member?.email || ""}
              disabled
              className="h-8 text-xs font-mono bg-muted/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("users.invite_full_name")}</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("users.invite_full_name_placeholder")}
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("users.member_role_label")}</Label>
              <Select value={roleName} onValueChange={setRoleName}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("users.member_status_label")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs">
                    {t("users.status_active")}
                  </SelectItem>
                  <SelectItem value="SUSPENDED" className="text-xs">
                    {t("users.status_suspended")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("users.member_job_title")}</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={t("users.member_job_title_placeholder")}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("users.member_phone")}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62812..."
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSaving}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  {t("users.member_save_btn")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
