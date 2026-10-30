import React from "react";
import { AlertTriangle } from "lucide-react";
import { useAuthLoginForm } from "./use-auth-login-form";
import { AuthLoginSavedProfiles } from "./auth-login-saved-profiles";
import { AuthLoginCredentials } from "./auth-login-credentials";
import type { AuthLoginFormProps } from "./auth-login-types";

export * from "./auth-login-types";
export * from "./use-auth-login-form";
export * from "./auth-login-saved-profiles";
export * from "./auth-login-credentials";

export function AuthLoginForm(props: AuthLoginFormProps) {
  const form = useAuthLoginForm(props);

  return (
    <div className="w-full space-y-4">
      {/* Subscription Inactive / Suspended Warning */}
      {form.isSuspended && (
        <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-semibold">{form.copy.suspendedTitle}</strong>
            <span className="text-[11px] leading-relaxed text-destructive/90">
              {form.copy.suspendedDesc}
            </span>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-card/60 border border-border/70 rounded-xl p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
        {form.authView === "SAVED_PROFILES" && form.savedProfiles.length > 0 && !props.mfaRequired ? (
          <AuthLoginSavedProfiles form={form} />
        ) : (
          <AuthLoginCredentials form={form} props={props} />
        )}
      </div>
    </div>
  );
}
