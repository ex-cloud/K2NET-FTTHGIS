import React, { useEffect, useRef, useState } from "react";
import {
  KeyRound,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  AlertTriangle,
  Eye,
  EyeOff,
  Smartphone,
  ArrowLeft,
  X,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import type { AuthLocale } from "./auth-login-layout";
import {
  getSavedProfiles,
  removeSavedProfile,
  type SavedAccountProfile,
} from "./saved-profiles";

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
  saveEmailOnDevice?: boolean;
  totp?: string;
  turnstileToken?: string;
}

export interface AuthLoginFormLabels {
  loginFailedTitle?: string;
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
  // Cloudflare-style Multi-Account Labels
  signInWithAnotherProfile?: string;
  viewSavedProfiles?: string;
  saveEmailOnDevice?: string;
  lastUsed?: string;
  removeSavedProfile?: string;
  savedProfilesTitle?: string;
  savedProfilesOr?: string;
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
  tenantSlug?: string;
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
  tenantSlug,
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
  // Saved profiles state
  const [savedProfiles, setSavedProfiles] = useState<SavedAccountProfile[]>(() =>
    getSavedProfiles(tenantSlug)
  );
  const [authView, setAuthView] = useState<"SAVED_PROFILES" | "CREDENTIALS">(() => {
    // If there is at least 1 saved profile and no explicit defaultEmail, start on saved profiles
    const initialProfiles = getSavedProfiles(tenantSlug);
    return initialProfiles.length > 0 && !defaultEmail ? "SAVED_PROFILES" : "CREDENTIALS";
  });

