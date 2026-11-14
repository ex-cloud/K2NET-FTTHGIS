import { base64UrlToBuffer, bufferToBase64Url, type AuthMethod } from "@k2net/ui";

export interface TenantAuthContextDto {
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

export function sanitizeCallbackPath(raw: string | null): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed === "/login") {
    return "/";
  }
  return trimmed;
}

export function mapAllowedMethods(
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

export async function fetchTenantAuthContext(
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

export function redirectIfAliasSubdomain(
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

export function consumeSessionMfaChallenge(): {
  preAuthToken: string;
  availableMethods: string[];
  maskedEmail: string | null;
} | null {
  if (typeof window === "undefined") return null;
  const pendingPreAuthToken = sessionStorage.getItem("k2net_pre_auth_token");
  if (!pendingPreAuthToken) return null;
  sessionStorage.removeItem("k2net_pre_auth_token");

  let availableMethods = ["totp", "email_otp"];
  const methodsRaw = sessionStorage.getItem("k2net_available_mfa_methods");
  if (methodsRaw) {
    try {
      const parsed = JSON.parse(methodsRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        availableMethods = parsed;
      }
    } catch {
      // ignore
    }
    sessionStorage.removeItem("k2net_available_mfa_methods");
  }
  const maskedEmail = sessionStorage.getItem("k2net_masked_email");
  if (maskedEmail) {
    sessionStorage.removeItem("k2net_masked_email");
  }
  return { preAuthToken: pendingPreAuthToken, availableMethods, maskedEmail };
}

export function consumeSessionOAuthError(): { code: string; description?: string } | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const oauthErr = url.searchParams.get("error");
  const oauthDesc = url.searchParams.get("error_description");
  const storedErrCode = sessionStorage.getItem("k2net_auth_error_code");
  const storedErrMsg = sessionStorage.getItem("k2net_auth_error_message");

  if (storedErrCode || storedErrMsg) {
    sessionStorage.removeItem("k2net_auth_error_code");
    sessionStorage.removeItem("k2net_auth_error_message");
  }
  if (oauthErr || oauthDesc) {
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
  if (!storedErrCode && !storedErrMsg && !oauthErr) return null;
  return {
    code: (storedErrCode || oauthErr || "").toUpperCase(),
    description: storedErrMsg || oauthDesc || undefined,
  };
}

export async function requestBrowserWebauthnAssertion(challengeData: {
  challenge: string;
  rpId: string;
  allowCredentials?: Array<{ type: string; id: string }>;
}): Promise<{
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
}> {
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
  return {
    credentialId: bufferToBase64Url(assertion.rawId),
    clientDataJSON: bufferToBase64Url(resp.clientDataJSON),
    authenticatorData: bufferToBase64Url(resp.authenticatorData),
    signature: bufferToBase64Url(resp.signature),
  };
}
