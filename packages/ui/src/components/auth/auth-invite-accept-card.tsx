import React, { useEffect, useState, useMemo, useRef } from "react";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2, Check, X, Building2, Globe, Mail, UserCheck } from "lucide-react";
import { useTheme } from "../theme-provider";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Badge } from "../badge";
import { AuthCardFormSkeleton } from "./auth-login-skeleton";

export interface AuthInviteAcceptLabels {
  invitePageTitle?: string;
  invitePageDesc?: string;
  inviteRoleLabel?: string;
  inviteWorkspaceLabel?: string;
  inviteSubdomainLabel?: string;
  inviteEmailLabel?: string;
  inviteFullnameLabel?: string;
  inviteFullnamePlaceholder?: string;
  invitePasswordLabel?: string;
  inviteConfirmPasswordLabel?: string;
  inviteSubmitBtn?: string;
  inviteSubmittingBtn?: string;
  inviteSuccessTitle?: string;
  inviteSuccessDesc?: string;
  inviteExpiredTitle?: string;
  inviteExpiredDesc?: string;
  inviteExpiredGuidance?: string;
  inviteAlreadyAcceptedTitle?: string;
  inviteAlreadyAcceptedDesc?: string;
  inviteContinueToLogin?: string;
  inviteRoleBadge?: string;
  inviteExistingAccountHint?: string;
  tokenVerifying?: string;
  passwordMismatch?: string;
  passwordStrengthWeak?: string;
  passwordStrengthFair?: string;
  passwordStrengthGood?: string;
  passwordStrengthStrong?: string;
  passwordRequirementMin?: string;
  passwordRequirementUpper?: string;
  passwordRequirementDigit?: string;
  passwordRequirementSpecial?: string;
  backToSignIn?: string;
  operationFailed?: string;
}

export interface AuthInviteAcceptCardProps {
  token?: string;
  labels?: AuthInviteAcceptLabels;
  onSuccessRedirect?: (redirectUrl?: string) => void;
  apiBaseUrl?: string;
  turnstileSiteKey?: string;
}

interface InvitationDetails {
  organizationId?: string;
  organizationName: string;
  organizationSlug: string;
  subdomain: string;
  email: string;
  roleName: string;
  hasExistingAccount: boolean;
  alreadyAccepted?: boolean;
  isExpired?: boolean;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean;
  invitation?: InvitationDetails;
  errorMessage?: string;
  isAlreadyAccepted?: boolean;
}