  const [usernameOrEmail, setUsernameOrEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [saveEmailOnDevice, setSaveEmailOnDevice] = useState(true);
  const [totpCode, setTotpCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const prevErrorRef = useRef<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Sync saved profiles whenever tenantSlug changes or after mounting
  useEffect(() => {
    setSavedProfiles(getSavedProfiles(tenantSlug));
  }, [tenantSlug]);

  // Mount Cloudflare Turnstile widget dynamically when turnstileSiteKey is configured
  useEffect(() => {
    const cleanKey = turnstileSiteKey?.trim();
    if (!cleanKey || typeof window === "undefined" || authView !== "CREDENTIALS") {
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
  }, [turnstileSiteKey, authView]);

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
        saveEmailOnDevice,
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

  // Profile actions
  const handleSelectProfile = (profile: SavedAccountProfile) => {
    setUsernameOrEmail(profile.email || profile.username || "");
    setPassword("");
    setAuthView("CREDENTIALS");
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleRemoveProfile = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    const updated = removeSavedProfile(email, tenantSlug);
    setSavedProfiles(updated);
    if (updated.length === 0) {
      setAuthView("CREDENTIALS");
    }
  };

  const handleSwitchToNewProfile = () => {
    setUsernameOrEmail("");
    setPassword("");
    setAuthView("CREDENTIALS");
  };

  const handleBackToSavedProfiles = () => {
    setAuthView("SAVED_PROFILES");
  };

  const statusUpper = (status || "ACTIVE").toUpperCase();
  const isSuspended = statusUpper === "SUSPENDED" || statusUpper === "TRIAL_EXPIRED" || statusUpper === "DELETED";
  const planUpper = (plan || "FREE").toUpperCase();
  const isInternal = planUpper === "INTERNAL";

  const copy = {
    loginFailedTitle: labels?.loginFailedTitle || "Failed to sign in",
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
    // Cloudflare-style Multi-Account Copy
    signInWithAnotherProfile: labels?.signInWithAnotherProfile || "Sign in with another profile",
    viewSavedProfiles: labels?.viewSavedProfiles || "View saved profiles",
    saveEmailOnDevice: labels?.saveEmailOnDevice || "Save email and login method on this device",
    lastUsed: labels?.lastUsed || "Last used",
    removeSavedProfile: labels?.removeSavedProfile || "Remove profile from device",
    savedProfilesTitle: labels?.savedProfilesTitle || "Choose an account",
    savedProfilesOr: labels?.savedProfilesOr || "or",
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

  // Trigger top-right toast on authentication failure
  useEffect(() => {
    if (errorMessage && errorMessage !== prevErrorRef.current) {
      toast.error(copy.loginFailedTitle, {
        description: errorMessage,
        position: "top-right",
        duration: 5000,
      });
      prevErrorRef.current = errorMessage;
    } else if (!errorMessage) {
      prevErrorRef.current = null;
    }
  }, [errorMessage, copy.loginFailedTitle]);

  return (
    <div className="w-full space-y-4">
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
        {/* VIEW 1: Cloudflare-style Saved Profiles Chooser */}
        {authView === "SAVED_PROFILES" && savedProfiles.length > 0 && !mfaRequired ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {copy.savedProfilesTitle}
              </h3>
            </div>

            {/* List of Saved Account Cards */}
            <div className="space-y-2">
              {savedProfiles.map((profile, idx) => {
                const isLastUsed = idx === 0;
                return (
                  <div
                    key={profile.email}
                    onClick={() => handleSelectProfile(profile)}
                    className="group relative flex items-center justify-between p-3 rounded-lg border border-border/70 bg-background/50 hover:bg-accent/40 hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt=""
                            className="size-7 rounded-full object-cover"
                          />
                        ) : (
                          <User className="size-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-[250px]">
                          {profile.email}
                        </div>
                        {profile.displayName && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {profile.displayName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isLastUsed && (
                        <span className="text-[10px] font-medium font-mono text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded">
                          {copy.lastUsed}
                        </span>
                      )}
                      <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      <button
                        type="button"
                        onClick={(e) => handleRemoveProfile(e, profile.email)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title={copy.removeSavedProfile}
                        aria-label={copy.removeSavedProfile}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-border/60" />
              <span className="absolute bg-card px-2.5 text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider">
                {copy.savedProfilesOr}
              </span>
            </div>

            {/* Switch to Another Profile Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchToNewProfile}
              className="w-full h-8 text-xs font-medium border-border/80 bg-background/50 hover:bg-accent hover:text-foreground rounded-md transition-all shadow-xs cursor-pointer"
            >
              <span>{copy.signInWithAnotherProfile}</span>
            </Button>
          </div>
        ) : (
          /* VIEW 2: Standard Credentials & Password Form */
          <>
            {/* Social SSO Buttons ABOVE Form (when supported & enabled) */}
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

            {/* Credentials & Inline MFA Form */}
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
                        className="pl-9 h-9 bg-black/90 dark:bg-black/90 border-border/70 rounded-md text-xs sm:text-sm text-foreground focus:bg-black focus-visible:bg-black dark:focus:bg-black dark:focus-visible:bg-black focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors [color-scheme:dark] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#09090b_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white"
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
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder={copy.passwordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9 h-9 bg-black/90 dark:bg-black/90 border-border/70 rounded-md text-xs sm:text-sm text-foreground focus:bg-black focus-visible:bg-black dark:focus:bg-black dark:focus-visible:bg-black focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors [color-scheme:dark] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#09090b_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white"
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

                  {/* Checkbox: Save email and login method on this device */}
                  <div className="space-y-2 pt-0.5">
                    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveEmailOnDevice}
                        onChange={(e) => setSaveEmailOnDevice(e.target.checked)}
                        disabled={isLoading || isSuspended}
                        className="size-3.5 rounded border-border bg-background accent-primary cursor-pointer"
                      />
                      <span>{copy.saveEmailOnDevice}</span>
                    </label>

                    {/* Remember Me Browser */}
                    <div className="flex items-center justify-between">
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
                      className="h-9 text-center font-mono tracking-[0.4em] text-sm bg-black/90 dark:bg-black/90 border-border/70 rounded-md text-foreground focus:bg-black focus-visible:bg-black dark:focus:bg-black dark:focus-visible:bg-black focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors [color-scheme:dark] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#09090b_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white"
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

              {/* Primary Submit Button */}
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

              {/* Link below submit button: "View saved profiles" (ONLY rendered if savedProfiles.length > 0) */}
              {!mfaRequired && savedProfiles.length > 0 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleBackToSavedProfiles}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{copy.viewSavedProfiles}</span>
                  </button>
                </div>
              )}
            </form>
          </>
        )}
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
