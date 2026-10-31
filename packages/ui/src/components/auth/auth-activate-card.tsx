import React, { useEffect, useState, useMemo } from "react";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2, Check, X, Building2, Globe, User } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";

export interface AuthActivateLabels {
  activatePageTitle?: string;
  activatePageDesc?: string;
  activateOrgLabel?: string;
  activateSubdomainLabel?: string;
  activatePicLabel?: string;
  activateSubmitBtn?: string;
  activateSubmittingBtn?: string;
  activateSuccessTitle?: string;
  activateSuccessDesc?: string;
  tokenExpiredTitle?: string;
  tokenExpiredDesc?: string;
  tokenVerifying?: string;
  newPasswordLabel?: string;
  confirmPasswordLabel?: string;
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

export interface AuthActivateCardProps {
  token?: string;
  labels?: AuthActivateLabels;
  onSuccessRedirect?: (redirectUrl?: string) => void;
  apiBaseUrl?: string;
}

interface OrgDetails {
  orgName: string;
  orgSlug: string;
  subdomain: string;
  adminEmail: string;
  adminUsername: string;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean;
  orgDetails?: OrgDetails;
  errorMessage?: string;
}

export function AuthActivateCard({
  token: initialToken,
  labels = {},
  onSuccessRedirect,
  apiBaseUrl = "",
}: AuthActivateCardProps) {
  const l = {
    activatePageTitle: labels.activatePageTitle || "Activate Your Workspace",
    activatePageDesc: labels.activatePageDesc || "Establish your master administrator credentials to access your organization portal.",
    activateOrgLabel: labels.activateOrgLabel || "Organization",
    activateSubdomainLabel: labels.activateSubdomainLabel || "Workspace Domain",
    activatePicLabel: labels.activatePicLabel || "Administrator",
    activateSubmitBtn: labels.activateSubmitBtn || "Activate & Establish Password",
    activateSubmittingBtn: labels.activateSubmittingBtn || "Activating Workspace...",
    activateSuccessTitle: labels.activateSuccessTitle || "Workspace Activated!",
    activateSuccessDesc: labels.activateSuccessDesc || "Your organization and administrator credentials are now active.",
    tokenExpiredTitle: labels.tokenExpiredTitle || "Invalid or Expired Link",
    tokenExpiredDesc: labels.tokenExpiredDesc || "This activation link has expired or has already been used.",
    tokenVerifying: labels.tokenVerifying || "Verifying security link...",
    newPasswordLabel: labels.newPasswordLabel || "New Password",
    confirmPasswordLabel: labels.confirmPasswordLabel || "Confirm Password",
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

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>("/login");

  // Validate activation token on mount
  useEffect(() => {
    if (!token) {
      setValidation({
        isValidating: false,
        isValid: false,
        errorMessage: l.tokenExpiredDesc,
      });
      return;
    }

    let isMounted = true;
    async function validate() {
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/auth/activate/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.valid) {
          setValidation({
            isValidating: false,
            isValid: true,
            orgDetails: {
              orgName: data.orgName,
              orgSlug: data.orgSlug,
              subdomain: data.subdomain,
              adminEmail: data.adminEmail,
              adminUsername: data.adminUsername,
            },
          });
        } else {
          setValidation({
            isValidating: false,
            isValid: false,
            errorMessage: data.message || l.tokenExpiredDesc,
          });
        }
      } catch {
        if (!isMounted) return;
        setValidation({
          isValidating: false,
          isValid: false,
          errorMessage: l.tokenExpiredDesc,
        });
      }
    }

    validate();
    return () => {
      isMounted = false;
    };
  }, [token, apiBaseUrl, l.tokenExpiredDesc]);

