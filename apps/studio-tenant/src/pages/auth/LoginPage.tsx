import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth, resolveAuthErrorMessage } from "@k2net/auth/client";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import {
  AuthLoginForm,
  AuthLoginLayout,
  AuthLoginSkeleton,
  FtthTopologyFlow,
  TenantDomainError,
  saveAccountProfile,
  setPendingSaveProfile,
  commitPendingSaveProfile,
  usePasswordlessPasskeyFlow,
  abortPendingConditionalPasskey,
  type AuthCredentialsSubmitPayload,
  type AuthLoginFormLabels,
} from "@k2net/ui";
import { extractTenantSlug } from "../../lib/keycloak-config";
import {
  consumeSessionMfaChallenge,
  consumeSessionOAuthError,
  fetchTenantAuthContext,
  mapAllowedMethods,
  redirectIfAliasSubdomain,
  requestBrowserWebauthnAssertion,
  sanitizeCallbackPath,
  type TenantAuthContextDto,
} from "../../lib/auth/tenant-auth-context";
import { buildTenantFormLabels } from "../../lib/auth/login-form-labels";

function inspectImpersonationOnLoginMount(): { impersonateCode?: string; hasActiveSession?: boolean } {
  if (typeof window === "undefined") return {};
  const url = new URL(window.location.href);
  const code = url.searchParams.get("impersonate_code");
  if (code) {
    return { impersonateCode: code };
  }
  if (sessionStorage.getItem("k2net_impersonation_meta")) {
    return { hasActiveSession: true };
  }
  localStorage.removeItem("k2net_impersonation_meta");
  localStorage.removeItem("k2net_impersonation_token");
  localStorage.removeItem("k2net_impersonation_session_id");
  localStorage.removeItem("k2net_impersonating_in_progress");
  return {};
}

function extractInitialLoginError(t: (key: string) => string): { message: string; toastId: string } | null {
  const err = consumeSessionOAuthError();
  if (err) {
    return {
      message: resolveAuthErrorMessage(err.code, err.description, t),
      toastId: "login-oauth-error",
    };
  }
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    if (errorParam) {
      const msg = resolveAuthErrorMessage(errorParam, undefined, t);
      urlParams.delete("error");
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newUrl);
      return { message: msg, toastId: "login-error-param" };
    }
  }
  return null;
}

