import { describe, it, expect } from "vitest";
import { extractTenantSlug, getTenantKeycloakConfig } from "../keycloak-config";

describe("Tenant Keycloak Config", () => {
  it("should extract tenant slug from URL search params", () => {
    delete (window as unknown as { location: unknown }).location;
    // @ts-expect-error - mock location
    window.location = new URL("https://gis.kdua.net?tenant=isp-fiber-optics");

    const slug = extractTenantSlug();
    expect(slug).toBe("isp-fiber-optics");
  });

  it("should extract clean tenant slug from Option A domain (*.kdua.net)", () => {
    delete (window as unknown as { location: unknown }).location;
    // @ts-expect-error - mock location
    window.location = new URL("https://kircon-network.kdua.net/login");

    const slug = extractTenantSlug();
    expect(slug).toBe("kircon-network");
  });

  it("should support legacy *-gis.kdua.net domains", () => {
    delete (window as unknown as { location: unknown }).location;
    // @ts-expect-error - mock location
    window.location = new URL("https://garut-gis.kdua.net/overview");

    const slug = extractTenantSlug();
    expect(slug).toBe("garut");
  });

  it("should ignore internal system plane hostnames", () => {
    delete (window as unknown as { location: unknown }).location;
    // @ts-expect-error - mock location
    window.location = new URL("https://system-gis.kdua.net/login");

    const slug = extractTenantSlug();
    expect(slug).toBe("default");
  });

  it("should generate valid KeycloakAuthConfig", () => {
    const config = getTenantKeycloakConfig("my-tenant-realm");
    expect(config.realm).toBe("my-tenant-realm");
    expect(config.clientId).toBeDefined();
    expect(config.url).toBeDefined();
  });
});