  // Password complexity checks
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
    return "bg-emerald-500";
  }, [criteria.score]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

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

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        if (data.redirectUrl) {
          setRedirectUrl(data.redirectUrl);
        } else if (validation.orgDetails?.subdomain) {
          setRedirectUrl(`https://${validation.orgDetails.subdomain}/login`);
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

  // 1. Loading state
  if (validation.isValidating) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">{l.tokenVerifying}</p>
      </div>
    );
  }

  // 2. Success state
  if (isSuccess) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{l.activateSuccessTitle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{l.activateSuccessDesc}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full h-7 px-2.5 text-xs font-medium"
          onClick={() => {
            if (onSuccessRedirect) {
              onSuccessRedirect(redirectUrl);
            } else if (typeof window !== "undefined") {
              window.location.href = redirectUrl;
            }
          }}
        >
          {l.backToSignIn}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    );
  }

  // 3. Invalid or expired token state
  if (!validation.isValid) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{l.tokenExpiredTitle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{validation.errorMessage}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full h-7 px-2.5 text-xs font-medium"
          onClick={() => {
            if (typeof window !== "undefined") window.location.href = "/login";
          }}
        >
          {l.backToSignIn}
        </Button>
      </div>
    );
  }

  const org = validation.orgDetails;

  // 4. Activation Form
  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          {l.activatePageTitle}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {l.activatePageDesc}
        </p>
      </div>

      {/* Organization Meta Summary Card */}
      {org && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              {l.activateOrgLabel}
            </span>
            <span className="font-semibold text-foreground">{org.orgName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary" />
              {l.activateSubdomainLabel}
            </span>
            <span className="font-mono text-xs text-primary font-medium">{org.subdomain}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              {l.activatePicLabel}
            </span>
            <span className="font-medium text-foreground">{org.adminUsername} ({org.adminEmail})</span>
          </div>
        </div>
      )}

      {submitError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="activate-password" className="text-xs font-medium">
          {l.newPasswordLabel}
        </Label>
        <div className="relative">
          <Input
            id="activate-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="h-8 text-xs pr-8"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Strength Meter */}
        {password && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{strengthLabel}</span>
              <span className="font-mono text-muted-foreground">{criteria.score}/4</span>
            </div>
            <div className="grid grid-cols-4 gap-1 h-1 w-full bg-muted rounded overflow-hidden">
              <div className={`h-full ${criteria.score >= 1 ? strengthColor : "bg-transparent"}`} />
              <div className={`h-full ${criteria.score >= 2 ? strengthColor : "bg-transparent"}`} />
              <div className={`h-full ${criteria.score >= 3 ? strengthColor : "bg-transparent"}`} />
              <div className={`h-full ${criteria.score >= 4 ? strengthColor : "bg-transparent"}`} />
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px] text-muted-foreground">
              <span className={`flex items-center gap-1 ${criteria.hasMinLength ? "text-emerald-500 font-medium" : ""}`}>
                {criteria.hasMinLength ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                {l.passwordRequirementMin}
              </span>
              <span className={`flex items-center gap-1 ${criteria.hasUpper ? "text-emerald-500 font-medium" : ""}`}>
                {criteria.hasUpper ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                {l.passwordRequirementUpper}
              </span>
              <span className={`flex items-center gap-1 ${criteria.hasDigit ? "text-emerald-500 font-medium" : ""}`}>
                {criteria.hasDigit ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                {l.passwordRequirementDigit}
              </span>
              <span className={`flex items-center gap-1 ${criteria.hasSpecial ? "text-emerald-500 font-medium" : ""}`}>
                {criteria.hasSpecial ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                {l.passwordRequirementSpecial}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="activate-confirm-password" className="text-xs font-medium">
          {l.confirmPasswordLabel}
        </Label>
        <Input
          id="activate-confirm-password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="h-8 text-xs"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-[11px] text-destructive">{l.passwordMismatch}</p>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || criteria.score < 4 || password !== confirmPassword}
          className="w-full h-7 px-2.5 text-xs font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              {l.activateSubmittingBtn}
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              {l.activateSubmitBtn}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
