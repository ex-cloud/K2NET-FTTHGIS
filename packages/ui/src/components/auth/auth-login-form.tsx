import React, { useEffect, useRef, useState } from "react";
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
  Sparkles,
  Eye,
  EyeOff,
  Smartphone,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Badge } from "../badge";
import type { AuthLocale } from "./auth-login-layout";

export interface AuthMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
  enabled: boolean;
}

export interface AuthCredentialsSubmitPayload {
  username: string;
  password: string;
  rememberMe: boolean;
  totp?: string;
  turnstileToken?: string;
}

export interface AuthLoginFormLabels {
  accountEmailOrUsername?: string;
  accountPlaceholder?: string;
  requiredBadge?: string;
  passwordUpper?: string;
  passwordPlaceholder?: string;
  forgotPassword?: string;
  forgotPasswordNotice?: string;
  showPassword?: string;
  hidePassword?: string;
  rememberMeBrowser?: string;
  orContinueWith?: string;
  continueWithGoogle?: string;
  continueWithGithub?: string;
  continueWithProviderPrefix?: string;
  signInPlatformAdmin?: string;
  continueIspWorkspace?: string;
  mfaCodeLabel?: string;
  mfaCodePlaceholder?: string;
  mfaCodeHint?: string;
  mfaVerifySubmit?: string;
  mfaBackToLogin?: string;
  turnstileVerifying?: string;
  suspendedTitle?: string;
  suspendedDesc?: string;
  tierInternalLabel?: string;
  tierInternalValue?: string;
  tierInternalDesc?: string;
  tierFreeLabel?: string;
  tierFreeValue?: string;
  tierFreeDesc?: string;
  tierProLabel?: string;
  tierProValue?: string;
  tierProDesc?: string;
  tierEnterpriseLabel?: string;
  tierEnterpriseValue?: string;
  tierEnterpriseDesc?: string;
  complianceBanner?: string;
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
  onSubmitCredentials?: (payload: AuthCredentialsSubmitPayload) => void | Promise<void>;
  onContinueWithEmail?: (email: string) => void;
  onContinueWithProvider?: (providerId: string) => void;
  onForgotPassword?: (usernameOrEmail: string) => void;
  onResetMfaStep?: () => void;
  mfaRequired?: boolean;
  turnstileSiteKey?: string;
  isLoading?: boolean;
  defaultEmail?: string;
  errorMessage?: string | null;
  locale?: AuthLocale;
  labels?: AuthLoginFormLabels;
}

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (
      container: HTMLElement,
      options: {
        sitekey: string;
        action?: string;
        theme?: "auto" | "light" | "dark";
        size?: "normal" | "flexible" | "compact";
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }
    ) => string;
    reset?: (widgetId: string) => void;
    remove?: (widgetId: string) => void;
  };
}

