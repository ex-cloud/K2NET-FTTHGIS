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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { Edit, Phone, Briefcase, Shield, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import type { TenantUser, DynamicRole } from "./types";

interface EditMemberDialogProps {
  user: TenantUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles?: DynamicRole[];
  token?: string;
  onSuccess: () => void;
}

export function EditMemberDialog({
  user,
  open,
  onOpenChange,
  roles = [],
  token,
  onSuccess,
}: EditMemberDialogProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setJobTitle(user.jobTitle || "");
      setPhone(user.phone && user.phone !== "—" ? user.phone : "");
      setRole(user.role || (roles[0]?.name || "admin"));
      setStatus(user.status || "ACTIVE");
    }
  }, [user, roles]);

  const handleSubmit = async () => {
    if (!user || !token) return;
    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const matchedRole = roles.find((r) => r.name.toLowerCase() === role.toLowerCase());
      const payload = {
        role: role.toLowerCase(),
        roleId: matchedRole?.id,
        status,
        jobTitle: jobTitle.trim(),
        phone: phone.trim(),
        reason: "Administrative member update",
      };

      const res = await httpClient(`${baseUrl}/users/${user.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update member profile");
      }

      toast.success(`Member ${user.name} successfully updated!`);
      onOpenChange(false);
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update member";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[450px] p-0 overflow-hidden shadow-xl text-foreground">
        <DialogHeader className="p-6 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Edit className="w-4 h-4 text-primary" />
            <span>Edit Member: {user.name}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update operational role, position, contact details, and account status.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="size-3 text-muted-foreground" /> Full Name &amp; Email
            </Label>
            <div className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs">
              <p className="font-semibold text-foreground">{user.name}</p>
              <p className="text-[11px] font-mono text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Briefcase className="size-3 text-muted-foreground" /> Job Title
              </Label>
              <Input
                placeholder="e.g. Lead Field Technician"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="bg-card border-border text-foreground h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="size-3 text-primary" /> WhatsApp / Phone
              </Label>
              <Input
                type="tel"
                placeholder="e.g. 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-card border-border text-foreground h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Dynamic Role Selection from Database */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="size-3 text-primary" /> Role &amp; Permission Level
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                <SelectValue placeholder="Select dynamic workspace role" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground text-xs">
                {roles.length === 0 ? (
                  <SelectItem value={role || "admin"}>{role || "admin"}</SelectItem>
                ) : (
                  roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{r.displayName || r.name}</span>
                        {r.code && <span className="text-[10px] text-primary/80 font-mono">[{r.code}]</span>}
                        {r.description && (
                          <span className="text-muted-foreground text-[11px] truncate max-w-[220px]">
                            — {r.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              Account Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground text-xs">
                <SelectItem value="ACTIVE">ACTIVE — Normal Workspace Access</SelectItem>
                <SelectItem value="SUSPENDED">SUSPENDED — Block Login &amp; Invalidate Tokens</SelectItem>
                <SelectItem value="PENDING">PENDING — Waiting Activation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs font-medium bg-primary text-primary-foreground cursor-pointer gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}