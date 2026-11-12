import type { AuthMethod } from "@k2net/ui";

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