function resolveTenantTurnstileKey(): string {
  return (
    (import.meta.env.VITE_TURNSTILE_TENANT_SITE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ||
    "0x4AAAAAAFq1LAd5fwZMDgz5"
  );
}

function resolveEffectiveTenantSlug(
  tenantCtx: TenantAuthContextDto | null | undefined,
  fallbackSlug: string
): string {
  return tenantCtx?.targetSlug || tenantCtx?.slug || fallbackSlug;
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
    getPasskeyPasswordlessChallenge,
    verifyPasskeyPasswordlessLogin,
    verifyMfaBackupCode,
  } = useAuth();
  const navigate = useNavigate();
  const tenantSlug = extractTenantSlug();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [availableMfaMethods, setAvailableMfaMethods] = useState<string[]>(["totp", "email_otp"]);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authView, setAuthView] = useState<"SAVED_PROFILES" | "CREDENTIALS" | "FORGOT_PASSWORD">("SAVED_PROFILES");

  const turnstileSiteKey = resolveTenantTurnstileKey();

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const params = new URLSearchParams(window.location.search);
    return sanitizeCallbackPath(params.get("callbackUrl"));
  }, []);

  useEffect(() => {
    const imp = inspectImpersonationOnLoginMount();
    if (imp.impersonateCode) {
      navigate({ to: "/", search: { impersonate_code: imp.impersonateCode } });
      return;
    }
    if (imp.hasActiveSession) {
      navigate({ to: "/" });
      return;
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

  // Check for Step-Up MFA challenge returned from SSO / Social broker exchange
  useEffect(() => {
    const challenge = consumeSessionMfaChallenge();
    if (challenge) {
      setPreAuthToken(challenge.preAuthToken);
      setMfaRequired(true);
      setAvailableMfaMethods(challenge.availableMethods);
      if (challenge.maskedEmail) setMaskedEmail(challenge.maskedEmail);
    }
  }, []);

  // Surface any OAuth/SSO callback error or redirected session expiry error cleanly in the SPA
  useEffect(() => {
    const found = extractInitialLoginError(t);
    if (found) {
      setErrorMessage(found.message);
      toast.error(found.message, { id: found.toastId });
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
    abortPendingConditionalPasskey();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const effectiveSlug = tenantCtx?.targetSlug || tenantCtx?.slug || tenantSlug;
      setPendingSaveProfile({
        email: payload.username,
        username: payload.username,
        tenantSlug: effectiveSlug,
        authMethod: "password",
        shouldSave: payload.saveEmailOnDevice !== false,
      });

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
          email: result.user?.email || payload.username,
          username: result.user?.username || payload.username,
          displayName: result.user?.name,
          avatarUrl: result.user?.avatarUrl,
          tenantSlug: effectiveSlug,
          authMethod: "password",
        });
      }
      setPendingSaveProfile(null);
      handleAuthRedirect(result.user, effectiveSlug);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthRedirect = (
    user?: { email?: string; username?: string; name?: string; avatarUrl?: string },
    effectiveSlug?: string
  ) => {
    commitPendingSaveProfile({
      email: user?.email,
      username: user?.username,
      displayName: user?.name,
      avatarUrl: user?.avatarUrl,
      tenantSlug: effectiveSlug,
    });
    if (callbackUrl === "/") {
      navigate({ to: "/" });
    } else if (typeof window !== "undefined") {
      window.location.replace(callbackUrl);
    }
    return true;
  };

  const handleVerifyTotp = async (code: string): Promise<boolean> => {
    if (!preAuthToken || !verifyMfaTotp) return false;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const effectiveSlug = tenantCtx?.targetSlug || tenantCtx?.slug || tenantSlug;
      const result = await verifyMfaTotp(preAuthToken, code);
      if (result.success) {
        return handleAuthRedirect(result.user, effectiveSlug);
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
      const effectiveSlug = tenantCtx?.targetSlug || tenantCtx?.slug || tenantSlug;
      const result = await verifyMfaEmailOtp(preAuthToken, code);
      if (result.success) {
        return handleAuthRedirect(result.user, effectiveSlug);
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
      const effectiveSlug = tenantCtx?.targetSlug || tenantCtx?.slug || tenantSlug;
      const challengeData = await getWebauthnLoginChallenge(preAuthToken);
      const assertionPayload = await requestBrowserWebauthnAssertion(challengeData);
      const result = await verifyWebauthnLogin(preAuthToken, assertionPayload);

      if (result.success) {
        return handleAuthRedirect(result.user, effectiveSlug);
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

  const handleVerifyBackupCode = async (code: string): Promise<boolean> => {
    if (!preAuthToken || !verifyMfaBackupCode) return false;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const effectiveSlug = tenantCtx?.targetSlug || tenantCtx?.slug || tenantSlug;
      const result = await verifyMfaBackupCode(preAuthToken, code);
      if (result.success) {
        return handleAuthRedirect(result.user, effectiveSlug);
      }
      setErrorMessage(resolveAuthErrorMessage(result.error || "INVALID_BACKUP_CODE", result.message, t));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveTenantSlug = resolveEffectiveTenantSlug(tenantCtx, tenantSlug);
  const canUsePasskey = Boolean(
    initialized && !authenticated && !isTenantCtxLoading && tenantCtx && !mfaRequired && !tenantCtx.enforceSso
  );

  const { isPasskeyLoading, handlePasswordlessPasskeyLogin } = usePasswordlessPasskeyFlow({
    enabled: canUsePasskey,
    conditionalEnabled: canUsePasskey && authView === "CREDENTIALS",
    plane: "TENANT",
    tenantSlug: effectiveTenantSlug,
    getChallenge: getPasskeyPasswordlessChallenge,
    verifyLogin: verifyPasskeyPasswordlessLogin,
    onSuccess: (user) => {
      handleAuthRedirect(user, effectiveTenantSlug);
    },
    onError: (errCode, rawMsg) => {
      const msg =
        errCode === "PASSKEY_UNSUPPORTED" || errCode === "PASSKEY_CANCELLED"
          ? rawMsg || null
          : resolveAuthErrorMessage(errCode, rawMsg, t);
      setErrorMessage(msg);
    },
    onClearError: () => setErrorMessage(null),
    unsupportedMessage: t("settings.account.passkey_unsupported"),
    cancelledMessage: t("auth.passkey_login_cancelled"),
  });

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
        plan={tenantCtx.plan}
        planDisplayName={tenantCtx.planDisplayName}
        authMode={tenantCtx.authMode}
        status={tenantCtx.status}
        tenantSlug={effectiveTenantSlug}
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
        onVerifyBackupCode={handleVerifyBackupCode}
        onPasswordlessPasskeyLogin={handlePasswordlessPasskeyLogin}
        isPasskeyLoading={isPasskeyLoading}
        onAuthViewChange={setAuthView}
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
