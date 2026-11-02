import { describe, it, expect } from "vitest";

function resolveCanonicalTenantHost(hostname: string): string {
  const host = hostname.toLowerCase();
  const isLegacyTenantHost =
    (host.endsWith("-gis.kdua.net") || host.endsWith(".gis.kdua.net")) &&
    host !== "system-gis.kdua.net" &&
    host !== "auth-gis.kdua.net" &&
    host !== "api-gis.kdua.net" &&
    host !== "gis.kdua.net";

  if (!isLegacyTenantHost) return host;

  let canonicalHost = host;
  if (canonicalHost.endsWith("-gis.kdua.net")) {
    canonicalHost = canonicalHost.replace(/-gis\.kdua\.net$/, ".kdua.net");
  } else if (canonicalHost.endsWith(".gis.kdua.net")) {
    canonicalHost = canonicalHost.replace(/\.gis\.kdua\.net$/, ".kdua.net");
  }
  return canonicalHost;
}

describe("Canonical Subdomain Resolution (Option A enforcement)", () => {
  it("redirects legacy *-gis.kdua.net to clean *.kdua.net", () => {
    expect(resolveCanonicalTenantHost("test-tenant-gis.kdua.net")).toBe("test-tenant.kdua.net");
    expect(resolveCanonicalTenantHost("kircon-network-gis.kdua.net")).toBe("kircon-network.kdua.net");
  });

  it("redirects legacy *.gis.kdua.net to clean *.kdua.net", () => {
    expect(resolveCanonicalTenantHost("test-tenant.gis.kdua.net")).toBe("test-tenant.kdua.net");
  });

  it("leaves platform system/auth/api hosts untouched", () => {
    expect(resolveCanonicalTenantHost("system-gis.kdua.net")).toBe("system-gis.kdua.net");
    expect(resolveCanonicalTenantHost("auth-gis.kdua.net")).toBe("auth-gis.kdua.net");
    expect(resolveCanonicalTenantHost("api-gis.kdua.net")).toBe("api-gis.kdua.net");
    expect(resolveCanonicalTenantHost("gis.kdua.net")).toBe("gis.kdua.net");
  });

  it("leaves already-clean Option A domains untouched", () => {
    expect(resolveCanonicalTenantHost("test-tenant.kdua.net")).toBe("test-tenant.kdua.net");
    expect(resolveCanonicalTenantHost("garut.kdua.net")).toBe("garut.kdua.net");
  });
});

