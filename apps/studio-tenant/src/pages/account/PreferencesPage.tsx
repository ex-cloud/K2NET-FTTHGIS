import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import {
  AccountPreferencesShell,
  AccountLabels,
  UserProfileData,
  PersonalSecuritySummaryData,
  PasswordPolicyData,
  DeviceSessionData,
  useIdleTimeout,
  IdleLockModal,
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

      const [secData, devData, polData] = await Promise.all([
        apiClient<PersonalSecuritySummaryData>("/api/v1/me/security").catch(() => null),
        apiClient<DeviceSessionData[]>("/api/v1/me/devices").catch(() => []),
        apiClient<PasswordPolicyData>("/api/v1/users/password-policy").catch(() => null),
      ]);

      if (secData) {
        setSecuritySummary(secData);
        setUserProfile({
          id: user?.id,
          username: secData.username || user?.username,
          name: user?.name,
          email: secData.email || user?.email,
          phone: secData.phone || "",
          avatarUrl: user?.avatarUrl,
        });
      }

      if (devData) {
        setDevices(devData);
      }

      if (polData) {
        setPasswordPolicy(polData);
      }
    } catch (e) {
      console.warn("Failed to fetch tenant account security data:", e);
    } finally {
      setIsLoading(false);
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

  return (
    <>
      <AccountPreferencesShell
        plane="TENANT"
        user={userProfile}
        summary={securitySummary}
        policy={passwordPolicy}
        devices={devices}
        labels={labels}
        onSaveProfile={handleSaveProfile}
        onChangePassword={handleChangePassword}
        onRevokeDevice={handleRevokeDevice}
        onRevokeAllSessions={handleRevokeAllSessions}
        onDisconnectProvider={handleDisconnectProvider}
        isLoading={isLoading}
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
