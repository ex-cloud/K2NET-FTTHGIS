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

