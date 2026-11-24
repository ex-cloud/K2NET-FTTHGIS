import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import {
  fetchSudoStatus,
  revokeSudoMode,
  requestSudoElevation,
  onSudoStatusChange,
  type SudoStatusResponse,
} from "@k2net/auth/client";
import type { AccountLabels, WebauthnRegisterChallengeData } from "@k2net/ui";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";

export function useAdminAccountLabels(): AccountLabels {
  const { t } = useTranslation();
  return React.useMemo(
    () => ({
      title: t("settings.account.title"),
      subtitle: t("settings.account.subtitle"),
      tabGeneral: t("settings.account.tab_general"),
      tabSecurity: t("settings.account.tab_security"),
      tabSessions: t("settings.account.tab_sessions"),
      tabIdentities: t("settings.account.tab_identities"),
      profileTitle: t("settings.account.profile_title"),
      profileDesc: t("settings.account.profile_desc"),
      fullNameLabel: t("settings.account.full_name_label"),
      fullNamePlaceholder: t("settings.account.full_name_placeholder"),
      usernameLabel: t("settings.account.username_label"),
      emailLabel: t("settings.account.email_label"),
      phoneLabel: t("settings.account.phone_label"),
      phonePlaceholder: t("settings.account.phone_placeholder"),
      phoneDesc: t("settings.account.phone_desc"),
      saveProfileBtn: t("settings.account.save_profile_btn"),
      saving: t("settings.account.saving"),
      profileSavedSuccess: t("settings.account.profile_saved_success"),
      profileSaveFailed: t("settings.account.profile_save_failed"),
      passwordTitle: t("settings.account.password_title"),
      passwordDesc: t("settings.account.password_desc"),
      currentPasswordLabel: t("settings.account.current_password_label"),
      currentPasswordPlaceholder: t("settings.account.current_password_placeholder"),
      newPasswordLabel: t("settings.account.new_password_label"),
      newPasswordPlaceholder: t("settings.account.new_password_placeholder"),
      confirmPasswordLabel: t("settings.account.confirm_password_label"),
      confirmPasswordPlaceholder: t("settings.account.confirm_password_placeholder"),
      changePasswordBtn: t("settings.account.change_password_btn"),
      passwordChangedSuccess: t("settings.account.password_changed_success"),
      passwordChangeFailed: t("settings.account.password_change_failed"),
      passwordMismatchError: t("settings.account.password_mismatch_error"),
      passwordPolicyTitle: t("settings.account.password_policy_title"),
      policyMinLength: t("settings.account.policy_min_length"),
      policySymbols: t("settings.account.policy_symbols"),
      policyNumbers: t("settings.account.policy_numbers"),
      policyUppercase: t("settings.account.policy_uppercase"),
      strengthWeak: t("settings.account.strength_weak"),
      strengthMedium: t("settings.account.strength_medium"),
      strengthStrong: t("settings.account.strength_strong"),
      mfaTitle: t("settings.account.mfa_title"),
      mfaDesc: t("settings.account.mfa_desc"),
      mfaStatusActive: t("settings.account.mfa_status_active"),
      mfaStatusInactive: t("settings.account.mfa_status_inactive"),
      mfaLockedPlatform: t("settings.account.mfa_locked_platform"),
      mfaLockedTenant: t("settings.account.mfa_locked_tenant"),
      mfaOptional: t("settings.account.mfa_optional"),
      mfaSetupTotp: t("settings.account.mfa_setup_totp"),
      mfaSetupPasskey: t("settings.account.mfa_setup_passkey"),
      mfaOptInNotice: t("settings.account.mfa_opt_in_notice"),
      mfaReconfigureBtn: t("settings.account.mfa_reconfigure_btn"),
      mfaDisableBtn: t("settings.account.mfa_disable_btn"),
      mfaModalTitle: t("settings.account.mfa_modal_title"),
      mfaModalDesc: t("settings.account.mfa_modal_desc"),
      mfaStepScan: t("settings.account.mfa_step_scan"),
      mfaStepVerify: t("settings.account.mfa_step_verify"),
      mfaManualKeyLabel: t("settings.account.mfa_manual_key_label"),
      mfaCopyKey: t("settings.account.mfa_copy_key"),
      mfaKeyCopied: t("settings.account.mfa_key_copied"),
      mfaCodeLabel: t("settings.account.mfa_code_label"),
      mfaCodePlaceholder: t("settings.account.mfa_code_placeholder"),
      mfaCodeInvalid: t("settings.account.mfa_code_invalid"),
      mfaVerifyBtn: t("settings.account.mfa_verify_btn"),
      mfaVerifying: t("settings.account.mfa_verifying"),
      mfaActivatedSuccess: t("settings.account.mfa_activated_success"),
      mfaDisabledSuccess: t("settings.account.mfa_disabled_success"),
      mfaDisableConfirmTitle: t("settings.account.mfa_disable_confirm_title"),
      mfaDisableConfirmDesc: t("settings.account.mfa_disable_confirm_desc"),
      mfaEmailCardTitle: t("settings.account.mfa_email_card_title"),
      mfaEmailCardDesc: t("settings.account.mfa_email_card_desc"),
      mfaSetupEmail: t("settings.account.mfa_setup_email"),
      mfaDisableEmailBtn: t("settings.account.mfa_disable_email_btn"),
      mfaEmailVerifiedBadge: t("settings.account.mfa_email_verified_badge"),
      mfaEmailUnverifiedBadge: t("settings.account.mfa_email_unverified_badge"),
      mfaEmailUnverifiedHint: t("settings.account.mfa_email_unverified_hint"),
      mfaEmailModalTitle: t("settings.account.mfa_email_modal_title"),
      mfaEmailModalDesc: t("settings.account.mfa_email_modal_desc"),
      mfaEmailSendCodeBtn: t("settings.account.mfa_email_send_code_btn"),
      mfaEmailActivatedSuccess: t("settings.account.mfa_email_activated_success"),
      mfaEmailDisabledSuccess: t("settings.account.mfa_email_disabled_success"),
      mfaEmailDisableConfirmTitle: t("settings.account.mfa_email_disable_confirm_title"),
      mfaEmailDisableConfirmDesc: t("settings.account.mfa_email_disable_confirm_desc"),
      mfaPasskeyNotice: t("settings.account.mfa_passkey_notice"),
      sessionsTitle: t("settings.account.sessions_title"),
      sessionsDesc: t("settings.account.sessions_desc"),
      sessionsColDeviceOs: t("settings.account.sessions_col_device_os"),
      sessionsColBrowser: t("settings.account.sessions_col_browser"),
      sessionsColIp: t("settings.account.sessions_col_ip"),
      sessionsColLastActive: t("settings.account.sessions_col_last_active"),
      sessionsColStatus: t("settings.account.sessions_col_status"),
      sessionsColAction: t("settings.account.sessions_col_action"),
      currentDeviceBadge: t("settings.account.current_device_badge"),
      trustedBadge: t("settings.account.trusted_badge"),
      untrustedBadge: t("settings.account.untrusted_badge"),
      revokeDeviceBtn: t("settings.account.revoke_device_btn"),
      revokeAllSessionsBtn: t("settings.account.revoke_all_sessions_btn"),
      revokeAllConfirmTitle: t("settings.account.revoke_all_confirm_title"),
      revokeAllConfirmDesc: t("settings.account.revoke_all_confirm_desc"),
      revokeAllConfirmBtn: t("settings.account.revoke_all_confirm_btn"),
      deviceRevokedSuccess: t("settings.account.device_revoked_success"),
      deviceRevokeFailed: t("settings.account.device_revoke_failed"),
      allSessionsRevokedSuccess: t("settings.account.all_sessions_revoked_success"),
      noDevicesFound: t("settings.account.no_devices_found"),
      socialTitle: t("settings.account.social_title"),
      socialDesc: t("settings.account.social_desc"),
      connectBtn: t("settings.account.connect_btn"),
      disconnectBtn: t("settings.account.disconnect_btn"),
      connectedBadge: t("settings.account.connected_badge"),
      disconnectSuccess: t("settings.account.disconnect_success"),
      disconnectFailed: t("settings.account.disconnect_failed"),
      idleLockTitle: t("settings.account.idle_lock_title"),
      idleLockDesc: t("settings.account.idle_lock_desc"),
      unlockSessionBtn: t("settings.account.unlock_session_btn"),
      passkeyModalTitle: t("settings.account.passkey_modal_title"),
      passkeyModalDesc: t("settings.account.passkey_modal_desc"),
      passkeyDeviceNameLabel: t("settings.account.passkey_device_name_label"),
      passkeyDeviceNamePlaceholder: t("settings.account.passkey_device_name_placeholder"),
      passkeyDeviceNameHint: t("settings.account.passkey_device_name_hint"),
      passkeyHowItWorksTitle: t("settings.account.passkey_how_it_works_title"),
      passkeyHowItWorksDesc: t("settings.account.passkey_how_it_works_desc"),
      passkeyRegisterBtn: t("settings.account.passkey_register_btn"),
      passkeyRegistering: t("settings.account.passkey_registering"),
      passkeySuccessTitle: t("settings.account.passkey_success_title"),
      passkeySuccessDesc: t("settings.account.passkey_success_desc"),
      passkeyUnsupported: t("settings.account.passkey_unsupported"),
      passkeyCancelled: t("settings.account.passkey_cancelled"),
      passkeyDeleteConfirmTitle: t("settings.account.passkey_delete_confirm_title"),
      passkeyDeleteConfirmDesc: t("settings.account.passkey_delete_confirm_desc"),
      passkeyDeletedSuccess: t("settings.account.passkey_deleted_success"),
      passkeyDeleteFailed: t("settings.account.passkey_delete_failed"),
      registeredPasskeysTitle: t("settings.account.registered_passkeys_title"),
      removePasskeyBtn: t("settings.account.remove_passkey_btn"),
      passkeyMethodTypeLabel: t("settings.account.passkey_method_type_label"),
      passkeyTypePlatformTitle: t("settings.account.passkey_type_platform_title"),
      passkeyTypePlatformDesc: t("settings.account.passkey_type_platform_desc"),
      passkeyTypeCrossPlatformTitle: t("settings.account.passkey_type_cross_platform_title"),
      passkeyTypeCrossPlatformDesc: t("settings.account.passkey_type_cross_platform_desc"),
      passkeyHowItWorksPlatformDesc: t("settings.account.passkey_how_it_works_platform_desc"),
      passkeyHowItWorksCrossPlatformDesc: t("settings.account.passkey_how_it_works_cross_platform_desc"),
      passkeyPlatformNotSupported: t("settings.account.passkey_platform_not_supported"),
      passkeySingleDeviceWarningTitle: t("settings.account.passkey_single_device_warning_title"),
      passkeySingleDeviceWarningDesc: t("settings.account.passkey_single_device_warning_desc"),
      passkeyAddSecondaryBtn: t("settings.account.passkey_add_secondary_btn"),
      passkeyMultiDeviceActiveBadge: t("settings.account.passkey_multi_device_active_badge"),
      backupCodesTitle: t("settings.account.backup_codes_title"),
      backupCodesDesc: t("settings.account.backup_codes_desc"),
      backupCodesActive: t("settings.account.backup_codes_active"),
      backupCodesInactive: t("settings.account.backup_codes_inactive"),
      backupCodesRemainingBadge: t("settings.account.backup_codes_remaining_badge"),
      backupCodesGenerateBtn: t("settings.account.backup_codes_generate_btn"),
      backupCodesRegenerateBtn: t("settings.account.backup_codes_regenerate_btn"),
      backupCodesViewBtn: t("settings.account.backup_codes_view_btn"),
      backupCodesModalTitle: t("settings.account.backup_codes_modal_title"),
      backupCodesModalDesc: t("settings.account.backup_codes_modal_desc"),
      backupCodesWarning: t("settings.account.backup_codes_warning"),
      backupCodesCopyBtn: t("settings.account.backup_codes_copy_btn"),
      backupCodesCopied: t("settings.account.backup_codes_copied"),
      backupCodesDownloadBtn: t("settings.account.backup_codes_download_btn"),
      backupCodesPrintBtn: t("settings.account.backup_codes_print_btn"),
      backupCodesRegenerateConfirmTitle: t("settings.account.backup_codes_regenerate_confirm_title"),
      backupCodesRegenerateConfirmDesc: t("settings.account.backup_codes_regenerate_confirm_desc"),
      doneBtn: t("settings.account.done_btn"),
      cancelBtn: t("settings.account.cancel_btn"),
      sudoCardTitle: t("settings.account.sudo_card_title"),
      sudoCardDesc: t("settings.account.sudo_card_desc"),
      sudoStatusActive: t("settings.account.sudo_status_active"),
      sudoStatusFreshLogin: t("settings.account.sudo_status_fresh_login"),
      sudoStatusLocked: t("settings.account.sudo_status_locked"),
      sudoStatusBreakGlassNotice: t("settings.account.sudo_status_break_glass_notice"),
      sudoLockBtn: t("settings.account.sudo_lock_btn"),
      sudoLockingBtn: t("settings.account.sudo_locking_btn"),
      sudoVerifyBtn: t("settings.account.sudo_verify_btn"),
    }),
    [t]
  );
}

