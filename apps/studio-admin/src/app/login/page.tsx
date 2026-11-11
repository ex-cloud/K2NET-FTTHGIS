import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useAuth, resolveAuthErrorMessage } from "@k2net/auth/client";
import { useTranslation } from "@k2net/i18n";
import {
  AuthLoginForm,
  AuthLoginLayout,
  FtthTopologyFlow,
  saveAccountProfile,
  base64UrlToBuffer,
  bufferToBase64Url,
  type AuthCredentialsSubmitPayload,
  type AuthLoginFormLabels,
} from "@k2net/ui";

function sanitizeCallbackPath(raw: string | null): string {
  if (!raw) return "/overview";
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed === "/login" ||
    trimmed.startsWith("/auth/console/login")
  ) {
    return "/overview";
  }
  return trimmed;
}

export default function AdminLoginPage() {
  const { t, locale, setLocale } = useTranslation();
  const {
    authenticated,
    initialized,
    loginWithCredentials,
    verifyMfaTotp,
    sendMfaEmailOtp,
    verifyMfaEmailOtp,
    getWebauthnLoginChallenge,
    verifyWebauthnLogin,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackPath(searchParams?.get("callbackUrl") ?? null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [availableMfaMethods, setAvailableMfaMethods] = useState<string[]>(["totp", "email_otp"]);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const turnstileSiteKey =
    (import.meta.env.VITE_TURNSTILE_ADMIN_SITE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ||
    "0x4AAAAAAFqzoRy-yUZNkjii";

  useEffect(() => {
    if (initialized && authenticated) {
      router.replace(callbackUrl);
    }
  }, [authenticated, callbackUrl, initialized, router]);

  const formLabels = useMemo<AuthLoginFormLabels>(
    () => ({
      loginFailedTitle: t("auth.login_failed_title"),
      accountEmailOrUsername: t("auth.account_email_or_username"),
      accountPlaceholder: t("auth.account_placeholder"),
      requiredBadge: t("auth.required_badge"),
      passwordUpper: t("auth.password_upper"),
      passwordPlaceholder: t("auth.password_placeholder"),
      forgotPassword: t("auth.forgot_password"),
      forgotPasswordNotice: t("auth.forgot_password_notice"),
      showPassword: t("auth.show_password"),
      hidePassword: t("auth.hide_password"),
      rememberMeBrowser: t("auth.remember_me_browser"),
      orContinueWith: t("auth.or_continue_with"),
      continueWithGoogle: t("auth.continue_with_google"),
      continueWithGithub: t("auth.continue_with_github"),
      continueWithProviderPrefix: t("auth.continue_with_provider_prefix"),
      signInPlatformAdmin: t("auth.sign_in_platform_admin"),
      continueIspWorkspace: t("auth.continue_isp_workspace"),
      mfaCodeLabel: t("auth.mfa_code_label"),
      mfaCodePlaceholder: t("auth.mfa_code_placeholder"),
      mfaCodeHint: t("auth.mfa_code_hint"),
      mfaVerifySubmit: t("auth.mfa_verify_submit"),
      mfaBackToLogin: t("auth.mfa_back_to_login"),
      turnstileVerifying: t("auth.turnstile_verifying"),
      suspendedTitle: t("auth.suspended_title"),
      suspendedDesc: t("auth.suspended_desc"),
      tierInternalLabel: t("auth.tier_internal_label"),
      tierInternalValue: t("auth.tier_internal_value"),
      tierInternalDesc: t("auth.tier_internal_desc"),
      complianceBanner: t("auth.compliance_banner"),
      signInWithAnotherProfile: t("auth.sign_in_with_another_profile"),
      viewSavedProfiles: t("auth.view_saved_profiles"),
      saveEmailOnDevice: t("auth.save_email_on_device"),
      lastUsed: t("auth.last_used"),
      removeSavedProfile: t("auth.remove_saved_profile"),
      savedProfilesTitle: t("auth.saved_profiles_title"),
      savedProfilesOr: t("auth.saved_profiles_or"),
      forgotPasswordTitle: t("auth.forgot_password_title"),
      forgotPasswordSubtitle: t("auth.forgot_password_subtitle"),
      sendResetLink: t("auth.send_reset_link"),
      sendingResetLink: t("auth.sending_reset_link"),
      backToSignIn: t("auth.back_to_sign_in"),
      checkInboxTitle: t("auth.check_inbox_title"),
      checkInboxDesc: t("auth.check_inbox_desc"),
      resendInstructions: t("auth.resend_instructions"),
      resendCooldown: t("auth.resend_cooldown"),
      ssoDiscoveredTitle: t("auth.sso_discovered_title"),
      ssoDiscoveredDesc: t("auth.sso_discovered_desc"),
      continueWithSso: t("auth.continue_with_sso"),
      defaultSsoDisplayName: t("auth.default_sso_display_name"),
      orContinueWithCredentials: t("auth.or_continue_with_credentials"),
      ssoDomainRecognized: t("auth.sso_domain_recognized"),
      breakGlassModeActive: t("auth.break_glass_mode_active"),
      breakGlassNotice: t("auth.break_glass_notice"),
      breakGlassToggle: t("auth.break_glass_toggle"),
      cancelBreakGlass: t("auth.cancel_break_glass"),
      ipNotAllowedTitle: t("auth.ip_not_allowed_title"),
      ipNotAllowedDesc: t("auth.ip_not_allowed_desc"),
      mfaTabTotp: t("auth.mfa_tab_totp"),
      mfaTabWebauthn: t("auth.mfa_tab_webauthn"),
      mfaTabEmailOtp: t("auth.mfa_tab_email_otp"),
      mfaPasskeyPrompt: t("auth.mfa_passkey_prompt"),
      mfaPasskeyBtn: t("auth.mfa_passkey_btn"),
      mfaEmailPrompt: t("auth.mfa_email_prompt"),
      mfaSendEmailBtn: t("auth.mfa_send_email_btn"),
      mfaSendingEmail: t("auth.mfa_sending_email"),
      mfaEmailSentDesc: t("auth.mfa_email_sent_desc"),
      mfaResendEmailIn: t("auth.mfa_resend_email_in"),
      mfaTryAnotherMethod: t("auth.mfa_try_another_method"),
      mfaChooseMethodTitle: t("auth.mfa_choose_method_title"),
      mfaChooseMethodDesc: t("auth.mfa_choose_method_desc"),
      mfaMethodWebauthnDesc: t("auth.mfa_method_webauthn_desc"),
      mfaMethodTotpDesc: t("auth.mfa_method_totp_desc"),
      mfaMethodEmailDesc: t("auth.mfa_method_email_desc"),
      mfaBackToPrimary: t("auth.mfa_back_to_primary"),
      continueWithPasskey: t("auth.continue_with_passkey"),
      waitingForPasskey: t("auth.waiting_for_passkey"),
    }),
    [t]
  );

  const handleSubmitCredentials = async (payload: AuthCredentialsSubmitPayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await loginWithCredentials({
        plane: "PLATFORM",
        tenantSlug: "system",
        username: payload.username,
        password: payload.password,
        totp: payload.totp,
        rememberMe: payload.rememberMe,
        turnstileToken: payload.turnstileToken,
      });

      if (result.mfaRequired) {
        setMfaRequired(true);
        if (result.preAuthToken) setPreAuthToken(result.preAuthToken);
        if (result.availableMethods && result.availableMethods.length > 0) {
          setAvailableMfaMethods(result.availableMethods);
        }
        if (result.maskedEmail) setMaskedEmail(result.maskedEmail);
        if (result.error) {
          setErrorMessage(resolveAuthErrorMessage(result.error, result.message, t));
        }
        return;
      }

      if (!result.success) {
        setErrorMessage(resolveAuthErrorMessage(result.error, result.message, t));
        return;
      }

      if (payload.saveEmailOnDevice !== false) {
        saveAccountProfile({
          email: payload.username,
          tenantSlug: "system",
          authMethod: "password",
        });
      }

      router.replace(callbackUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTotp = async (code: string): Promise<boolean> => {
    if (!preAuthToken || !verifyMfaTotp) return false;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await verifyMfaTotp(preAuthToken, code);
      if (result.success) {
        router.replace(callbackUrl);
        return true;
      }
      setErrorMessage(resolveAuthErrorMessage(result.error || "INVALID_MFA_CODE", result.message, t));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmailOtp = async (): Promise<boolean> => {
    if (!preAuthToken || !sendMfaEmailOtp) return false;
    const res = await sendMfaEmailOtp(preAuthToken);
    if (!res.success) {
      setErrorMessage(res.message || "Failed to dispatch verification code");
      return false;
    }
    if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
    return true;
  };

  const handleVerifyEmailOtp = async (code: string): Promise<boolean> => {
    if (!preAuthToken || !verifyMfaEmailOtp) return false;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await verifyMfaEmailOtp(preAuthToken, code);
      if (result.success) {
        router.replace(callbackUrl);
        return true;
      }
      setErrorMessage(resolveAuthErrorMessage(result.error || "INVALID_CODE", result.message, t));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyWebauthn = async (): Promise<boolean> => {
    if (!preAuthToken || !getWebauthnLoginChallenge || !verifyWebauthnLogin) return false;
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setErrorMessage(t("settings.account.passkey_unsupported"));
      return false;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const challengeData = await getWebauthnLoginChallenge(preAuthToken);
      const challengeBuffer = base64UrlToBuffer(challengeData.challenge);
      const allowCreds = challengeData.allowCredentials?.map((c) => ({
        type: "public-key" as const,
        id: base64UrlToBuffer(c.id) as unknown as BufferSource,
      }));

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: challengeBuffer as unknown as BufferSource,
          rpId: challengeData.rpId,
          allowCredentials: allowCreds,
          userVerification: "preferred",
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error("No assertion returned");
      }

      const resp = assertion.response as AuthenticatorAssertionResponse;
      const result = await verifyWebauthnLogin(preAuthToken, {
        credentialId: bufferToBase64Url(assertion.rawId),
        clientDataJSON: bufferToBase64Url(resp.clientDataJSON),
        authenticatorData: bufferToBase64Url(resp.authenticatorData),
        signature: bufferToBase64Url(resp.signature),
      });

      if (result.success) {
        router.replace(callbackUrl);
        return true;
      }
      setErrorMessage(resolveAuthErrorMessage(result.error || "INVALID_WEBAUTHN_ASSERTION", result.message, t));
      return false;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setErrorMessage(t("settings.account.passkey_cancelled"));
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage("WebAuthn verification failed");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLoginLayout
      portalName={t("auth.admin_portal_name")}
      portalSubtitle={t("auth.admin_portal_subtitle")}
      welcomeTitle={t("auth.welcome_back")}
      docsUrl="https://system-gis.kdua.net/gateways/overview"
      docsLabel={t("auth.system_docs")}
      testimonialQuote={t("auth.admin_testimonial_quote")}
      testimonialAuthor={t("auth.admin_testimonial_author")}
      testimonialRole={t("auth.admin_testimonial_role")}
      figureComponent={<FtthTopologyFlow tenantName="K2NET Platform Admin" />}
      locale={locale}
      onLocaleChange={setLocale}
      footerAgreePrefix={t("auth.footer_agree_prefix")}
      footerTermsLabel={t("auth.footer_terms")}
      footerAndLabel={t("auth.footer_and")}
      footerPrivacyLabel={t("auth.footer_privacy")}
      footerAgreeSuffix={t("auth.footer_agree_suffix")}
      footerCopyrightText={t("auth.footer_copyright")}
      policyTermsTab={t("auth.policy_terms_tab")}
      policyPrivacyTab={t("auth.policy_privacy_tab")}
      policyCloseButton={t("auth.policy_close_button")}
    >
      <AuthLoginForm
        orgName={t("auth.admin_org_name")}
        description={t("auth.admin_org_subtitle")}
        plan="INTERNAL"
        planDisplayName="SYSTEM ADMIN"
        status="ACTIVE"
        tenantSlug="system"
        plane="PLATFORM"
        locale={locale}
        labels={formLabels}
        isLoading={isSubmitting}
        mfaRequired={mfaRequired}
        preAuthToken={preAuthToken ?? undefined}
        availableMfaMethods={availableMfaMethods}
        maskedEmail={maskedEmail ?? undefined}
        onVerifyTotp={handleVerifyTotp}
        onSendEmailOtp={handleSendEmailOtp}
        onVerifyEmailOtp={handleVerifyEmailOtp}
        onVerifyWebauthn={handleVerifyWebauthn}
        turnstileSiteKey={turnstileSiteKey}
        errorMessage={errorMessage}
        onSubmitCredentials={handleSubmitCredentials}
        onResetMfaStep={() => {
          setMfaRequired(false);
          setErrorMessage(null);
          setPreAuthToken(null);
        }}
      />
    </AuthLoginLayout>
  );
}