export function AuthLoginForm({
  allowedMethods = [],
  title,
  description,
  logoUrl,
  orgName,
  plan = "FREE",
  planDisplayName,
  status = "ACTIVE",
  submitLabel,
  onSubmitCredentials,
  onContinueWithEmail,
  onContinueWithProvider,
  onForgotPassword,
  onResetMfaStep,
  mfaRequired = false,
  turnstileSiteKey,
  isLoading = false,
  defaultEmail = "",
  errorMessage = null,
  locale = "en",
  labels,
}: AuthLoginFormProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);


  // Mount Cloudflare Turnstile widget dynamically when turnstileSiteKey is configured
  useEffect(() => {
    const cleanKey = turnstileSiteKey?.trim();
    if (!cleanKey || typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    const win = window as TurnstileWindow;

    const mountWidget = () => {
      if (cancelled || !turnstileContainerRef.current || !win.turnstile) return;
      if (turnstileWidgetIdRef.current && win.turnstile.remove) {
        try {
          win.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore cleanup warning
        }
      }
      turnstileContainerRef.current.replaceChildren();
      turnstileWidgetIdRef.current = win.turnstile.render(turnstileContainerRef.current, {
        sitekey: cleanKey,
        action: "login",
        theme: "auto",
        size: "flexible",
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(undefined),
        "error-callback": () => setTurnstileToken(undefined),
      });
    };

    if (win.turnstile) {
      mountWidget();
    } else {
      const existingScript = document.getElementById("cf-turnstile-api-script") as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener("load", mountWidget);
      } else {
        const script = document.createElement("script");
        script.id = "cf-turnstile-api-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.addEventListener("load", mountWidget);
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (turnstileWidgetIdRef.current && win.turnstile?.remove) {
        try {
          win.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [turnstileSiteKey]);

  // Reset single-use Turnstile token when login attempts result in an error
  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as TurnstileWindow) : undefined;
    if (errorMessage && turnstileWidgetIdRef.current && win?.turnstile?.reset) {
      try {
        win.turnstile.reset(turnstileWidgetIdRef.current);
        setTurnstileToken(undefined);
      } catch {
        // ignore
      }
    }
  }, [errorMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = usernameOrEmail.trim();
    if (onSubmitCredentials) {
      void onSubmitCredentials({
        username: cleanUser,
        password,
        rememberMe,
        totp: mfaRequired ? totpCode.trim() : undefined,
        turnstileToken,
      });
      return;
    }
    if (onContinueWithEmail) {
      onContinueWithEmail(cleanUser);
    }
  };

  const handleForgotClick = () => {
    if (onForgotPassword) {
      onForgotPassword(usernameOrEmail.trim());
    } else {
      setShowForgotHelp((prev) => !prev);
    }
  };

  const handleBackFromMfa = () => {
    setTotpCode("");
    if (onResetMfaStep) {
      onResetMfaStep();
    }
  };

  const statusUpper = (status || "ACTIVE").toUpperCase();
  const isSuspended = statusUpper === "SUSPENDED" || statusUpper === "TRIAL_EXPIRED" || statusUpper === "DELETED";
  const planUpper = (plan || "FREE").toUpperCase();
  const isInternal = planUpper === "INTERNAL";
  const isProPlan = !isInternal && (planUpper === "PRO" || planUpper === "PROFESSIONAL");
  const isEnterprisePlan = !isInternal && planUpper === "ENTERPRISE";
  const isFreePlan = !isInternal && !isProPlan && !isEnterprisePlan;

  const copy = {
    accountEmailOrUsername: labels?.accountEmailOrUsername || "ACCOUNT EMAIL OR USERNAME",
    accountPlaceholder: labels?.accountPlaceholder || "e.g. admin@isp.net or admin.username",
    requiredBadge: labels?.requiredBadge || "Required",
    passwordUpper: labels?.passwordUpper || "PASSWORD",
    passwordPlaceholder: labels?.passwordPlaceholder || "••••••••••••",
    forgotPassword: labels?.forgotPassword || "Forgot password?",
    forgotPasswordNotice:
      labels?.forgotPasswordNotice ||
      "Contact your Workspace Owner or K2NET Platform Support to initiate a verified password reset.",
    showPassword: labels?.showPassword || "Show password",
    hidePassword: labels?.hidePassword || "Hide password",
    rememberMeBrowser: labels?.rememberMeBrowser || "Remember me on this browser",
    orContinueWith: labels?.orContinueWith || "OR CONTINUE WITH",
    continueWithGoogle: labels?.continueWithGoogle || "Continue with Google",
    continueWithGithub: labels?.continueWithGithub || "Continue with GitHub",
    continueWithProviderPrefix: labels?.continueWithProviderPrefix || "Continue with",
    signInPlatformAdmin: labels?.signInPlatformAdmin || "Sign In to Platform Admin",
    continueIspWorkspace: labels?.continueIspWorkspace || "Continue to ISP Workspace",
    mfaCodeLabel: labels?.mfaCodeLabel || "6-DIGIT AUTHENTICATOR CODE",
    mfaCodePlaceholder: labels?.mfaCodePlaceholder || "000000",
    mfaCodeHint:
      labels?.mfaCodeHint ||
      "Open your Authenticator app (Google Authenticator / Authy) and enter the 6-digit verification code.",
    mfaVerifySubmit: labels?.mfaVerifySubmit || "Verify & Sign In",
    mfaBackToLogin: labels?.mfaBackToLogin || "Use another account",
    suspendedTitle: labels?.suspendedTitle || "Subscription Suspended or Inactive",
    suspendedDesc:
      labels?.suspendedDesc ||
      "This organization workspace is currently suspended or awaiting activation. Please contact K2NET Platform Administration.",
    tierInternalLabel: labels?.tierInternalLabel || "ACCESS MODE",
    tierInternalValue: labels?.tierInternalValue || "MASTER IAM & MFA",
    tierInternalDesc:
      labels?.tierInternalDesc ||
      "System-level authentication protected by Keycloak Master IAM and step-up MFA enforcement.",
    tierFreeLabel: labels?.tierFreeLabel || "LOGIN METHOD",
    tierFreeValue: labels?.tierFreeValue || "EMAIL + PASSWORD",
    tierFreeDesc:
      labels?.tierFreeDesc ||
      "Native password authentication. Google Workspace & GitHub SSO unlock on Pro & Enterprise plans.",
    tierProLabel: labels?.tierProLabel || "LOGIN METHODS",
    tierProValue: labels?.tierProValue || "PASSWORD + SOCIAL SSO",
    tierProDesc:
      labels?.tierProDesc ||
      "Sign in directly with your account password or one-click Google & GitHub Single Sign-On.",
    tierEnterpriseLabel: labels?.tierEnterpriseLabel || "ENTERPRISE IAM",
    tierEnterpriseValue: labels?.tierEnterpriseValue || "SSO IdP & MFA",
    tierEnterpriseDesc:
      labels?.tierEnterpriseDesc ||
      "Direct Corporate Identity Provider integration with mandatory multi-factor authentication enforcement.",
    complianceBanner:
      labels?.complianceBanner ||
      "Multi-tenant isolated access. Every sign-in event is cryptographically monitored and audited under K2NET ISP security standards.",
  };

  const resolvedSubmitLabel =
    submitLabel ||
    (mfaRequired
      ? copy.mfaVerifySubmit
      : isInternal
      ? copy.signInPlatformAdmin
      : copy.continueIspWorkspace);

  const socialMethods = allowedMethods.filter(
    (m) => m.enabled && (m.type === "social" || m.type === "saml" || m.type === "enterprise")
  );

  const isSubmitDisabled =
    isLoading ||
    isSuspended ||
    !usernameOrEmail.trim() ||
    !password ||
    (mfaRequired && totpCode.trim().length < 6) ||
    (Boolean(turnstileSiteKey?.trim()) && !mfaRequired && !turnstileToken);

  return (
    <div className="w-full space-y-4">
      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive animate-in fade-in"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Subscription Inactive / Suspended Warning */}
      {isSuspended && (
        <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-semibold">{copy.suspendedTitle}</strong>
            <span className="text-[11px] leading-relaxed text-destructive/90">
              {copy.suspendedDesc}
            </span>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-card/60 border border-border/70 rounded-xl p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
        {/* 1. Identity Card Header + Tier Badge */}
        {(orgName || title) && (
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5 min-w-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={orgName || "Organization"}
                  className="size-8 rounded-md object-contain border border-border/60 bg-background/50 p-0.5 shrink-0"
                />
              ) : (
                <div className="size-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  {isInternal ? <ShieldCheck className="size-4" /> : <Building2 className="size-4" />}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate max-w-[185px]">
                  {orgName || title}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono truncate">
                  {description || (isInternal ? "Master IAM & Platform Operations" : "ISP Workspace & Operations")}
                </span>
              </div>
            </div>

            {isInternal && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400 text-[9px] font-mono font-medium tracking-wider shrink-0"
              >
                {planDisplayName ? planDisplayName.toUpperCase() : "SYSTEM ADMIN"}
              </Badge>
            )}
            {isFreePlan && (
              <Badge
                variant="outline"
                className="bg-primary/5 border-primary/25 text-primary text-[9px] font-mono font-medium tracking-wider shrink-0"
              >
                {planDisplayName ? planDisplayName.toUpperCase() : "STARTER TRIAL"}
              </Badge>
            )}
            {isProPlan && (
              <Badge
                variant="outline"
                className="bg-cyan-500/10 border-cyan-500/30 text-cyan-500 dark:text-cyan-400 text-[9px] font-mono font-medium tracking-wider shrink-0"
              >
                {planDisplayName ? planDisplayName.toUpperCase() : "PROFESSIONAL ISP"}
              </Badge>
            )}
            {isEnterprisePlan && (
              <Badge
                variant="outline"
                className="bg-purple-500/10 border-purple-500/30 text-purple-500 dark:text-purple-400 text-[9px] font-mono font-medium tracking-wider shrink-0"
              >
                {planDisplayName ? planDisplayName.toUpperCase() : "ENTERPRISE"}
              </Badge>
            )}
          </div>
        )}

        {/* 2. Social SSO Buttons ABOVE Form (Pro / Enterprise Tenants) */}
        {!mfaRequired && socialMethods.length > 0 && (
          <div className="space-y-3">
            <div className="grid gap-2">
              {socialMethods.map((method) => {
                const methodLabel =
                  method.icon === "google"
                    ? copy.continueWithGoogle
                    : method.icon === "github"
                    ? copy.continueWithGithub
                    : `${copy.continueWithProviderPrefix} ${method.name}`;

                return (
                  <Button
                    key={method.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-medium justify-center gap-2 border-border/80 bg-background/50 hover:bg-accent hover:text-foreground rounded-md transition-all shadow-xs cursor-pointer"
                    onClick={() => onContinueWithProvider && onContinueWithProvider(method.id)}
                    disabled={isLoading || isSuspended}
                  >
                    {method.icon === "google" && <GoogleIcon className="size-3.5" />}
                    {method.icon === "github" && <GithubIcon className="size-3.5" />}
                    {method.icon !== "google" && method.icon !== "github" && (
                      <KeyRound className="size-3.5 text-primary" />
                    )}
                    <span>{methodLabel}</span>
                  </Button>
                );
              })}
            </div>

            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-border/60" />
              <span className="absolute bg-card px-2.5 text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider">
                {copy.orContinueWith}
              </span>
            </div>
          </div>
        )}

        {/* 3. Full Native Credentials & Inline MFA Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!mfaRequired ? (
            <>
              {/* Account Email or Username Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="usernameOrEmail"
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {copy.accountEmailOrUsername}
                  </Label>
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded font-mono">
                    {copy.requiredBadge}
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="usernameOrEmail"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder={copy.accountPlaceholder}
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="pl-9 h-9 bg-background/60 border-border/70 rounded-md text-xs sm:text-sm focus-visible:ring-primary"
                    disabled={isLoading || isSuspended}
                    required
                  />
                </div>
              </div>

              {/* Password Input + Forgot Password + Show/Hide Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="accountPassword"
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {copy.passwordUpper}
                  </Label>
                  <button
                    type="button"
                    onClick={handleForgotClick}
                    className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    {copy.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="accountPassword"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={copy.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-9 bg-background/60 border-border/70 rounded-md text-xs sm:text-sm focus-visible:ring-primary"
                    disabled={isLoading || isSuspended}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                    title={showPassword ? copy.hidePassword : copy.showPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {showForgotHelp && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 border border-border/60 rounded-md p-2 leading-relaxed">
                    {copy.forgotPasswordNotice}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading || isSuspended}
                    className="size-3.5 rounded border-border bg-background accent-primary cursor-pointer"
                  />
                  <span>{copy.rememberMeBrowser}</span>
                </label>
              </div>

              {/* Optional Cloudflare Turnstile Anti-Bot Widget */}
              {Boolean(turnstileSiteKey?.trim()) && (
                <div className="pt-1">
                  <div ref={turnstileContainerRef} className="min-h-[65px] w-full overflow-hidden rounded-md" />
                </div>
              )}
            </>
          ) : (
            /* Inline 6-Digit MFA OTP Mode */
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="rounded-md border border-primary/25 bg-primary/5 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Smartphone className="size-3.5" />
                  <span>{copy.mfaCodeLabel}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {copy.mfaCodeHint}
                </p>
              </div>

              <div className="space-y-1.5">
                <Input
                  id="totpCode"
                  name="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder={copy.mfaCodePlaceholder}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  className="h-9 text-center font-mono tracking-[0.4em] text-sm bg-background/60 border-border/70 rounded-md focus-visible:ring-primary"
                  disabled={isLoading || isSuspended}
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleBackFromMfa}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3" />
                <span>{copy.mfaBackToLogin}</span>
              </button>
            </div>
          )}

          {/* 4. Primary Submit Button */}
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitDisabled}
            className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-all duration-200 group cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span>{resolvedSubmitLabel}</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* 5. Tier UX Guidance Box */}
        {isInternal && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-mono text-amber-500 text-[10px] font-semibold">
                <Lock className="size-3" /> {copy.tierInternalLabel}
              </span>
              <span className="font-mono text-[10px] font-bold text-amber-500">
                {copy.tierInternalValue}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {copy.tierInternalDesc}
            </p>
          </div>
        )}

        {isFreePlan && (
          <div className="rounded-md border border-border/70 bg-background/40 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-mono text-muted-foreground text-[10px] font-semibold">
                <KeyRound className="size-3 text-primary" /> {copy.tierFreeLabel}
              </span>
              <span className="font-mono text-[10px] font-bold text-primary">
                {copy.tierFreeValue}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {copy.tierFreeDesc}
            </p>
          </div>
        )}

        {isProPlan && (
          <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-mono text-cyan-500 text-[10px] font-semibold">
                <Sparkles className="size-3" /> {copy.tierProLabel}
              </span>
              <span className="font-mono text-[10px] font-bold text-cyan-500">
                {copy.tierProValue}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {copy.tierProDesc}
            </p>
          </div>
        )}

        {isEnterprisePlan && (
          <div className="rounded-md border border-purple-500/20 bg-purple-500/5 p-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-mono text-purple-500 text-[10px] font-semibold">
                <Lock className="size-3" /> {copy.tierEnterpriseLabel}
              </span>
              <span className="font-mono text-[10px] font-bold text-purple-500">
                {copy.tierEnterpriseValue}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {copy.tierEnterpriseDesc}
            </p>
          </div>
        )}
      </div>

      {/* Compliance / Security Notice Banner */}
      <div className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 p-3 text-[11px] text-primary leading-relaxed">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <span>{copy.complianceBanner}</span>
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
