import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth, resolveAuthErrorMessage } from "@k2net/auth/client";
import { useTranslation } from "@k2net/i18n";
import {
  AuthLoginForm,
  AuthLoginLayout,
  saveAccountProfile,
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
}

function sanitizeCallbackPath(raw: string | null): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed === "/login") {
    return "/";
  }
  return trimmed;
}

function mapAllowedMethods(methods?: string[], hasSso?: boolean): AuthMethod[] {
  const list = methods || (hasSso ? ["password", "google", "github"] : ["password"]);
  const out: AuthMethod[] = [];
  if (list.includes("google")) {
    out.push({
      id: "google",
      name: "Google",
      type: "social",
      icon: "google",
      enabled: true,
    });
  }
  if (list.includes("github")) {
    out.push({
      id: "github",
      name: "GitHub",
      type: "social",
      icon: "github",
      enabled: true,
    });
  }
  return out;
}

export function LoginPage() {
  const { t, locale, setLocale } = useTranslation();
  const { authenticated, initialized, login, loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const tenantSlug = extractTenantSlug();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
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

  const { data: tenantCtx } = useQuery<TenantAuthContextDto>({
    queryKey: ["tenant-auth-context", tenantSlug],
    queryFn: async () => {
      try {
        const res = await fetch(
          `/api/v1/auth/tenant-context?slug=${encodeURIComponent(tenantSlug)}`
        );
        if (!res.ok) {
          return {
            slug: tenantSlug,
            name: tenantSlug === "default" ? "Main GIS" : tenantSlug,
            plan: "FREE",
            planDisplayName: "STARTER TRIAL",
            authMode: "PASSWORD_ONLY",
            allowedMethods: ["password"],
            mfaRequired: false,
            status: "ACTIVE",
          };
        }
        return (await res.json()) as TenantAuthContextDto;
      } catch {
        return {
          slug: tenantSlug,
          name: tenantSlug === "default" ? "Main GIS" : tenantSlug,
          plan: "FREE",
          planDisplayName: "STARTER TRIAL",
          authMode: "PASSWORD_ONLY",
          allowedMethods: ["password"],
          mfaRequired: false,
          status: "ACTIVE",
        };
      }
    },
  });

  // Smoothly redirect migrated alias subdomains to active Clean Slug domain
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      tenantCtx?.isAlias &&
      tenantCtx.targetSlug &&
      tenantCtx.targetSlug !== tenantSlug
    ) {
      const port = window.location.port ? `:${window.location.port}` : "";
      if (window.location.host.endsWith(".localhost") || window.location.host.startsWith("localhost")) {
        const nextHost = `${tenantCtx.targetSlug}.localhost${port}`;
        window.location.replace(
          `${window.location.protocol}//${nextHost}${window.location.pathname}${window.location.search}`
        );
      } else {
        const nextHost = `${tenantCtx.targetSlug}.kdua.net${port}`;
        window.location.replace(
          `${window.location.protocol}//${nextHost}${window.location.pathname}${window.location.search}`
        );
      }
    }
  }, [tenantCtx?.isAlias, tenantCtx?.targetSlug, tenantSlug]);

  const socialMethods = useMemo(
    () => mapAllowedMethods(tenantCtx?.allowedMethods, tenantCtx?.hasSso),
    [tenantCtx?.allowedMethods, tenantCtx?.hasSso]
  );

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
    }),
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

  const handleSocialLogin = (providerId: string) => {
    void login({
      idpHint: providerId,
      redirectUri: window.location.origin + callbackUrl,
    });
  };

  return (
    <AuthLoginLayout
      portalName={tenantCtx?.name || t("auth.tenant_portal_fallback")}
      portalSubtitle={t("auth.tenant_portal_subtitle")}
      welcomeTitle={t("auth.welcome_back")}
      docsUrl="https://system-gis.kdua.net/gateways/overview"
      docsLabel={t("auth.system_docs")}
      testimonialQuote={t("auth.tenant_testimonial_quote")}
      testimonialAuthor={t("auth.tenant_testimonial_author")}
      testimonialRole={t("auth.tenant_testimonial_role")}
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
        orgName={tenantCtx?.name || t("auth.tenant_org_fallback")}
        description={t("auth.tenant_org_subtitle")}
        logoUrl={tenantCtx?.logoUrl}
        plan={tenantCtx?.plan || "FREE"}
        planDisplayName={tenantCtx?.planDisplayName || "STARTER TRIAL"}
        authMode={tenantCtx?.authMode}
        status={tenantCtx?.status || "ACTIVE"}
        tenantSlug={tenantCtx?.targetSlug || tenantCtx?.slug || tenantSlug}
        allowedMethods={socialMethods}
        locale={locale}
        labels={formLabels}
        isLoading={isSubmitting}
        mfaRequired={mfaRequired}
        turnstileSiteKey={turnstileSiteKey}
        errorMessage={errorMessage}
        onSubmitCredentials={handleSubmitCredentials}
        onContinueWithProvider={handleSocialLogin}
        onResetMfaStep={() => {
          setMfaRequired(false);
          setErrorMessage(null);
        }}
      />
    </AuthLoginLayout>
  );
}
