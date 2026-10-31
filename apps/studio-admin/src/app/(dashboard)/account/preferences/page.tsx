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
} from "@k2net/ui";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";

export default function AdminAccountPreferencesPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();

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

  const fetchData = React.useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setIsLoading(true);
      const baseUrl = getBackendBaseUrl();
      const authToken = session.accessToken ?? undefined;

      // Parallel fetching of personal security summary, devices, and password policy
      const [secRes, devRes, polRes] = await Promise.all([
        httpClient(`${baseUrl}/me/security`, { token: authToken }),
        httpClient(`${baseUrl}/me/devices`, { token: authToken }),
        httpClient(`${baseUrl}/users/password-policy`, { token: authToken }),
      ]);

      if (secRes.ok) {
        const secData: PersonalSecuritySummaryData = await secRes.json();
        setSecuritySummary(secData);
        setUserProfile({
          id: session.user.id,
          username: secData.username || session.user.username,
          name: session.user.name,
          email: secData.email || session.user.email,
          phone: secData.phone || "",
          avatarUrl: session.user.avatar_url,
        });
      }

      if (devRes.ok) {
        const devData: DeviceSessionData[] = await devRes.json();
        setDevices(devData);
      }

      if (polRes.ok) {
        const polData: PasswordPolicyData = await polRes.json();
        setPasswordPolicy(polData);
      }
    } catch (e) {
      console.warn("Failed to fetch account security data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, session?.user]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveProfile = async (data: { name: string; phone: string }) => {
    if (!session?.accessToken) return;
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/users/me/profile`, {
      method: "PUT",
      token: session.accessToken ?? undefined,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: data.name,
        email: session.user.email,
        phone: data.phone,
        avatarUrl: session.user.avatar_url,
      }),
    });

    if (res.ok) {
      toast.success(labels.profileSavedSuccess || "Profile details updated successfully.");
      fetchData();
    } else {
      toast.error(labels.profileSaveFailed || "Failed to update profile details.");
    }
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    if (!session?.accessToken) return;
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/users/me/change-password`, {
      method: "POST",
      token: session.accessToken ?? undefined,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(labels.passwordChangedSuccess || "Password changed successfully.");
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || labels.passwordChangeFailed || "Failed to change password.");
    }
  };

  const handleRevokeDevice = async (deviceId: number) => {
    if (!session?.accessToken) return;
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/me/devices/${deviceId}`, {
      method: "DELETE",
      token: session.accessToken ?? undefined,
    });

    if (res.ok) {
      toast.success(labels.deviceRevokedSuccess || "Device revoked successfully.");
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } else {
      toast.error(labels.deviceRevokeFailed || "Failed to revoke device.");
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!session?.accessToken) return;
    const baseUrl = getBackendBaseUrl();
    const authToken = session.accessToken ?? undefined;
    // Revoke all devices except the first/current
    const nonCurrent = devices.slice(1);
    await Promise.all(
      nonCurrent.map((d) =>
        httpClient(`${baseUrl}/me/devices/${d.id}`, {
          method: "DELETE",
          token: authToken,
        })
      )
    );
    toast.success(labels.allSessionsRevokedSuccess || "All other active sessions have been terminated.");
    fetchData();
  };

  const handleDisconnectProvider = async (provider: "google" | "github") => {
    if (!session?.accessToken) return;
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/users/me/social-identities/${provider}`, {
      method: "DELETE",
      token: session.accessToken ?? undefined,
    });

    if (res.ok) {
      toast.success(labels.disconnectSuccess || "Disconnected identity provider successfully.");
      fetchData();
    } else {
      toast.error(labels.disconnectFailed || "Failed to disconnect identity provider.");
    }
  };

  return (
    <AccountPreferencesShell
      plane="SYSTEM"
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
  );
}