export function useAdminSudoControls(accessToken: string | null | undefined) {
  const { t } = useTranslation();
  const [sudoStatus, setSudoStatus] = React.useState<SudoStatusResponse | null>(null);
  const [isLockingSudo, setIsLockingSudo] = React.useState(false);

  React.useEffect(() => {
    const unsub = onSudoStatusChange((next) => {
      if (next) setSudoStatus(next);
    });
    return unsub;
  }, []);

  const refreshSudoStatus = React.useCallback(async () => {
    const fetched = await fetchSudoStatus(accessToken);
    if (fetched) setSudoStatus(fetched);
  }, [accessToken]);

  const handleLockSudo = React.useCallback(async () => {
    try {
      setIsLockingSudo(true);
      const ok = await revokeSudoMode(accessToken);
      if (ok) {
        toast.success(t("settings.account.sudo_locked_success"));
      }
    } finally {
      setIsLockingSudo(false);
    }
  }, [accessToken, t]);

  const handleElevateSudo = React.useCallback(async () => {
    await requestSudoElevation({ action: "account.sudo.manual" });
  }, []);

  return {
    sudoStatus,
    isLockingSudo,
    refreshSudoStatus,
    handleLockSudo,
    handleElevateSudo,
  };
}

export function useAdminMfaHandlers(accessToken: string | null | undefined) {
  const handleFetchTotpSetup = React.useCallback(async () => {
    if (!accessToken) throw new Error("Unauthorized");
    const res = await httpClient(`${getBackendBaseUrl()}/me/mfa/totp/setup`, {
      method: "POST",
      token: accessToken,
    });
    if (!res.ok) throw new Error("Failed to initialize TOTP setup");
    return (await res.json()) as {
      secret: string;
      formattedSecret: string;
      otpauthUri: string;
      accountName: string;
      issuer: string;
    };
  }, [accessToken]);

  const handleVerifyTotp = React.useCallback(
    async (secret: string, code: string) => {
      if (!accessToken) return { success: false, message: "Unauthorized" };
      const res = await httpClient(`${getBackendBaseUrl()}/me/mfa/totp/verify`, {
        method: "POST",
        token: accessToken,
        body: JSON.stringify({ secret, code }),
      });
      const data = await res.json().catch(() => ({}));
      return res.ok
        ? { success: true, message: data.message }
        : { success: false, message: data.message || "Invalid 6-digit code" };
    },
    [accessToken]
  );

  const handleSendEmailOtpSetup = React.useCallback(async () => {
    if (!accessToken) return { success: false, message: "Unauthorized" };
    const res = await httpClient(`${getBackendBaseUrl()}/me/mfa/email/setup`, {
      method: "POST",
      token: accessToken,
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok, maskedEmail: data.maskedEmail, message: data.message };
  }, [accessToken]);

  const handleVerifyEmailOtpSetup = React.useCallback(
    async (code: string) => {
      if (!accessToken) return { success: false, message: "Unauthorized" };
      const res = await httpClient(`${getBackendBaseUrl()}/me/mfa/email/verify`, {
        method: "POST",
        token: accessToken,
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: data.message || (res.ok ? undefined : "Invalid 6-digit code"),
      };
    },
    [accessToken]
  );

  const handleFetchPasskeyChallenge = React.useCallback(async () => {
    if (!accessToken) throw new Error("Unauthorized");
    const res = await httpClient(`${getBackendBaseUrl()}/me/webauthn/register/challenge`, {
      method: "POST",
      token: accessToken,
    });
    if (!res.ok) throw new Error("Failed to initialize Passkey registration challenge");
    return (await res.json()) as WebauthnRegisterChallengeData;
  }, [accessToken]);

  const handleVerifyPasskey = React.useCallback(
    async (payload: {
      credentialId: string;
      clientDataJSON: string;
      attestationObject: string;
      deviceName: string;
    }) => {
      if (!accessToken) return { success: false, message: "Unauthorized" };
      const res = await httpClient(`${getBackendBaseUrl()}/me/webauthn/register/verify`, {
        method: "POST",
        token: accessToken,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return res.ok
        ? { success: true, message: data.message }
        : { success: false, message: data.message || "Failed to verify passkey registration" };
    },
    [accessToken]
  );

  return {
    handleFetchTotpSetup,
    handleVerifyTotp,
    handleSendEmailOtpSetup,
    handleVerifyEmailOtpSetup,
    handleFetchPasskeyChallenge,
    handleVerifyPasskey,
  };
}
