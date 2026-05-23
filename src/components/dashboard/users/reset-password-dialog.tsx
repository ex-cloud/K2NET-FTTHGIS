"use client";

import { useState } from "react";
import { User } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Key, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getBaseUrl } from "@/lib/domain";

import { useSession } from "next-auth/react";

interface ResetPasswordDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token?: string;
}

export function ResetPasswordDialog({ user, open, onOpenChange, token }: ResetPasswordDialogProps) {
  const { data: session } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [temporary, setTemporary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setShowPassword(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Validation Error", {
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    const activeToken = token || session?.accessToken;

    if (!activeToken) {
      toast.error("Authentication Error", {
        description: "You must be logged in to perform this action.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/v1/users/${user.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          newPassword,
          temporary,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to reset password");
      }

      toast.success("Password Reset Successful", {
        description: `Password for ${user.email} has been updated.`,
      });
      
      onOpenChange(false);
      setNewPassword("");
    } catch (error) {
      toast.error("Reset Failed", {
        description: error instanceof Error ? error.message : "An error occurred while trying to reset the password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#0c0c0c] border border-zinc-800/60 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-500" />
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Set a new password for <strong className="text-zinc-200">{user.email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-zinc-900 border-zinc-800 pr-20"
              />
              <div className="absolute right-1 top-1 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
                  onClick={generateRandomPassword}
                  title="Generate Random"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="temporary" 
              checked={temporary} 
              onCheckedChange={(checked) => setTemporary(checked === true)}
              className="mt-1 border-zinc-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="temporary"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Temporary Password
              </label>
              <p className="text-[12px] text-zinc-500">
                User will be forced to change this password on their next login.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSubmitting || !newPassword}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
