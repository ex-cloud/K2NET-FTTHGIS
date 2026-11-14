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
  saveEmailOnDevice?: boolean;
  totp?: string;
  turnstileToken?: string;
  isBreakGlass?: boolean;
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
  // Forgot Password View Labels
  forgotPasswordTitle?: string;
  forgotPasswordSubtitle?: string;
  sendResetLink?: string;
  sendingResetLink?: string;
  backToSignIn?: string;
  checkInboxTitle?: string;
  checkInboxDesc?: string;
  resendInstructions?: string;
  resendCooldown?: string;
  // SSO Discovery & Break-Glass Emergency Access Labels
  ssoDiscoveredTitle?: string;
  ssoDiscoveredDesc?: string;
  continueWithSso?: string;
  defaultSsoDisplayName?: string;
  breakGlassModeActive?: string;
  breakGlassNotice?: string;
  breakGlassToggle?: string;
  cancelBreakGlass?: string;
  ipNotAllowedTitle?: string;
  ipNotAllowedDesc?: string;
  orContinueWithCredentials?: string;
  ssoDomainRecognized?: string;
  // Multi-Option Step-Up MFA & Passwordless Labels
  mfaTabTotp?: string;
  mfaTabWebauthn?: string;
  mfaTabEmailOtp?: string;
  mfaPasskeyPrompt?: string;
  mfaPasskeyBtn?: string;
  mfaEmailPrompt?: string;
  mfaSendEmailBtn?: string;
  mfaSendingEmail?: string;
  mfaEmailSentDesc?: string;
  mfaResendEmailIn?: string;
  mfaTryAnotherMethod?: string;
  mfaChooseMethodTitle?: string;
  mfaChooseMethodDesc?: string;
  mfaMethodWebauthnDesc?: string;
  mfaMethodTotpDesc?: string;
  mfaMethodEmailDesc?: string;
  mfaBackToPrimary?: string;
  continueWithPasskey?: string;
  waitingForPasskey?: string;
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
  hasSso?: boolean;
  enforceSso?: boolean;
  allowBreakGlass?: boolean;
  ssoProviderType?: string;
  ssoDisplayName?: string;
  allowedMethods?: AuthMethod[];
  primaryAuthMethod?: string;
  submitLabel?: string;
  onSubmitCredentials?: (payload: AuthCredentialsSubmitPayload) => void | Promise<void>;
  onContinueWithEmail?: (email: string) => void;
  onContinueWithProvider?: (providerId: string) => void;
  onForgotPassword?: (usernameOrEmail: string) => void;
  onRequestForgotPassword?: (usernameOrEmail: string, turnstileToken?: string) => Promise<boolean>;
  plane?: "PLATFORM" | "TENANT";
  onResetMfaStep?: () => void;
  mfaRequired?: boolean;
  preAuthToken?: string;
  availableMfaMethods?: string[];
  maskedEmail?: string;
  onVerifyTotp?: (code: string) => Promise<boolean>;
  onSendEmailOtp?: () => Promise<boolean>;
  onVerifyEmailOtp?: (code: string) => Promise<boolean>;
  onVerifyWebauthn?: () => Promise<boolean>;
  onPasswordlessPasskeyLogin?: () => Promise<boolean>;
  turnstileSiteKey?: string;
  isLoading?: boolean;
  defaultEmail?: string;
  errorMessage?: string | null;
  locale?: AuthLocale;
  labels?: AuthLoginFormLabels;
}

export interface TurnstileWindow extends Window {
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

export function buildAuthLoginCopy(labels?: AuthLoginFormLabels) {
  return {
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
    signInWithAnotherProfile: labels?.signInWithAnotherProfile || "Sign in with another profile",
    viewSavedProfiles: labels?.viewSavedProfiles || "View saved profiles",
    saveEmailOnDevice: labels?.saveEmailOnDevice || "Save email and login method on this device",
    lastUsed: labels?.lastUsed || "Last used",
    removeSavedProfile: labels?.removeSavedProfile || "Remove profile from device",
    savedProfilesTitle: labels?.savedProfilesTitle || "Choose an account",
    savedProfilesOr: labels?.savedProfilesOr || "or",
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
    defaultSsoDisplayName: labels?.defaultSsoDisplayName || "Enterprise Single Sign-On",
    breakGlassModeActive: labels?.breakGlassModeActive || "Emergency Break-Glass Mode Active",
    breakGlassNotice:
      labels?.breakGlassNotice ||
      "Emergency access for administrators only when IdP is down. Step-Up TOTP is mandatory.",
    breakGlassToggle: labels?.breakGlassToggle || "Sign in with Break-Glass Emergency Access",
    cancelBreakGlass: labels?.cancelBreakGlass || "Return to SSO",
    orContinueWithCredentials: labels?.orContinueWithCredentials || "or continue with email & password",
    ssoDomainRecognized: labels?.ssoDomainRecognized || "Single Sign-On is configured for this domain.",
    ipNotAllowedTitle: labels?.ipNotAllowedTitle || "Access Denied: IP Not Allowed",
    ipNotAllowedDesc:
      labels?.ipNotAllowedDesc ||
      "Your device IP address is not included in this organization's allowed CIDR list.",
  };
}

