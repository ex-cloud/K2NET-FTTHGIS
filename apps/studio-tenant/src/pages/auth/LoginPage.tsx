import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth, resolveAuthErrorMessage } from "@k2net/auth/client";
import { useTranslation } from "@k2net/i18n";
import {
  AuthLoginForm,
  AuthLoginLayout,
  AuthLoginSkeleton,
  FtthTopologyFlow,
  TenantDomainError,
  saveAccountProfile,
  base64UrlToBuffer,
  bufferToBase64Url,
  type AuthCredentialsSubmitPayload,
  type AuthLoginFormLabels,
  type AuthMethod,
} from "@k2net/ui";
import { extractTenantSlug } from "../../lib/keycloak-config";

interface TenantAuthContextDto {
  id?: string;
  name: string;
  slug: string;
  targetSlug?: string;
  isAlias?: boolean;
  realmKey?: string;
  logoUrl?: string;
  plan?: string;
  planDisplayName?: string;
  authMode?: string;
  status?: string;
  hasSso?: boolean;
  allowedMethods?: string[];
  mfaRequired?: boolean;
  enforceSso?: boolean;
  allowBreakGlass?: boolean;
  ssoProviderType?: string;
  ssoDisplayName?: string;
}

function sanitizeCallbackPath(raw: string | null): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed === "/login") {
    return "/";
  }
  return trimmed;
}

function mapAllowedMethods(
  tenantCtx: TenantAuthContextDto | null | undefined,
  defaultSsoName: string
): AuthMethod[] {
  if (!tenantCtx || !Array.isArray(tenantCtx.allowedMethods)) {
    return [];
  }
  const providerType = (tenantCtx.ssoProviderType || "").toUpperCase();
  const displayName = (tenantCtx.ssoDisplayName || "").trim();
  const out: AuthMethod[] = [];

  for (const rawId of tenantCtx.allowedMethods) {
    const id = (rawId || "").trim();
    if (!id || id === "password") continue;

    if (id === "google" || (id.startsWith("sso-") && providerType === "GOOGLE")) {
      out.push({
        id: "google",
        name: displayName && providerType === "GOOGLE" ? displayName : "Google",
        type: "social",
        icon: "google",
        enabled: true,
      });
    } else if (id === "github" || (id.startsWith("sso-") && providerType === "GITHUB")) {
      out.push({
        id: "github",
        name: displayName && providerType === "GITHUB" ? displayName : "GitHub",
        type: "social",
        icon: "github",
        enabled: true,
      });
    } else if (id.startsWith("sso-") && providerType === "MICROSOFT_ENTRA") {
      out.push({
        id,
        name: displayName || "Microsoft Entra ID",
        type: "sso",
        icon: "microsoft",
        enabled: true,
      });
    } else if (id.startsWith("sso-")) {
      out.push({
        id,
        name: displayName || defaultSsoName,
        type: "sso",
        icon: "sso",
        enabled: true,
      });
    }
  }
  return out;
}

async function fetchTenantAuthContext(
  tenantSlug: string,
  live: boolean = false
): Promise<TenantAuthContextDto | null> {
  if (!tenantSlug || tenantSlug === "__invalid_reserved__") {
    return null;
  }
  try {
    const liveSuffix = live ? "&live=1" : "";
    const res = await fetch(
      `/api/v1/auth/tenant-context?slug=${encodeURIComponent(tenantSlug)}${liveSuffix}`
    );
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as TenantAuthContextDto;
  } catch {
    return null;
  }
}

function redirectIfAliasSubdomain(
  tenantCtx: TenantAuthContextDto | null | undefined,
  tenantSlug: string
): void {
  if (
    typeof window === "undefined" ||
    !tenantCtx?.isAlias ||
    !tenantCtx.targetSlug ||
    tenantCtx.targetSlug === tenantSlug
  ) {
    return;
  }
  const port = window.location.port ? `:${window.location.port}` : "";
  const isLocal =
    window.location.host.endsWith(".localhost") ||
    window.location.host.startsWith("localhost");
  const nextHost = isLocal
    ? `${tenantCtx.targetSlug}.localhost${port}`
    : `${tenantCtx.targetSlug}.kdua.net${port}`;
  window.location.replace(
    `${window.location.protocol}//${nextHost}${window.location.pathname}${window.location.search}`
  );
}

