import { useState, useEffect } from "react";
import type { User } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Checkbox,
} from "@k2net/ui";
import { Key, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";

interface PasswordPolicy {
  minLength: number;
  requireSymbols: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  historyLimit: number;
  expiryDays: number;
}

interface ResetPasswordDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token?: string;
}

function generateRandom(minLength = 8): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const num = "0123456789";
  const sym = "!@#$%^&*";
  const all = lower + upper + num + sym;

  let password = "";
  password += lower.charAt(Math.floor(Math.random() * lower.length));
  password += upper.charAt(Math.floor(Math.random() * upper.length));
  password += num.charAt(Math.floor(Math.random() * num.length));
  password += sym.charAt(Math.floor(Math.random() * sym.length));

  const targetLength = Math.max(12, minLength);
  for (let i = 4; i < targetLength; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }
  return password.split("").sort(() => 0.5 - Math.random()).join("");
}

function validatePasswordRules(password: string, policy: PasswordPolicy | null): string | null {
  const minLen = policy?.minLength || 8;
  if (!password || password.length < minLen) {
    return `Password must be at least ${minLen} characters long.`;
  }
  if (policy?.requireUppercase && !/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter (A-Z).";
  }
  if (policy?.requireNumbers && !/[0-9]/.test(password)) {
    return "Password must contain at least one numeric digit (0-9).";
  }
  if (policy?.requireSymbols && !/[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-]/.test(password)) {
    return "Password must contain at least one special character/symbol.";
  }
  return null;
}

function PasswordPolicyRuleIndicators({
  password,
  policy,
}: {
  password: string;
  policy: PasswordPolicy;
}) {
  if (password.length === 0) return null;

  return (
    <div className="pt-1.5 space-y-1 text-[10px]">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${password.length >= policy.minLength ? "bg-primary" : "bg-red-500"}`} />
        <span className={password.length >= policy.minLength ? "text-muted-foreground line-through font-light" : "text-muted-foreground"}>
          Min. {policy.minLength} characters
        </span>
      </div>
      {policy.requireUppercase && (
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? "bg-primary" : "bg-red-500"}`} />
          <span className={/[A-Z]/.test(password) ? "text-muted-foreground line-through font-light" : "text-muted-foreground"}>
            At least one uppercase letter (A-Z)
          </span>
        </div>
      )}
      {policy.requireNumbers && (
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? "bg-primary" : "bg-red-500"}`} />
          <span className={/[0-9]/.test(password) ? "text-muted-foreground line-through font-light" : "text-muted-foreground"}>
            At least one numeric digit (0-9)
          </span>
        </div>
      )}
      {policy.requireSymbols && (
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-]/.test(password) ? "bg-primary" : "bg-red-500"}`} />
          <span className={/[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-]/.test(password) ? "text-muted-foreground line-through font-light" : "text-muted-foreground"}>
            At least one special character/symbol
          </span>
        </div>
      )}
    </div>
  );
}

export function ResetPasswordDialog({ user, open, onOpenChange, token }: ResetPasswordDialogProps) {
  const { data: session } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [temporary, setTemporary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy | null>(null);

  useEffect(() => {
    const activeToken = token || session?.accessToken;
    if (open && activeToken) {
      fetch("/api/v1/users/password-policy", {
        headers: { Authorization: `Bearer ${activeToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setPasswordPolicy(data))
        .catch((err) => console.error("Error loading password policy:", err));
    }
  }, [open, token, session]);

  const handleGenerate = () => {
    setNewPassword(generateRandom(passwordPolicy?.minLength || 8));
    setShowPassword(true);
  };

  const handleResetPassword = async () => {
    const validationError = validatePasswordRules(newPassword, passwordPolicy);
    if (validationError) {
      return toast.error("Validation Error", { description: validationError });
    }

    const activeToken = token || session?.accessToken;
    if (!activeToken) {
      return toast.error("Authentication Error", { description: "You must be logged in to perform this action." });
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/users/${user.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ newPassword, temporary }),
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
      <DialogContent className="sm:max-w-[425px] bg-background border border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set a new password for <strong className="text-foreground">{user.email}</strong>.
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
                className="bg-muted border-border pr-20"
              />
              <div className="absolute right-1 top-1 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleGenerate}
                  title="Generate Random"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {passwordPolicy && (
              <PasswordPolicyRuleIndicators password={newPassword} policy={passwordPolicy} />
            )}
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="temporary"
              checked={temporary}
              onCheckedChange={(checked) => setTemporary(checked === true)}
              className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="temporary"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Temporary Password
              </label>
              <p className="text-[12px] text-muted-foreground">
                User will be forced to change this password on their next login.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting || !newPassword}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
