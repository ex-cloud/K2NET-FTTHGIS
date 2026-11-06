import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "../theme-provider";
import type {
  AuthLoginFormProps,
  TurnstileWindow,
} from "./auth-login-types";
import {
  getSavedProfiles,
  removeSavedProfile,
  SAVED_PROFILES_STORAGE_KEY,
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
  const [authView, setAuthView] = useState<"SAVED_PROFILES" | "CREDENTIALS" | "FORGOT_PASSWORD">(() => {
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
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

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
  const [forgotLoading, setForgotLoading] = useState(false);
  const [isBreakGlass, setIsBreakGlass] = useState(false);
  const [discoveredSso, setDiscoveredSso] = useState<{
    ssoAvailable: boolean;
    providerType?: string;
    displayName?: string;
    organizationSlug?: string;
    redirectUrl?: string;
  } | null>(null);

  useEffect(() => {
    const trimmed = usernameOrEmail.trim();
    if (!trimmed.includes("@") || (trimmed.split("@")[1]?.length ?? 0) < 3) {
      setDiscoveredSso(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/auth/sso-discovery?email=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.ssoAvailable) {
            setDiscoveredSso(data);
          } else {
            setDiscoveredSso(null);
          }
        }
      } catch {
        setDiscoveredSso(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameOrEmail]);

  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const prevErrorRef = useRef<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  // True once the user explicitly interacts (types / picks a view). Prevents async profile
  // re-sync (tenant slug resolved late, other tab) from yanking the view away from the user.
  const viewTouchedRef = useRef(false);

  const updateUsernameOrEmail = useCallback((value: string) => {
    viewTouchedRef.current = true;
    setUsernameOrEmail(value);
  }, []);

  // Keep saved profiles in sync with storage:
  //  - tenantSlug resolved/changed after mount (tenant-context fetch, alias redirect)
  //  - another browser tab adds/removes a profile (storage event)
  // The view is reconciled so "SAVED_PROFILES" never points to an empty list, and the chooser
  // appears when profiles become available before the user has started interacting.
  useEffect(() => {
    const sync = () => {
      const next = getSavedProfiles(tenantSlug);
      setSavedProfiles(next);
      setAuthView((current) => {
        if (next.length === 0) {
          return current === "SAVED_PROFILES" ? "CREDENTIALS" : current;
        }
        if (current === "CREDENTIALS" && !viewTouchedRef.current && !defaultEmail) {
          return "SAVED_PROFILES";
        }
        return current;
      });
    };

    sync();

    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === SAVED_PROFILES_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [tenantSlug, defaultEmail]);

  // Mount Cloudflare Turnstile widget dynamically when turnstileSiteKey is configured.
  // The widget is needed in the credentials view and in the forgot-password view
  // (both render `turnstileContainerRef`); the saved-profiles chooser has no widget.
  useEffect(() => {
    const cleanKey = turnstileSiteKey?.trim();
    if (!cleanKey || typeof window === "undefined" || authView === "SAVED_PROFILES") {
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
        theme: activeTheme,
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
      // The widget is destroyed, so its single-use token is no longer valid. Drop it, otherwise
      // a stale token would keep the submit button enabled after switching views and the
      // backend would reject it (TURNSTILE_FAILED) — a UI/backend mismatch.
      setTurnstileToken(undefined);
    };
  }, [turnstileSiteKey, authView, activeTheme]);

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
        isBreakGlass: isBreakGlass || undefined,
      });
      return;
    }
    if (onContinueWithEmail) {
      onContinueWithEmail(cleanUser);
    }
  };

  const handleForgotClick = () => {
    viewTouchedRef.current = true;
    setAuthView("FORGOT_PASSWORD");
    setForgotSubmitted(false);
    if (onForgotPassword) {
      onForgotPassword(usernameOrEmail.trim());
    }
  };

  const handleBackToLogin = () => {
    viewTouchedRef.current = true;
    setAuthView("CREDENTIALS");
    setForgotSubmitted(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = usernameOrEmail.trim();
    if (!cleanUser || forgotLoading) return;

    setForgotLoading(true);
    try {
      if (props.onRequestForgotPassword) {
        await props.onRequestForgotPassword(cleanUser, turnstileToken);
      } else {
        await fetch("/api/v1/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: cleanUser,
            turnstileToken,
            tenantSlug,
            plane: props.plane,
            lang: props.locale || "en",
          }),
        });
      }
      setForgotSubmitted(true);
    } catch {
      // Anti-enumeration: still display success screen
      setForgotSubmitted(true);
    } finally {
      setForgotLoading(false);
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
    viewTouchedRef.current = true;
    setUsernameOrEmail(profile.email || profile.username || "");
    setPassword("");
    setShowPassword(false);
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
    viewTouchedRef.current = true;
    setUsernameOrEmail("");
    setPassword("");
    setShowPassword(false);
    setAuthView("CREDENTIALS");
  };

  const handleBackToSavedProfiles = () => {
    viewTouchedRef.current = true;
    // Never keep a typed password in memory while the chooser is displayed.
    setPassword("");
    setShowPassword(false);
    setTotpCode("");
    // Re-read storage: the list may have changed since mount (other tab / removal).
    const latest = getSavedProfiles(tenantSlug);
    setSavedProfiles(latest);
    setAuthView(latest.length > 0 ? "SAVED_PROFILES" : "CREDENTIALS");
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
    // Forgot Password Copy
    forgotPasswordTitle: labels?.forgotPasswordTitle || "Reset your password",
    forgotPasswordSubtitle:
      labels?.forgotPasswordSubtitle ||
      "Enter your account email or username. We'll send instructions to reset your password.",
    sendResetLink: labels?.sendResetLink || "Send Reset Link",
    sendingResetLink: labels?.sendingResetLink || "Sending reset link...",
    backToSignIn: labels?.backToSignIn || "Back to sign in",
    checkInboxTitle: labels?.checkInboxTitle || "Check your email",
    checkInboxDesc:
      labels?.checkInboxDesc ||
      "If an account matches this identity, we've sent password reset instructions to your inbox.",
    resendInstructions: labels?.resendInstructions || "Resend instructions",
    resendCooldown: labels?.resendCooldown || "Resend available in {seconds}s",
    ssoDiscoveredTitle: labels?.ssoDiscoveredTitle || "Single Sign-On Available",
    ssoDiscoveredDesc: labels?.ssoDiscoveredDesc || "Your email domain is configured with corporate SSO.",
    continueWithSso: labels?.continueWithSso || "Continue with SSO",
    breakGlassModeActive: labels?.breakGlassModeActive || "Emergency Break-Glass Mode Active",
    breakGlassNotice:
      labels?.breakGlassNotice ||
      "Emergency access for administrators only when IdP is down. Step-Up TOTP is mandatory.",
    breakGlassToggle: labels?.breakGlassToggle || "Sign in with Break-Glass Emergency Access",
    cancelBreakGlass: labels?.cancelBreakGlass || "Cancel Break-Glass & return to SSO",
    ipNotAllowedTitle: labels?.ipNotAllowedTitle || "Access Denied: IP Not Allowed",
    ipNotAllowedDesc:
      labels?.ipNotAllowedDesc ||
      "Your device IP address is not included in this organization's allowed CIDR list.",
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
    (Boolean(props.enforceSso) && !isBreakGlass) ||
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
    setUsernameOrEmail: updateUsernameOrEmail,
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
    forgotSubmitted,
    forgotLoading,
    isBreakGlass,
    setIsBreakGlass,
    discoveredSso,
    // Refs
    turnstileContainerRef,
    passwordInputRef,
    // Handlers
    handleSubmit,
    handleForgotClick,
    handleForgotSubmit,
    handleBackToLogin,
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

