"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";

export interface AuthMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
  enabled: boolean;
}

export interface AuthLoginFormProps {
  title?: string;
  description?: string;
  logoUrl?: string;
  orgName?: string;
  allowedMethods?: AuthMethod[];
  primaryAuthMethod?: string;
  onContinueWithEmail?: (email: string) => void;
  onContinueWithProvider?: (providerId: string) => void;
  isLoading?: boolean;
  defaultEmail?: string;
  errorMessage?: string | null;
}

export function AuthLoginForm({
  allowedMethods = [],
  onContinueWithEmail,
  onContinueWithProvider,
  isLoading = false,
  defaultEmail = "",
  errorMessage = null,
}: AuthLoginFormProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState(defaultEmail);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onContinueWithEmail) {
      onContinueWithEmail(usernameOrEmail.trim());
    }
  };

  const socialMethods = allowedMethods.filter(
    (m) => m.enabled && (m.type === "social" || m.type === "saml" || m.type === "enterprise")
  );

  return (
    <div className="w-full space-y-4">
      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive animate-in fade-in">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Login Card (Matching Screenshot Form) */}
      <div className="bg-card/60 border border-border/70 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Email or Username Input */}
          <div className="space-y-2">
            <Label
              htmlFor="usernameOrEmail"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Account Email or Username
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="user@kdua.net or admin.user"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="pl-10 h-11 bg-background/60 border-border/70 rounded-xl text-sm focus-visible:ring-primary"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Primary Action Button: Continue with Keycloak SSO */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all duration-200 group"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <>
                <span>Continue with Keycloak SSO</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Social Logins (Google Workspace SSO, SAML, etc.) */}
        {socialMethods.length > 0 && (
          <div className="space-y-3 pt-1">
            {/* Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-border/60" />
              <span className="absolute bg-card px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                OR CONTINUE WITH
              </span>
            </div>

            <div className="grid gap-2">
              {socialMethods.map((method) => (
                <Button
                  key={method.id}
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-xs font-semibold justify-center gap-2.5 border-border/70 bg-background/40 hover:bg-accent hover:text-foreground rounded-xl transition-all"
                  onClick={() => onContinueWithProvider && onContinueWithProvider(method.id)}
                  disabled={isLoading}
                >
                  {method.icon === "google" && <GoogleIcon className="h-4 w-4" />}
                  {method.icon === "github" && <GithubIcon className="h-4 w-4" />}
                  {method.icon !== "google" && method.icon !== "github" && (
                    <KeyRound className="h-4 w-4 text-primary" />
                  )}
                  <span>Continue with {method.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compliance / Security Notice Banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-primary leading-relaxed">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Authorized access only. All actions are logged and audited in accordance with global compliance standards.
        </span>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.57H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.43l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.57l4.03 3.15c.95-2.83 3.6-4.97 6.72-4.97Z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
