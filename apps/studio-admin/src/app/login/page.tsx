import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { useAuth, resolveAuthErrorMessage } from "@k2net/auth/client";
import { useTranslation } from "@k2net/i18n";
import {
  AuthLoginForm,
  AuthLoginLayout,
  saveAccountProfile,
  type AuthCredentialsSubmitPayload,
  type AuthLoginFormLabels,
} from "@k2net/ui";

function sanitizeCallbackPath(raw: string | null): string {
  if (!raw) return "/overview";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed === "/login") {
    return "/overview";
  }
  return trimmed;
}

export default function AdminLoginPage() {
  const { t, locale, setLocale } = useTranslation();
  const { authenticated, initialized, loginWithCredentials } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackPath(searchParams?.get("callbackUrl") ?? null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
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
      figureId="fig-07"
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
        turnstileSiteKey={turnstileSiteKey}
        errorMessage={errorMessage}
        onSubmitCredentials={handleSubmitCredentials}
        onResetMfaStep={() => {
          setMfaRequired(false);
          setErrorMessage(null);
        }}
      />
    </AuthLoginLayout>
  );
}
