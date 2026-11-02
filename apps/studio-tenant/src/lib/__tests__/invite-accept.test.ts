import { describe, it, expect } from "vitest";

describe("Invitation Acceptance Logic & Validation", () => {
  function extractInvitationToken(url: string): string {
    try {
      const parsed = new URL(url, "https://nusantara.kdua.net");
      return parsed.searchParams.get("token") || "";
    } catch {
      return "";
    }
  }

  function evaluatePasswordStrength(password: string) {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasMinLength, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    return { hasMinLength, hasUpper, hasDigit, hasSpecial, score, isAcceptable: score === 4 };
  }

  function resolveInvitationRedirect(subdomain?: string, customRedirectUrl?: string): string {
    if (customRedirectUrl && customRedirectUrl.startsWith("http")) {
      return customRedirectUrl;
    }
    if (subdomain) {
      return `https://${subdomain}/login`;
    }
    return "/login";
  }

  it("extracts invitation token correctly from query string", () => {
    expect(extractInvitationToken("https://nusantara.kdua.net/invite/accept?token=abc-123-xyz")).toBe("abc-123-xyz");
    expect(extractInvitationToken("/invite/accept?token=token_778899")).toBe("token_778899");
    expect(extractInvitationToken("/invite/accept")).toBe("");
  });

  it("evaluates password strength matching enterprise criteria", () => {
    // Weak: short
    expect(evaluatePasswordStrength("Ab1!").isAcceptable).toBe(false);
    // Missing symbol
    expect(evaluatePasswordStrength("Password123").isAcceptable).toBe(false);
    // Missing uppercase
    expect(evaluatePasswordStrength("p@ssword123").isAcceptable).toBe(false);
    // Missing digit
    expect(evaluatePasswordStrength("P@sswordOnly").isAcceptable).toBe(false);
    // Strong & Compliant
    const strong = evaluatePasswordStrength("K2netP@ssw0rd!2026");
    expect(strong.isAcceptable).toBe(true);
    expect(strong.score).toBe(4);
  });

  it("resolves redirect URL to workspace login upon acceptance", () => {
    expect(resolveInvitationRedirect("kircon.kdua.net")).toBe("https://kircon.kdua.net/login");
    expect(resolveInvitationRedirect("kircon.kdua.net", "https://kircon.kdua.net/dashboard")).toBe("https://kircon.kdua.net/dashboard");
    expect(resolveInvitationRedirect(undefined)).toBe("/login");
  });
});

