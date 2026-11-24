/**
 * Maps gateway-auth BFF error codes to localized translation keys.
 * Preserves language parity between English and Indonesian without relying
 * on server-rendered default strings.
 */
export function resolveAuthErrorMessage(
  error?: string,
  rawMessage?: string,
  t?: (key: string) => string
): string {
  if (!t) {
    return rawMessage || "Authentication failed.";
  }

  switch (error) {
    case "CSRF_ORIGIN_MISMATCH":
      return t("auth.login_error_origin_mismatch");
    case "CSRF_REJECTED":
      return t("auth.login_error_csrf_rejected");
    case "TURNSTILE_FAILED":
      return t("auth.login_error_turnstile_failed");
    case "RATE_LIMITED":
      return t("auth.login_error_rate_limited");
    case "INVALID_CREDENTIALS":
      return t("auth.login_error_invalid_credentials");
    case "INVALID_CREDENTIALS_FORMAT":
      return t("auth.login_error_invalid_credentials_format");
    case "INVALID_MFA_CODE":
      return t("auth.login_error_invalid_mfa_code");
    case "INVALID_BACKUP_CODE":
      return t("auth.login_error_invalid_backup_code");
    case "PASSKEY_NOT_RECOGNIZED":
    case "PASSKEY_USER_MISMATCH":
    case "CREDENTIAL_NOT_FOUND":
      return t("auth.login_error_passkey_not_recognized");
    case "CHALLENGE_EXPIRED":
      return t("auth.login_error_passkey_challenge_expired");
    case "PASSKEY_AUTH_FAILED":
    case "CHALLENGE_MISMATCH":
    case "SIGNATURE_INVALID":
    case "INVALID_WEBAUTHN_ASSERTION":
      return t("auth.login_error_passkey_failed");
    case "ACCOUNT_SUSPENDED":
      return t("auth.login_error_account_suspended");
    case "MFA_ENROLLMENT_REQUIRED":
      return t("auth.login_error_mfa_enrollment_required");
    case "ORGANIZATION_SUSPENDED":
      return t("auth.login_error_organization_suspended");
    case "TENANT_NOT_FOUND":
      return t("auth.login_error_tenant_not_found");
    case "TENANT_ACCESS_DENIED":
      return t("auth.login_error_tenant_access_denied");
    case "SESSION_EXPIRED":
    case "SESSION_TERMINATED":
      return t("auth.login_error_session_expired");
    case "SSO_NOT_AVAILABLE":
    case "SSO_BROKER_ERROR":
    case "ACCESS_DENIED":
      return rawMessage || t("auth.login_error_sso_not_available");
    case "GOOGLE_DOMAIN_RESTRICTED":
      return rawMessage || t("auth.login_error_google_domain_restricted");
    case "NETWORK_ERROR":
      return t("auth.login_error_network");
    case "INTERNAL_ERROR":
    case "UPSTREAM_UNAVAILABLE":
    case "TOKEN_PARSE_ERROR":
      return t("auth.login_error_server_error");
    default:
      return rawMessage || t("auth.login_error_invalid");
  }
}