function buildTenantFormLabels(t: (key: string) => string): AuthLoginFormLabels {
  return {
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
    tierFreeLabel: t("auth.tier_free_label"),
    tierFreeValue: t("auth.tier_free_value"),
    tierFreeDesc: t("auth.tier_free_desc"),
    tierProLabel: t("auth.tier_pro_label"),
    tierProValue: t("auth.tier_pro_value"),
    tierProDesc: t("auth.tier_pro_desc"),
    tierEnterpriseLabel: t("auth.tier_enterprise_label"),
    tierEnterpriseValue: t("auth.tier_enterprise_value"),
    tierEnterpriseDesc: t("auth.tier_enterprise_desc"),
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
  };
}

export function LoginPage() {
  const { t, locale, setLocale } = useTranslation();
  const {
    authenticated,
    initialized,
    login,
    loginWithCredentials,
    verifyMfaTotp,
    sendMfaEmailOtp,
    verifyMfaEmailOtp,
    getWebauthnLoginChallenge,
    verifyWebauthnLogin,
  } = useAuth();
  const navigate = useNavigate();
  const tenantSlug = extractTenantSlug();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [availableMfaMethods, setAvailableMfaMethods] = useState<string[]>(["totp", "email_otp"]);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const turnstileSiteKey =
    (import.meta.env.VITE_TURNSTILE_TENANT_SITE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ||
    "0x4AAAAAAFq1LAd5fwZMDgz5";

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const params = new URLSearchParams(window.location.search);
    return sanitizeCallbackPath(params.get("callbackUrl"));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("impersonate_code");
      if (code) {
        navigate({ to: "/", search: { impersonate_code: code } });
        return;
      }
      if (sessionStorage.getItem("k2net_impersonation_meta")) {
        navigate({ to: "/" });
        return;
      }
      localStorage.removeItem("k2net_impersonation_meta");
      localStorage.removeItem("k2net_impersonation_token");
      localStorage.removeItem("k2net_impersonation_session_id");
      localStorage.removeItem("k2net_impersonating_in_progress");
    }

    if (initialized && authenticated) {
      if (callbackUrl === "/") {
        navigate({ to: "/" });
      } else if (typeof window !== "undefined") {
        window.location.replace(callbackUrl);
      }
    }
  }, [authenticated, callbackUrl, initialized, navigate]);

  const {
    data: tenantCtx,
    isLoading: isTenantCtxLoading,
    refetch: refetchTenantCtx,
  } = useQuery<TenantAuthContextDto | null>({
    queryKey: ["tenant-auth-context", tenantSlug],
    retry: false,
    queryFn: () => fetchTenantAuthContext(tenantSlug),
  });

  useEffect(() => {
    redirectIfAliasSubdomain(tenantCtx, tenantSlug);
  }, [tenantCtx, tenantSlug]);

  // Surface any OAuth/SSO callback error returned from the identity broker cleanly in the SPA
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const oauthErr = url.searchParams.get("error");
    const oauthDesc = url.searchParams.get("error_description");
    if (oauthErr) {
      setErrorMessage(resolveAuthErrorMessage(oauthErr.toUpperCase(), oauthDesc || undefined, t));
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, [t]);

  const socialMethods = useMemo(
    () => mapAllowedMethods(tenantCtx, t("auth.default_sso_display_name")),
    [tenantCtx, t]
  );

  const formLabels = useMemo<AuthLoginFormLabels>(
    () => buildTenantFormLabels((key) => t(key as Parameters<typeof t>[0])),
    [t]
  );

  const handleSubmitCredentials = async (payload: AuthCredentialsSubmitPayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const effectiveSlug = tenantCtx?.targetSlug || tenantCtx?.slug || tenantSlug;
      const result = await loginWithCredentials({
        plane: "TENANT",
        tenantSlug: effectiveSlug,
        username: payload.username,
        password: payload.password,
        totp: payload.totp,
        rememberMe: payload.rememberMe,
        turnstileToken: payload.turnstileToken,
        isBreakGlass: payload.isBreakGlass,
      });

      if (result.mfaRequired) {
        setMfaRequired(true);
        if (result.preAuthToken) setPreAuthToken(result.preAuthToken);
        if (result.availableMethods && result.availableMethods.length > 0) {
          setAvailableMfaMethods(result.availableMethods);
        } else {
          setAvailableMfaMethods(["totp", "email_otp"]);
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
          tenantSlug: effectiveSlug,
          authMethod: "password",
        });
      }

      if (callbackUrl === "/") {
        navigate({ to: "/" });
      } else if (typeof window !== "undefined") {
        window.location.replace(callbackUrl);
      }
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
        if (callbackUrl === "/") {
          navigate({ to: "/" });
        } else if (typeof window !== "undefined") {
          window.location.replace(callbackUrl);
        }
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
        if (callbackUrl === "/") {
          navigate({ to: "/" });
        } else if (typeof window !== "undefined") {
          window.location.replace(callbackUrl);
        }
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
        if (callbackUrl === "/") {
          navigate({ to: "/" });
        } else if (typeof window !== "undefined") {
          window.location.replace(callbackUrl);
        }
        return true;
      }
      setErrorMessage(resolveAuthErrorMessage(result.error || "INVALID_WEBAUTHN_ASSERTION", result.message, t));
      return false;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setErrorMessage(t("settings.account.passkey_cancelled"));
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Passkey verification failed");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerId: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const isSocial = providerId === "google" || providerId === "github";
      const effectiveSlug = tenantCtx?.targetSlug || tenantCtx?.slug || tenantSlug;

      if (!isSocial) {
        // Atomic live pre-flight verification against PostgreSQL to prevent race conditions
        // if Tenant Admin disabled/modified SSO or license entitlement changed while page was open
        const liveCtx = await fetchTenantAuthContext(effectiveSlug, true);
        const liveMethods = mapAllowedMethods(liveCtx, t("auth.default_sso_display_name"));
        const ssoMethod = liveMethods.find((m) => m.type === "sso" || m.id === providerId);
        if (!liveCtx || !liveCtx.hasSso || !ssoMethod) {
          await refetchTenantCtx();
          setErrorMessage(
            resolveAuthErrorMessage(
              "SSO_NOT_AVAILABLE",
              t("auth.sso_disabled_or_updating"),
              t
            )
          );
          return;
        }
        await login({
          idpHint: ssoMethod.id,
          redirectUri: window.location.origin + callbackUrl,
        });
        return;
      }

      // Social Identity Login (Google / GitHub)
      await login({
        idpHint: providerId,
        redirectUri: window.location.origin + callbackUrl,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTenantCtxLoading) {
    return <AuthLoginSkeleton variant="login" />;
  }

  if (!tenantCtx || tenantSlug === "__invalid_reserved__") {
    const currentHost = typeof window !== "undefined" ? window.location.hostname : tenantSlug;
    return <TenantDomainError statusCode={404} subdomain={currentHost} />;
  }

  return (
    <AuthLoginLayout
      portalName={tenantCtx.name}
      portalSubtitle={t("auth.tenant_portal_subtitle")}
      welcomeTitle={t("auth.welcome_back")}
      docsUrl="https://system-gis.kdua.net/gateways/overview"
      docsLabel={t("auth.system_docs")}
      testimonialQuote={t("auth.tenant_testimonial_quote")}
      testimonialAuthor={t("auth.tenant_testimonial_author")}
      testimonialRole={t("auth.tenant_testimonial_role")}
      figureComponent={<FtthTopologyFlow tenantName={tenantCtx.name} />}
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
        orgName={tenantCtx.name}
        description={t("auth.tenant_org_subtitle")}
        logoUrl={tenantCtx.logoUrl}
        plan={tenantCtx.plan || "FREE"}
        planDisplayName={tenantCtx.planDisplayName || "STARTER TRIAL"}
        authMode={tenantCtx.authMode}
        status={tenantCtx.status || "ACTIVE"}
        tenantSlug={tenantCtx.targetSlug || tenantCtx.slug || tenantSlug}
        plane="TENANT"
        hasSso={Boolean(tenantCtx.hasSso)}
        enforceSso={tenantCtx.enforceSso}
        allowBreakGlass={tenantCtx.allowBreakGlass}
        ssoProviderType={tenantCtx.ssoProviderType}
        ssoDisplayName={tenantCtx.ssoDisplayName}
        allowedMethods={socialMethods}
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
        onContinueWithProvider={handleSocialLogin}
        onResetMfaStep={() => {
          setMfaRequired(false);
          setErrorMessage(null);
          setPreAuthToken(null);
        }}
      />
    </AuthLoginLayout>
  );
}
