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

