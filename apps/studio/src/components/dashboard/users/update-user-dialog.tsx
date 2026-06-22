"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/types/user";
import { useSession } from "next-auth/react";
import { updateUser } from "@/lib/api/users";
import { useRouter } from "next/navigation";
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
      toast.success("User updated successfully");
      setReason("");
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error("Failed to update user");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-border/40">
        <DialogHeader>
          <DialogTitle>Edit User Access</DialogTitle>
          <DialogDescription>
            Update role and status for {user?.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role Assignment</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
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
              Changing role will update permissions immediately.
            </p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Account Status</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === "ACTIVE" ? "default" : "outline"}
                className={
                  status === "ACTIVE"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : ""
                }
                onClick={() => setStatus("ACTIVE")}
              >
                Active
              </Button>
              <Button
                type="button"
                variant={status === "INACTIVE" ? "destructive" : "outline"}
                onClick={() => setStatus("INACTIVE")}
              >
                Inactive
              </Button>
            </div>
          </div>

          {/* Audit Notes / Reason */}
          <div className="space-y-2">
            <Label className="flex justify-between">
              <span>Reason for Change / Audit Notes <span className="text-destructive">*</span></span>
              <span className="text-[10px] text-muted-foreground">Min. 5 characters</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a valid business reason for modifying this user's access or status..."
              className="resize-none h-20"
            />
            <p className="text-[10px] text-muted-foreground">
              This action will be permanently recorded in the system audit logs.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !isValid}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
