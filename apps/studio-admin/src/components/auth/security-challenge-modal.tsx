"use client";

import * as React from "react";
import { 
  ShieldAlert, 
  Lock, 
  Loader2, 
  AlertCircle
} from "lucide-react";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@k2net/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SecurityChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function SecurityChallengeModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  title = "Security Verification",
  description = "Please enter your account password to confirm these sensitive changes."
}: SecurityChallengeModalProps) {
  const [password, setPassword] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) return;

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Identity verified successfully");
        onSuccess();
        onOpenChange(false);
        setPassword("");
      } else {
        setError(data.message || "Invalid password. Please try again.");
      }
    } catch {
      setError("Failed to verify password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#0c0c0c] border-[#1f1f1f] text-zinc-100 p-0 overflow-hidden outline-none shadow-2xl shadow-emerald-500/5">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <div className="size-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-medium tracking-tight text-zinc-100">
                {title}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs mt-0.5">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleVerify} className="p-6 pt-2 space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                className={cn(
                  "bg-[#141414] border-[#2a2a2a] focus:border-amber-500/50 focus:ring-amber-500/20 text-sm h-11 pl-10",
                  error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                )}
              />
            </div>
            {error && (
              <p className="text-[11px] text-red-500 flex items-center gap-1.5 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="size-3" /> {error}
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="flex-1 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 h-10"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isVerifying || !password}
              className="flex-1 bg-zinc-100 hover:bg-white text-black font-semibold h-10 shadow-lg shadow-white/5"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
