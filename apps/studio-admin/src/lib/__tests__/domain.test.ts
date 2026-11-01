import { describe, it, expect, afterEach } from "vitest";
import { getTenantUrl, getDefaultTenantHost } from "../domain";

function setLocation(href: string) {
  Object.defineProperty(window, "location", {
    value: new URL(href),
    writable: true,
    configurable: true,
  });
}

describe("Tenant URL generation (plan pillar 2 — canonical <slug>.kdua.net)", () => {
  const original = window.location;
  afterEach(() => {
    Object.defineProperty(window, "location", { value: original, writable: true, configurable: true });
  });

  it("never emits the legacy -gis pattern when browsing from the platform admin host", () => {
    setLocation("https://system-gis.kdua.net/organizations");
    expect(getTenantUrl("test-tenant")).toBe("https://test-tenant.kdua.net");
    expect(getTenantUrl("test-tenant", "/login")).toBe("https://test-tenant.kdua.net/login");
    expect(getDefaultTenantHost("test-tenant")).toBe("test-tenant.kdua.net");
  });

  it("never emits the legacy pattern from the apex gis.kdua.net host either", () => {
    setLocation("https://gis.kdua.net/");
    expect(getTenantUrl("acme")).toBe("https://acme.kdua.net");
    expect(getDefaultTenantHost("acme")).toBe("acme.kdua.net");
  });

  it("keeps the canonical pattern when already on a tenant host", () => {
    setLocation("https://test-tenant.kdua.net/login");
    expect(getTenantUrl("other")).toBe("https://other.kdua.net");
  });

  it("keeps working on localhost development", () => {
    setLocation("http://localhost:3001/organizations");
    expect(getTenantUrl("dev")).toBe("http://dev.localhost:3002");
  });
});

