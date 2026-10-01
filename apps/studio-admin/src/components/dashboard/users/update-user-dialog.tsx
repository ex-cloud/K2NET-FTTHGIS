import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@k2net/ui";
import { type User } from "@/types/user";
import { useSession } from "@/lib/auth-compat";
import { updateUser } from "@/lib/api/users";
import { useRouter } from "@/lib/navigation-compat";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UpdateUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateUserDialog({
  user,
  open,
  onOpenChange,
}: UpdateUserDialogProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<string>(user?.roleName || "");
  const [status, setStatus] = useState<string>(user?.status || "");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Sync state when user changes
  if (user && role === "" && user.roleName !== role) setRole(user.roleName);
  if (user && status === "" && user.status !== status) setStatus(user.status);

  const isValid = reason.trim().length >= 5;

  const handleSave = async () => {
    if (!user || !session?.accessToken || !isValid) return;

    setLoading(true);
    try {
      await updateUser(user.id, { role, status, reason: reason.trim() }, session.accessToken);
      toast.success(t("common.save"));
      setReason("");
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error(t("common.error"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-border/40">
        <DialogHeader>
          <DialogTitle>{t("security.edit_role")}</DialogTitle>
          <DialogDescription>
            {user?.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Role Assignment */}
          <div className="space-y-2">
            <Label>{t("security.role_name")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder={t("security.role_name")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {t("security.roles_matrix_subtitle")}
            </p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>{t("organizations.col_status")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === "ACTIVE" ? "default" : "outline"}
                className={
                  status === "ACTIVE"
                    ? "bg-primary hover:bg-primary/90"
                    : ""
                }
                onClick={() => setStatus("ACTIVE")}
              >
                {t("common.active")}
              </Button>
              <Button
                type="button"
                variant={status === "INACTIVE" ? "destructive" : "outline"}
                onClick={() => setStatus("INACTIVE")}
              >
                {t("common.inactive")}
              </Button>
            </div>
          </div>

          {/* Audit Notes / Reason */}
          <div className="space-y-2">
            <Label className="flex justify-between">
              <span>{t("security.audit_trail_title")} <span className="text-destructive">*</span></span>
              <span className="text-[10px] text-muted-foreground">Min. 5 characters</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="..."
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !isValid}
            className="bg-primary hover:bg-primary/90"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
