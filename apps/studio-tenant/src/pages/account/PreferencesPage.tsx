import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import {
  AccountPreferencesShell,
  useIdleTimeout,
  IdleLockModal,
  TotpSetupModal,
  PasskeyRegisterModal,
  type AccountLabels,
  type UserProfileData,
  type PersonalSecuritySummaryData,
  type PasswordPolicyData,
  type DeviceSessionData,
  type WebauthnCredentialData,
  type WebauthnRegisterChallengeData,
} from "@k2net/ui";
import { useAuth } from "@k2net/auth/client";
import { apiClient } from "../../lib/api-client";

export function PreferencesPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = React.useState(true);
  const [userProfile, setUserProfile] = React.useState<UserProfileData | undefined>(undefined);
  const [securitySummary, setSecuritySummary] = React.useState<PersonalSecuritySummaryData | undefined>(undefined);
  const [passwordPolicy, setPasswordPolicy] = React.useState<PasswordPolicyData | undefined>(undefined);
  const [devices, setDevices] = React.useState<DeviceSessionData[]>([]);
  const [passkeys, setPasskeys] = React.useState<WebauthnCredentialData[]>([]);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = React.useState(false);

  const labels: AccountLabels = React.useMemo(
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
      mfaPasskeyNotice: t("settings.account.mfa_passkey_notice"),
      sessionsTitle: t("settings.account.sessions_title"),
      sessionsDesc: t("settings.account.sessions_desc"),
      currentDeviceBadge: t("settings.account.current_device_badge"),
      trustedBadge: t("settings.account.trusted_badge"),
      untrustedBadge: t("settings.account.untrusted_badge"),
      revokeDeviceBtn: t("settings.account.revoke_device_btn"),
      revokeAllSessionsBtn: t("settings.account.revoke_all_sessions_btn"),
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
      doneBtn: t("settings.account.done_btn"),
      cancelBtn: t("settings.account.cancel_btn"),
    }),
    [t]
  );

  // Client-side idle lock hook reading timeout (default 30 min)
  const { isIdle, unlock } = useIdleTimeout({
    timeoutMinutes: 30,
    isEnabled: true,
  });

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);

      const [secData, devData, polData, passkeysData] = await Promise.all([
        apiClient<PersonalSecuritySummaryData>("/api/v1/me/security").catch(() => null),
        apiClient<DeviceSessionData[]>("/api/v1/me/devices").catch(() => []),
        apiClient<PasswordPolicyData>("/api/v1/users/password-policy").catch(() => null),
        apiClient<WebauthnCredentialData[]>("/api/v1/me/webauthn/credentials").catch(() => []),
      ]);

      if (secData) {
        setSecuritySummary(secData);
        setUserProfile((prev) => ({
          id: user?.id || prev?.id,
          username: secData.username || user?.username || prev?.username,
          name: secData.fullName || user?.name || (user as { fullName?: string })?.fullName || prev?.name,
          email: secData.email || user?.email || prev?.email,
          phone: secData.phone || prev?.phone || "",
          avatarUrl: user?.avatarUrl || prev?.avatarUrl,
        }));
      }

      if (devData) {
        setDevices(devData);
      }

      if (polData) {
        setPasswordPolicy(polData);
      }

      if (passkeysData) {
        setPasskeys(passkeysData);
      }
    } catch (e) {
      console.warn("Failed to fetch tenant account security data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        id: user.id || prev?.id,
        username: user.username || prev?.username,
        name: user.name || (user as { fullName?: string })?.fullName || prev?.name,
        email: user.email || prev?.email,
        phone: (user as { phone?: string })?.phone || prev?.phone || "",
        avatarUrl: user.avatarUrl || prev?.avatarUrl,
      }));
    }
  }, [user]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveProfile = async (data: { name: string; phone: string }) => {
    try {
      await apiClient("/api/v1/users/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: data.name,
          email: user?.email,
          phone: data.phone,
          avatarUrl: user?.avatarUrl,
        }),
      });
      toast.success(labels.profileSavedSuccess || "Profile details updated successfully.");
      fetchData();
    } catch {
      toast.error(labels.profileSaveFailed || "Failed to update profile details.");
    }
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      await apiClient("/api/v1/users/me/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(labels.passwordChangedSuccess || "Password changed successfully.");
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : labels.passwordChangeFailed || "Failed to change password.");
    }
  };

  const handleRevokeDevice = async (deviceId: number) => {
    try {
      await apiClient(`/api/v1/me/devices/${deviceId}`, {
        method: "DELETE",
      });
      toast.success(labels.deviceRevokedSuccess || "Device revoked successfully.");
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch {
      toast.error(labels.deviceRevokeFailed || "Failed to revoke device.");
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      const nonCurrent = devices.slice(1);
      await Promise.all(
        nonCurrent.map((d) =>
          apiClient(`/api/v1/me/devices/${d.id}`, {
            method: "DELETE",
          })
        )
      );
      toast.success(labels.allSessionsRevokedSuccess || "All other active sessions have been terminated.");
      fetchData();
    } catch {
      toast.error(labels.deviceRevokeFailed || "Failed to revoke sessions.");
    }
  };

  const handleDisconnectProvider = async (provider: "google" | "github") => {
    try {
      await apiClient(`/api/v1/users/me/social-identities/${provider}`, {
        method: "DELETE",
      });
      toast.success(labels.disconnectSuccess || "Disconnected identity provider successfully.");
      fetchData();
    } catch {
      toast.error(labels.disconnectFailed || "Failed to disconnect identity provider.");
    }
  };

  const [isTotpModalOpen, setIsTotpModalOpen] = React.useState(false);

  const handleFetchTotpSetup = React.useCallback(async () => {
    return await apiClient<{
      secret: string;
      formattedSecret: string;
      otpauthUri: string;
      accountName: string;
      issuer: string;
    }>("/api/v1/me/mfa/totp/setup", {
      method: "POST",
    });
  }, []);

  const handleVerifyTotp = React.useCallback(async (secret: string, code: string) => {
    try {
      const res = await apiClient<{ success: boolean; message?: string }>("/api/v1/me/mfa/totp/verify", {
        method: "POST",
        body: JSON.stringify({ secret, code }),
      });
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify code";
      return { success: false, message: msg };
    }
  }, []);

  const handleDisableTotp = async () => {
    if (!window.confirm(labels.mfaDisableConfirmDesc || "Are you sure you want to disable two-factor authentication?")) {
      return;
    }
    try {
      await apiClient("/api/v1/me/mfa/totp", { method: "DELETE" });
      toast.success(labels.mfaDisabledSuccess || "Two-factor authentication disabled.");
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disable 2FA";
      toast.error(msg);
    }
  };

  const handleFetchPasskeyChallenge = React.useCallback(async () => {
    return await apiClient<WebauthnRegisterChallengeData>("/api/v1/me/webauthn/register/challenge", {
      method: "POST",
    });
  }, []);

  const handleVerifyPasskey = React.useCallback(
    async (payload: { credentialId: string; clientDataJSON: string; attestationObject: string; deviceName: string }) => {
      try {
        const res = await apiClient<{ success: boolean; message?: string }>("/api/v1/me/webauthn/register/verify", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to verify passkey registration";
        return { success: false, message: msg };
      }
    },
    []
  );

  const handleDeletePasskey = async (credentialId: string) => {
    if (!window.confirm(labels.passkeyDeleteConfirmDesc || "Are you sure you want to remove this passkey?")) {
      return;
    }
    try {
      await apiClient(`/api/v1/me/webauthn/credentials/${encodeURIComponent(credentialId)}`, {
        method: "DELETE",
      });
      toast.success(labels.passkeyDeletedSuccess || "Passkey removed successfully.");
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : labels.passkeyDeleteFailed || "Failed to remove passkey.";
      toast.error(msg);
    }
  };

  const handleSetupPasskey = () => {
    setIsPasskeyModalOpen(true);
  };

  return (
    <>
      <AccountPreferencesShell
        plane="TENANT"
        user={userProfile}
        summary={securitySummary}
        passkeys={passkeys}
        policy={passwordPolicy}
        devices={devices}
        labels={labels}
        onSaveProfile={handleSaveProfile}
        onChangePassword={handleChangePassword}
        onSetupTotp={() => setIsTotpModalOpen(true)}
        onDisableTotp={handleDisableTotp}
        onSetupPasskey={handleSetupPasskey}
        onDeletePasskey={handleDeletePasskey}
        onRevokeDevice={handleRevokeDevice}
        onRevokeAllSessions={handleRevokeAllSessions}
        onDisconnectProvider={handleDisconnectProvider}
        isLoading={isLoading}
      />
      <TotpSetupModal
        open={isTotpModalOpen}
        onOpenChange={setIsTotpModalOpen}
        labels={labels}
        onFetchSetup={handleFetchTotpSetup}
        onVerify={handleVerifyTotp}
        onSuccess={() => {
          toast.success(labels.mfaActivatedSuccess || "Two-factor authentication activated!");
          setSecuritySummary((prev) =>
            prev
              ? { ...prev, mfaEnabled: true }
              : {
                  mfaEnabled: true,
                  mfaEnforced: false,
                  trustedDevicesCount: 1,
                  activeSessionsCount: 1,
                }
          );
          fetchData();
        }}
      />
      <PasskeyRegisterModal
        open={isPasskeyModalOpen}
        onOpenChange={setIsPasskeyModalOpen}
        labels={labels}
        onFetchChallenge={handleFetchPasskeyChallenge}
        onVerify={handleVerifyPasskey}
        onSuccess={() => {
          toast.success(labels.passkeySuccessTitle || "Passkey registered successfully!");
          setSecuritySummary((prev) =>
            prev
              ? { ...prev, mfaEnabled: true }
              : {
                  mfaEnabled: true,
                  mfaEnforced: false,
                  trustedDevicesCount: 1,
                  activeSessionsCount: 1,
                }
          );
          fetchData();
        }}
      />
      <IdleLockModal
        open={isIdle}
        onUnlock={unlock}
        onLogout={logout}
        labels={labels}
      />
    </>
  );
}

export default PreferencesPage;

