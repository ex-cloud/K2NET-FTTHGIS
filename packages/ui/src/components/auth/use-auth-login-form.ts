import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AuthLoginFormProps,
  TurnstileWindow,
} from "./auth-login-types";
import {
  getSavedProfiles,
  removeSavedProfile,
  type SavedAccountProfile,
} from "./saved-profiles";

export function useAuthLoginForm(props: AuthLoginFormProps) {
  const {
    tenantSlug,
    defaultEmail = "",
    turnstileSiteKey,
    errorMessage = null,
    onSubmitCredentials,
    onContinueWithEmail,
    onForgotPassword,
    onResetMfaStep,
    mfaRequired = false,
    allowedMethods = [],
    plan = "FREE",
    status = "ACTIVE",
    submitLabel,
    isLoading = false,
    labels,
  } = props;

  // Saved profiles state
  const [savedProfiles, setSavedProfiles] = useState<SavedAccountProfile[]>(() =>
    getSavedProfiles(tenantSlug)
  );
  const [authView, setAuthView] = useState<"SAVED_PROFILES" | "CREDENTIALS">(() => {
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
  const isSuspended =
    statusUpper === "SUSPENDED" || statusUpper === "TRIAL_EXPIRED" || statusUpper === "DELETED";
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

  return {
    // States
    savedProfiles,
    authView,
    setAuthView,
    usernameOrEmail,
    setUsernameOrEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    saveEmailOnDevice,
    setSaveEmailOnDevice,
    totpCode,
    setTotpCode,
    turnstileToken,
    showForgotHelp,
    // Refs
    turnstileContainerRef,
    passwordInputRef,
    // Handlers
    handleSubmit,
    handleForgotClick,
    handleBackFromMfa,
    handleSelectProfile,
    handleRemoveProfile,
    handleSwitchToNewProfile,
    handleBackToSavedProfiles,
    // Computed & Copy
    isSuspended,
    isInternal,
    copy,
    resolvedSubmitLabel,
    socialMethods,
    isSubmitDisabled,
  };
}

export type UseAuthLoginFormReturn = ReturnType<typeof useAuthLoginForm>;

