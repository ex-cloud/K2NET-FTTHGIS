"use client";

import React, { useState } from "react";
import { 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  Loader2, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Lock, 
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Badge } from "../badge";

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
  plan?: string;
  planDisplayName?: string;
  authMode?: string;
  status?: string;
  allowedMethods?: AuthMethod[];
  primaryAuthMethod?: string;
  submitLabel?: string;
  onContinueWithEmail?: (email: string) => void;
  onContinueWithProvider?: (providerId: string) => void;
  isLoading?: boolean;
  defaultEmail?: string;
  errorMessage?: string | null;
}

export function AuthLoginForm({
  allowedMethods = [],
  primaryAuthMethod,
  title,
  description,
  logoUrl,
  orgName,
  plan = "FREE",
  planDisplayName,
  authMode,
  status = "ACTIVE",
  submitLabel,
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

  const isSuspended = status === "SUSPENDED" || status === "TRIAL_EXPIRED";
  const isInternal = plan?.toUpperCase() === "INTERNAL";
  const isFreePlan = !isInternal && (!plan || plan.toUpperCase() === "FREE" || plan.toUpperCase() === "BASIC");
  const isProPlan = !isInternal && (plan?.toUpperCase() === "PRO" || plan?.toUpperCase() === "PROFESSIONAL");
  const isEnterprisePlan = !isInternal && plan?.toUpperCase() === "ENTERPRISE";

  const resolvedSubmitLabel = submitLabel || (
    isInternal
      ? "Continue with Keycloak SSO"
      : isEnterprisePlan || authMode === "ENTERPRISE_SAML_MFA"
      ? "Continue with Enterprise SSO" 
      : "Sign In with Password"
  );

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

      {/* Subscription Inactive / Suspended Warning */}
      {isSuspended && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-semibold">Masa Berlaku Langganan Berakhir</strong>
            <span className="text-[11px] leading-relaxed text-destructive/90">
              Workspace organisasi ini saat ini sedang ditangguhkan. Silakan hubungi tim administrator K2NET untuk mengaktifkan kembali langganan.
            </span>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-card/60 border border-border/70 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        {/* Tenant Identity & Subscription Tier Header */}
        {(orgName || title) && (
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5 min-w-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={orgName || "Logo"}
                  className="size-7 rounded-lg object-contain border border-border/60 bg-background/50 p-0.5 shrink-0"
                />
              ) : (
                <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Building2 className="size-3.5" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate max-w-[190px]">
                  {orgName || title}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono truncate">
                  {description || (isInternal ? "System Management Core" : "ISP Workspace")}
                </span>
              </div>
            </div>

            {/* Tier Badge */}
            {isInternal && (
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400 text-[9px] font-mono font-bold tracking-wider shrink-0">
                {planDisplayName ? planDisplayName.toUpperCase() : "SYSTEM ADMIN"}
              </Badge>
            )}
            {isFreePlan && (
              <Badge variant="outline" className="bg-primary/5 border-primary/25 text-primary text-[9px] font-mono font-bold tracking-wider shrink-0">
                {planDisplayName ? planDisplayName.toUpperCase() : "FREE • 7 DAYS"}
              </Badge>
            )}
            {isProPlan && (
              <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-500 dark:text-cyan-400 text-[9px] font-mono font-bold tracking-wider shrink-0">
                {planDisplayName ? planDisplayName.toUpperCase() : "PROFESSIONAL"}
              </Badge>
            )}
            {isEnterprisePlan && (
              <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-500 dark:text-purple-400 text-[9px] font-mono font-bold tracking-wider shrink-0">
                {planDisplayName ? planDisplayName.toUpperCase() : "ENTERPRISE"}
              </Badge>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Email or Username Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="usernameOrEmail"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Account Email or Username
              </Label>
              <span className="text-[10px] text-primary/80 font-mono">Required</span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="e.g. admin@isp.net or admin.username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="pl-10 h-11 bg-background/60 border-border/70 rounded-xl text-sm focus-visible:ring-primary"
                disabled={isLoading || isSuspended}
              />
            </div>
          </div>

          {/* Primary Action Button */}
          <Button
            type="submit"
            disabled={isLoading || isSuspended}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all duration-200 group"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <>
                <span>{resolvedSubmitLabel}</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Tier UX Guidance Box */}
        {isInternal && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-mono text-amber-500 text-[10px] font-semibold">
                <Lock className="size-3" /> ACCESS MODE
              </span>
              <span className="font-mono text-[10px] font-bold text-amber-500">MASTER IAM & MFA</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Autentikasi tingkat sistem dengan proteksi Keycloak IAM Master Realm dan penegakan MFA wajib.
            </p>
          </div>
        )}

        {isFreePlan && (
          <div className="rounded-xl border border-border/70 bg-background/40 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-mono text-muted-foreground text-[10px] font-semibold">
                <KeyRound className="size-3 text-primary" /> LOGIN METHOD
              </span>
              <span className="font-mono text-[10px] font-bold text-primary">EMAIL + PASSWORD</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Otentikasi mandiri berbasis password. Opsi Google Workspace SSO & SAML IdP aktif pada paket Pro & Enterprise.
            </p>
          </div>
        )}

        {isProPlan && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-mono text-cyan-500 text-[10px] font-semibold">
                <Sparkles className="size-3" /> LOGIN METHODS
              </span>
              <span className="font-mono text-[10px] font-bold text-cyan-500">PASSWORD + GOOGLE SSO</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Tersedia login menggunakan kredensial password langsung atau Single Sign-On Google Workspace.
            </p>
          </div>
        )}

        {isEnterprisePlan && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-mono text-purple-500 text-[10px] font-semibold">
                <Lock className="size-3" /> ENTERPRISE IAM
              </span>
              <span className="font-mono text-[10px] font-bold text-purple-500">SAML IdP & MFA</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Integrasi langsung Identity Provider perusahaan (Okta, Azure AD, SAML 2.0) dengan penegakan MFA wajib.
            </p>
          </div>
        )}

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
                  disabled={isLoading || isSuspended}
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
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <span>
          Akses terisolasi multi-tenant. Seluruh aktivitas login dipantau dan diaudit secara kriptografis sesuai standar kepatuhan ISP K2NET.
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
