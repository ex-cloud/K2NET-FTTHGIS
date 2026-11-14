import { describe, it, expect, beforeEach } from "vitest";
import {
  SAVED_PROFILES_STORAGE_KEY,
  clearBrowserStorageForLogout,
  commitPendingSaveProfile,
  getSavedProfiles,
  removeSavedProfile,
  saveAccountProfile,
  setPendingSaveProfile,
} from "../../../../../packages/ui/src/components/auth/saved-profiles";

describe("Saved profiles (Account Chooser storage)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("saves metadata only and never credentials", () => {
    saveAccountProfile({ email: "Admin@ISP.net", tenantSlug: "isp", authMethod: "password" });
    const raw = localStorage.getItem(SAVED_PROFILES_STORAGE_KEY) as string;
    expect(raw).toBeTruthy();
    expect(raw.toLowerCase()).not.toContain("password\":\"");
    expect(raw).not.toContain("token");
    expect(getSavedProfiles("isp")[0].email).toBe("admin@isp.net");
  });

  it("orders by last used and caps the list", () => {
    for (let i = 0; i < 7; i++) {
      saveAccountProfile({
        email: `u${i}@isp.net`,
        tenantSlug: "isp",
        authMethod: "password",
        lastUsedAt: 1000 + i,
      });
    }
    const list = getSavedProfiles("isp");
    expect(list.length).toBe(5);
    expect(list[0].email).toBe("u6@isp.net");
  });

  it("removes a profile that is visible for the tenant even if stored without slug", () => {
    localStorage.setItem(
      SAVED_PROFILES_STORAGE_KEY,
      JSON.stringify([{ email: "legacy@isp.net", lastUsedAt: 1, authMethod: "password" }])
    );
    expect(getSavedProfiles("isp").length).toBe(1);
    expect(removeSavedProfile("legacy@isp.net", "isp")).toEqual([]);
    expect(getSavedProfiles("isp")).toEqual([]);
  });

  it("does not leak profiles across tenants", () => {
    saveAccountProfile({ email: "a@one.net", tenantSlug: "one", authMethod: "password" });
    expect(getSavedProfiles("two")).toEqual([]);
  });

  it("preserves saved profiles on logout while clearing everything else", () => {
    saveAccountProfile({ email: "a@one.net", tenantSlug: "one", authMethod: "password" });
    localStorage.setItem("k2net_impersonation_token", "secret");
    sessionStorage.setItem("k2net_impersonation_meta", "x");

    clearBrowserStorageForLogout();

    expect(localStorage.getItem("k2net_impersonation_token")).toBeNull();
    expect(sessionStorage.getItem("k2net_impersonation_meta")).toBeNull();
    expect(getSavedProfiles("one").length).toBe(1);
  });

  it("commits pending save profile after Step-Up MFA or Social login when shouldSave is true", () => {
    setPendingSaveProfile({
      email: "nextfas@gmail.com",
      tenantSlug: "ops",
      authMethod: "password",
      shouldSave: true,
    });
    commitPendingSaveProfile({
      email: "nextfas@gmail.com",
      displayName: "dian noc",
      tenantSlug: "ops",
    });

    const profiles = getSavedProfiles("ops");
    expect(profiles.length).toBe(1);
    expect(profiles[0].email).toBe("nextfas@gmail.com");
    expect(profiles[0].displayName).toBe("dian noc");
    expect(profiles[0].authMethod).toBe("password");
  });

  it("does not save profile after MFA when shouldSave is false", () => {
    setPendingSaveProfile({
      email: "nextfas@gmail.com",
      tenantSlug: "ops",
      authMethod: "password",
      shouldSave: false,
    });
    commitPendingSaveProfile({
      email: "nextfas@gmail.com",
      displayName: "dian noc",
      tenantSlug: "ops",
    });

    expect(getSavedProfiles("ops")).toEqual([]);
  });
});