export function AuthInviteAcceptCard({
  token: initialToken,
  labels = {},
  onSuccessRedirect,
  apiBaseUrl = "",
  turnstileSiteKey,
}: AuthInviteAcceptCardProps) {
  const l = {
    invitePageTitle: labels.invitePageTitle || "Accept Workspace Invitation",
    invitePageDesc: labels.invitePageDesc || "Join to collaborate on managing ISP network and infrastructure.",
    inviteRoleLabel: labels.inviteRoleLabel || "Role / Access",
    inviteWorkspaceLabel: labels.inviteWorkspaceLabel || "ISP Workspace",
    inviteSubdomainLabel: labels.inviteSubdomainLabel || "Workspace Domain",
    inviteEmailLabel: labels.inviteEmailLabel || "Invited Email",
    inviteFullnameLabel: labels.inviteFullnameLabel || "Full Name",
    inviteFullnamePlaceholder: labels.inviteFullnamePlaceholder || "Enter your full name",
    invitePasswordLabel: labels.invitePasswordLabel || "Create Password",
    inviteConfirmPasswordLabel: labels.inviteConfirmPasswordLabel || "Confirm Password",
    inviteSubmitBtn: labels.inviteSubmitBtn || "Accept Invitation & Continue",
    inviteSubmittingBtn: labels.inviteSubmittingBtn || "Accepting Invitation...",
    inviteSuccessTitle: labels.inviteSuccessTitle || "Invitation Accepted!",
    inviteSuccessDesc: labels.inviteSuccessDesc || "Your account is active and connected to the workspace. You will be redirected to the login page...",
    inviteExpiredTitle: labels.inviteExpiredTitle || "Invitation Link Expired",
    inviteExpiredDesc: labels.inviteExpiredDesc || "This invitation link has expired for security reasons (valid for 48 hours).",
    inviteExpiredGuidance: labels.inviteExpiredGuidance || "Please contact your workspace administrator to dispatch a new invitation link.",
    inviteAlreadyAcceptedTitle: labels.inviteAlreadyAcceptedTitle || "Invitation Already Accepted",
    inviteAlreadyAcceptedDesc: labels.inviteAlreadyAcceptedDesc || "This invitation has already been accepted. You can log in directly using your credentials.",
    inviteContinueToLogin: labels.inviteContinueToLogin || "Continue to Login",
    inviteRoleBadge: labels.inviteRoleBadge || "Access: {{role}}",
    inviteExistingAccountHint: labels.inviteExistingAccountHint || "An account with this email is already registered. Click below to accept the invitation to this workspace.",
    tokenVerifying: labels.tokenVerifying || "Verifying invitation link...",
    passwordMismatch: labels.passwordMismatch || "Passwords do not match.",
    passwordStrengthWeak: labels.passwordStrengthWeak || "Weak password",
    passwordStrengthFair: labels.passwordStrengthFair || "Fair password",
    passwordStrengthGood: labels.passwordStrengthGood || "Good password",
    passwordStrengthStrong: labels.passwordStrengthStrong || "Strong password",
    passwordRequirementMin: labels.passwordRequirementMin || "At least 8 characters",
    passwordRequirementUpper: labels.passwordRequirementUpper || "At least 1 uppercase letter (A-Z)",
    passwordRequirementDigit: labels.passwordRequirementDigit || "At least 1 number (0-9)",
    passwordRequirementSpecial: labels.passwordRequirementSpecial || "At least 1 special symbol (@, #, $, etc.)",
    backToSignIn: labels.backToSignIn || "Back to sign in",
    operationFailed: labels.operationFailed || "Operation failed. Please try again.",
  };

  const token = useMemo(() => {
    if (initialToken) return initialToken;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("token") || "";
    }
    return "";
  }, [initialToken]);

  const [validation, setValidation] = useState<ValidationState>({
    isValidating: true,
    isValid: false,
  });

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>("/login");

  // Turnstile integration
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  // Theme detection for Turnstile synchronization (Light/Dark mode)
  let activeTheme: "light" | "dark" = "dark";
  try {
    const themeCtx = useTheme();
    activeTheme = themeCtx.resolvedTheme;
  } catch {
    if (typeof document !== "undefined") {
      activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
  }

  useEffect(() => {
    const cleanKey = turnstileSiteKey?.trim();
    if (!cleanKey || typeof window === "undefined") return;

    let cancelled = false;
    const win = window as unknown as {
      turnstile?: {
        render: (el: HTMLElement, opts: Record<string, unknown>) => string;
        remove?: (id: string) => void;
      };
    };

    function mountWidget() {
      if (cancelled || !turnstileContainerRef.current || !win.turnstile) return;
      if (turnstileWidgetIdRef.current && win.turnstile.remove) {
        try {
          win.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
      }
      turnstileContainerRef.current.replaceChildren();
      try {
        turnstileWidgetIdRef.current = win.turnstile.render(turnstileContainerRef.current, {
          sitekey: cleanKey,
          theme: activeTheme,
          size: "normal",
          callback: (tokenString: string) => {
            if (!cancelled) setTurnstileToken(tokenString);
          },
          "expired-callback": () => {
            if (!cancelled) setTurnstileToken(undefined);
          },
          "error-callback": () => {
            if (!cancelled) setTurnstileToken(undefined);
          },
        });
      } catch {
        // non-fatal
      }
    }

    if (win.turnstile) {
      mountWidget();
    } else {
      const existingScript = document.getElementById("cf-turnstile-api-script") as HTMLScriptElement | null;
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-api-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => mountWidget();
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", mountWidget, { once: true });
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
  }, [turnstileSiteKey, validation.isValid, activeTheme]);

  // Validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setValidation({
        isValidating: false,
        isValid: false,
        errorMessage: l.inviteExpiredDesc,
      });
      return;
    }

    let isMounted = true;
    async function validate() {
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/public/invitations/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.valid) {
          setValidation({
            isValidating: false,
            isValid: true,
            invitation: {
              organizationId: data.organizationId,
              organizationName: data.organizationName,
              organizationSlug: data.organizationSlug,
              subdomain: data.subdomain,
              email: data.email,
              roleName: data.roleName,
              hasExistingAccount: Boolean(data.hasExistingAccount),
            },
          });
        } else if (data.alreadyAccepted) {
          setValidation({
            isValidating: false,
            isValid: false,
            isAlreadyAccepted: true,
            errorMessage: data.errorMessage || l.inviteAlreadyAcceptedDesc,
            invitation: {
              organizationName: data.organizationName || "",
              organizationSlug: data.organizationSlug || "",
              subdomain: data.subdomain || "",
              email: data.email || "",
              roleName: data.roleName || "",
              hasExistingAccount: true,
            },
          });
        } else {
          setValidation({
            isValidating: false,
            isValid: false,
            errorMessage: data.errorMessage || l.inviteExpiredDesc,
          });
        }
      } catch {
        if (!isMounted) return;
        setValidation({
          isValidating: false,
          isValid: false,
          errorMessage: l.inviteExpiredDesc,
        });
      }
    }

    validate();
    return () => {
      isMounted = false;
    };
  }, [token, apiBaseUrl, l.inviteExpiredDesc, l.inviteAlreadyAcceptedDesc]);

  // Password complexity checks for new accounts
  const criteria = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasMinLength, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    return { hasMinLength, hasUpper, hasDigit, hasSpecial, score };
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (criteria.score <= 1) return l.passwordStrengthWeak;
    if (criteria.score === 2) return l.passwordStrengthFair;
    if (criteria.score === 3) return l.passwordStrengthGood;
    return l.passwordStrengthStrong;
  }, [criteria.score, l.passwordStrengthWeak, l.passwordStrengthFair, l.passwordStrengthGood, l.passwordStrengthStrong]);

  const strengthColor = useMemo(() => {
    if (criteria.score <= 1) return "bg-destructive";
    if (criteria.score === 2) return "bg-amber-500";
    if (criteria.score === 3) return "bg-blue-500";
    return "bg-primary";
  }, [criteria.score]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const requiresPassword = !validation.invitation?.hasExistingAccount;

    if (requiresPassword) {
      if (password !== confirmPassword) {
        setSubmitError(l.passwordMismatch);
        return;
      }

      if (criteria.score < 4) {
        setSubmitError(
          l.passwordRequirementMin +
            ", " +
            l.passwordRequirementUpper +
            ", " +
            l.passwordRequirementDigit +
            ", " +
            l.passwordRequirementSpecial
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/public/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: fullName.trim() || undefined,
          password: requiresPassword ? password : undefined,
          turnstileToken,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        if (data.redirectUrl) {
          setRedirectUrl(data.redirectUrl);
        } else if (validation.invitation?.subdomain) {
          setRedirectUrl(`https://${validation.invitation.subdomain}/login`);
        }
      } else {
        setSubmitError(data.message || l.operationFailed);
      }
    } catch {
      setSubmitError(l.operationFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading state (Contextual Card Skeleton instead of generic spinner)
  if (validation.isValidating) {
    return <AuthCardFormSkeleton variant="invite" />;
  }

  // 2. Success state
  if (isSuccess) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{l.inviteSuccessTitle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{l.inviteSuccessDesc}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full h-7 px-2.5 text-xs font-medium cursor-pointer"
          onClick={() => {
            if (onSuccessRedirect) {
              onSuccessRedirect(redirectUrl);
            } else if (typeof window !== "undefined") {
              window.location.href = redirectUrl;
            }
          }}
        >
          {l.inviteContinueToLogin}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    );
  }

  // 3. Already accepted state
  if (validation.isAlreadyAccepted) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{l.inviteAlreadyAcceptedTitle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{validation.errorMessage}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full h-7 px-2.5 text-xs font-medium cursor-pointer"
          onClick={() => {
            const dest = validation.invitation?.subdomain
              ? `https://${validation.invitation.subdomain}/login`
              : "/login";
            if (typeof window !== "undefined") window.location.href = dest;
          }}
        >
          {l.inviteContinueToLogin}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    );
  }

  // 4. Invalid or expired token state
  if (!validation.isValid) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{l.inviteExpiredTitle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{validation.errorMessage}</p>
          </div>
          <div className="p-2.5 rounded-md bg-background/50 border border-border/50 text-[11px] text-muted-foreground text-left leading-relaxed">
            {l.inviteExpiredGuidance}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full h-7 px-2.5 text-xs font-medium cursor-pointer"
          onClick={() => {
            if (typeof window !== "undefined") window.location.href = "/login";
          }}
        >
          {l.backToSignIn}
        </Button>
      </div>
    );
  }

  const { invitation } = validation;
  const requiresPassword = !invitation?.hasExistingAccount;

  // 5. Active invitation card form
  return (
    <div className="w-full space-y-5">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {l.invitePageTitle}
        </h2>
        <p className="text-xs text-muted-foreground">
          {l.invitePageDesc}
        </p>
      </div>

      {/* Workspace Details Card */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">{invitation?.organizationName}</span>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-primary/10 text-primary border-primary/20">
            {invitation?.roleName}
          </Badge>
        </div>

        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground/70" />
              {l.inviteSubdomainLabel}
            </span>
            <span className="font-mono text-foreground">{invitation?.subdomain}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
              {l.inviteEmailLabel}
            </span>
            <span className="font-mono text-foreground">{invitation?.email}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {invitation?.hasExistingAccount ? (
          <div className="p-3 rounded-md bg-accent/40 border border-border text-xs text-muted-foreground leading-relaxed">
            {l.inviteExistingAccountHint}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{l.inviteFullnameLabel}</Label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={l.inviteFullnamePlaceholder}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{l.invitePasswordLabel}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-8 text-xs pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{strengthLabel}</span>
                    <span className="font-mono text-muted-foreground">{criteria.score}/4</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-colors ${
                          step <= criteria.score ? strengthColor : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground pt-1">
                    <span className={`flex items-center gap-1 ${criteria.hasMinLength ? "text-primary font-medium" : ""}`}>
                      {criteria.hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {l.passwordRequirementMin}
                    </span>
                    <span className={`flex items-center gap-1 ${criteria.hasUpper ? "text-primary font-medium" : ""}`}>
                      {criteria.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {l.passwordRequirementUpper}
                    </span>
                    <span className={`flex items-center gap-1 ${criteria.hasDigit ? "text-primary font-medium" : ""}`}>
                      {criteria.hasDigit ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {l.passwordRequirementDigit}
                    </span>
                    <span className={`flex items-center gap-1 ${criteria.hasSpecial ? "text-primary font-medium" : ""}`}>
                      {criteria.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {l.passwordRequirementSpecial}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{l.inviteConfirmPasswordLabel}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-8 text-xs"
                required
              />
            </div>
          </div>
        )}

        {/* Turnstile verification container */}
        {Boolean(turnstileSiteKey?.trim()) && (
          <div className="flex justify-center pt-1 pb-1">
            <div ref={turnstileContainerRef} className="cf-turnstile min-h-[65px]" />
          </div>
        )}

        <Button
          type="submit"
          size="sm"
          className="w-full h-7 px-2.5 text-xs font-medium cursor-pointer"
          disabled={isSubmitting || (Boolean(turnstileSiteKey?.trim()) && !turnstileToken)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              {l.inviteSubmittingBtn}
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              {l.inviteSubmitBtn}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
