import React, { useState } from "react";
import { Input } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Separator } from "@k2net/ui";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";

interface PasswordPolicy {
  minLength: number;
  requireSymbols: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  historyLimit: number;
  expiryDays: number;
}

interface PasswordSecurityCardProps {
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  isSavingPassword: boolean;
  passwordPolicy: PasswordPolicy | null;
  onSubmit: (e: React.FormEvent) => void;
  themeAccentBg: string;
  themeAccentBorder: string;
  sessionUsername: string;
}

export function PasswordSecurityCard({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isSavingPassword,
  passwordPolicy,
  onSubmit,
  themeAccentBg,
  themeAccentBorder,
  sessionUsername,
}: PasswordSecurityCardProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const symbolRegex = /[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`\-]/;

  return (
    <div className="border border-border bg-muted/10 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Security &amp; Password</h2>
        <p className="text-[11px] text-muted-foreground">Update your login credentials securely.</p>
      </div>

      <form onSubmit={onSubmit}>
        {/* Hidden input to help browser autofill link this password change to the active logged-in user */}
        <input 
          type="text" 
          name="username" 
          value={sessionUsername} 
          readOnly 
          className="hidden" 
          autoComplete="username" 
        />
        <div className="p-6 space-y-6">
          
          {/* Current Password Field */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Password</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Enter your current password to authorize this change.</p>
            </div>
            <div className="md:col-span-2 relative max-w-xs w-full">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={`h-9 bg-background/50 border-border ${themeAccentBorder} text-xs text-foreground pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Separator className="border-border" />

          {/* New Password Field */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Password</h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                {passwordPolicy 
                  ? `Minimum ${passwordPolicy.minLength} characters with complexity rules.` 
                  : "Minimum 8 characters with letters, numbers, and symbols."}
              </p>
            </div>
            <div className="md:col-span-2 space-y-2 max-w-xs w-full">
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className={`h-9 bg-background/50 border-border ${themeAccentBorder} text-xs text-foreground pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Real-time rule indicator list */}
              {passwordPolicy && newPassword.length > 0 && (
                <div className="pt-1.5 space-y-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= passwordPolicy.minLength ? 'bg-primary' : 'bg-red-500'}`} />
                    <span className={newPassword.length >= passwordPolicy.minLength ? 'text-muted-foreground line-through font-light' : 'text-muted-foreground'}>
                      Min. {passwordPolicy.minLength} karakter
                    </span>
                  </div>
                  {passwordPolicy.requireUppercase && (
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-primary' : 'bg-red-500'}`} />
                      <span className={/[A-Z]/.test(newPassword) ? 'text-muted-foreground line-through font-light' : 'text-muted-foreground'}>
                        Setidaknya satu huruf besar (A-Z)
                      </span>
                    </div>
                  )}
                  {passwordPolicy.requireNumbers && (
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-primary' : 'bg-red-500'}`} />
                      <span className={/[0-9]/.test(newPassword) ? 'text-muted-foreground line-through font-light' : 'text-muted-foreground'}>
                        Setidaknya satu angka (0-9)
                      </span>
                    </div>
                  )}
                  {passwordPolicy.requireSymbols && (
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${symbolRegex.test(newPassword) ? 'bg-primary' : 'bg-red-500'}`} />
                      <span className={symbolRegex.test(newPassword) ? 'text-muted-foreground line-through font-light' : 'text-muted-foreground'}>
                        Setidaknya satu simbol (@, #, $, dll)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator className="border-border" />

          {/* Confirm New Password Field */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm New Password</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Re-enter your new password to verify.</p>
            </div>
            <div className="md:col-span-2 relative max-w-xs w-full">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={`h-9 bg-background/50 border-border ${themeAccentBorder} text-xs text-foreground pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-card/30 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Securing your account is our highest priority.</span>
          <Button
            type="submit"
            disabled={isSavingPassword || !newPassword || !currentPassword}
            className={`${themeAccentBg} text-foreground font-semibold text-xs h-8 px-4 flex items-center gap-1.5 transition-all shadow-md shadow-black/25`}
          >
            {isSavingPassword ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Change Password
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
