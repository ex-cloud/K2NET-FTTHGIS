import { describe, it, expect } from "vitest";
import { extractTenantSlug, getTenantKeycloakConfig } from "../keycloak-config";

describe("Tenant Keycloak Config", () => {
  it("should extract tenant slug from URL search params", () => {
    delete (window as unknown as { location: unknown }).location;
    // @ts-expect-error - mock location
    window.location = new URL("https://ops.kdua.net?tenant=isp-fiber-optics");

    const slug = extractTenantSlug();
    expect(slug).toBe("isp-fiber-optics");
  });

  it("should extract clean tenant slug from Option A domain (*.kdua.net)", () => {
    delete (window as unknown as { location: unknown }).location;
    // @ts-expect-error - mock location
    window.location = new URL("https://ops.kdua.net/login");

    const slug = extractTenantSlug();
    expect(slug).toBe("ops");
  });

  it("should support legacy *-gis.kdua.net domains", () => {
    delete (window as unknown as { location: unknown }).location;
    // @ts-expect-error - mock location
    window.location = new URL("https://garut-gis.kdua.net/overview");

    const slug = extractTenantSlug();
    expect(slug).toBe("garut");
  });

  it("should reject reserved and legacy subdomains (system-gis, default, console, gis)", () => {
    for (const host of [
      "https://system-gis.kdua.net/login",
      "https://default.kdua.net/login",
      "https://console.kdua.net/login",
      "https://gis.kdua.net/login",
      "https://system.kdua.net/login",
    ]) {
      delete (window as unknown as { location: unknown }).location;
      // @ts-expect-error - mock location
      window.location = new URL(host);
      expect(extractTenantSlug()).toBe("__invalid_reserved__");
    }
  });

  it("should default to 'ops' on localhost development", () => {
    delete (window as unknown as { location: unknown }).location;
    // @ts-expect-error - mock location
    window.location = new URL("http://localhost:3002/login");

    expect(extractTenantSlug()).toBe("ops");
  });

  it("should generate valid KeycloakAuthConfig", () => {
    const config = getTenantKeycloakConfig("my-tenant-realm");
    expect(config.realm).toBe("my-tenant-realm");
    expect(config.clientId).toBeDefined();
    expect(config.url).toBeDefined();
  });
});
