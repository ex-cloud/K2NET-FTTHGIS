import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import {
  AccountPreferencesShell,
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
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";

function useAccountLabels(): AccountLabels {
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
}

export default function AdminAccountPreferencesPage() {
  const labels = useAccountLabels();
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = React.useState(true);
  const [userProfile, setUserProfile] = React.useState<UserProfileData | undefined>(undefined);
  const [securitySummary, setSecuritySummary] = React.useState<PersonalSecuritySummaryData | undefined>(undefined);
  const [passwordPolicy, setPasswordPolicy] = React.useState<PasswordPolicyData | undefined>(undefined);
  const [devices, setDevices] = React.useState<DeviceSessionData[]>([]);
  const [passkeys, setPasskeys] = React.useState<WebauthnCredentialData[]>([]);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setIsLoading(true);
      const baseUrl = getBackendBaseUrl();
      const authToken = session.accessToken ?? undefined;

      // Parallel fetching of personal security summary, devices, password policy, and passkeys
      const [secRes, devRes, polRes, passkeyRes] = await Promise.all([
        httpClient(`${baseUrl}/me/security`, { token: authToken }),
        httpClient(`${baseUrl}/me/devices`, { token: authToken }),
        httpClient(`${baseUrl}/users/password-policy`, { token: authToken }),
        httpClient(`${baseUrl}/me/webauthn/credentials`, { token: authToken }),
      ]);

      if (secRes.ok) {
        const secData: PersonalSecuritySummaryData = await secRes.json();
        setSecuritySummary(secData);
        setUserProfile((prev) => ({
          id: session.user.id || prev?.id,
          username: secData.username || session.user.username || prev?.username,
          name: secData.fullName || session.user.name || (session.user as { fullName?: string })?.fullName || prev?.name,
          email: secData.email || session.user.email || prev?.email,
          phone: secData.phone || prev?.phone || "",
          avatarUrl: session.user.avatar_url || prev?.avatarUrl,
        }));
      }

      if (devRes.ok) {
        const devData: DeviceSessionData[] = await devRes.json();
        setDevices(devData);
      }

      if (polRes.ok) {
        const polData: PasswordPolicyData = await polRes.json();
        setPasswordPolicy(polData);
      }

      if (passkeyRes.ok) {
        const passkeyData: WebauthnCredentialData[] = await passkeyRes.json();
        setPasskeys(passkeyData);
      }
    } catch (e) {
      console.warn("Failed to fetch account security data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, session?.user]);

  React.useEffect(() => {
    if (session?.user) {
      setUserProfile((prev) => ({
        id: session.user.id || prev?.id,
        username: session.user.username || prev?.username,
        name: session.user.name || (session.user as { fullName?: string })?.fullName || prev?.name,
        email: session.user.email || prev?.email,
        phone: (session.user as { phone?: string })?.phone || prev?.phone || "",
        avatarUrl: session.user.avatar_url || prev?.avatarUrl,
      }));
    }
  }, [session?.user]);

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

  const [isTotpModalOpen, setIsTotpModalOpen] = React.useState(false);

  const handleFetchTotpSetup = React.useCallback(async () => {
    if (!session?.accessToken) throw new Error("Unauthorized");
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/me/mfa/totp/setup`, {
      method: "POST",
      token: session.accessToken ?? undefined,
    });
    if (!res.ok) {
      throw new Error("Failed to initialize TOTP setup");
    }
    return (await res.json()) as {
      secret: string;
      formattedSecret: string;
      otpauthUri: string;
      accountName: string;
      issuer: string;
    };
  }, [session?.accessToken]);

  const handleVerifyTotp = React.useCallback(
    async (secret: string, code: string) => {
      if (!session?.accessToken) return { success: false, message: "Unauthorized" };
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/me/mfa/totp/verify`, {
        method: "POST",
        token: session.accessToken ?? undefined,
        body: JSON.stringify({ secret, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || "Invalid 6-digit code" };
    },
    [session?.accessToken]
  );

  const handleDisableTotp = async () => {
    if (!session?.accessToken) return;
    if (!window.confirm(labels.mfaDisableConfirmDesc || "Are you sure you want to disable two-factor authentication?")) {
      return;
    }
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/me/mfa/totp`, {
      method: "DELETE",
      token: session.accessToken ?? undefined,
    });
    if (res.ok) {
      toast.success(labels.mfaDisabledSuccess || "Two-factor authentication disabled.");
      fetchData();
    } else {
      toast.error("Failed to disable 2FA. Platform security policy may require 2FA.");
    }
  };

  const handleFetchPasskeyChallenge = React.useCallback(async () => {
    if (!session?.accessToken) throw new Error("Unauthorized");
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/me/webauthn/register/challenge`, {
      method: "POST",
      token: session.accessToken ?? undefined,
    });
    if (!res.ok) {
      throw new Error("Failed to initialize Passkey registration challenge");
    }
    return (await res.json()) as WebauthnRegisterChallengeData;
  }, [session?.accessToken]);

  const handleVerifyPasskey = React.useCallback(
    async (payload: { credentialId: string; clientDataJSON: string; attestationObject: string; deviceName: string }) => {
      if (!session?.accessToken) return { success: false, message: "Unauthorized" };
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/me/webauthn/register/verify`, {
        method: "POST",
        token: session.accessToken ?? undefined,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || "Failed to verify passkey registration" };
    },
    [session?.accessToken]
  );

  const handleDeletePasskey = async (credentialId: string) => {
    if (!session?.accessToken) return;
    if (!window.confirm(labels.passkeyDeleteConfirmDesc || "Are you sure you want to remove this passkey?")) {
      return;
    }
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/me/webauthn/credentials/${encodeURIComponent(credentialId)}`, {
      method: "DELETE",
      token: session.accessToken ?? undefined,
    });
    if (res.ok) {
      toast.success(labels.passkeyDeletedSuccess || "Passkey removed successfully.");
      fetchData();
    } else {
      toast.error(labels.passkeyDeleteFailed || "Failed to remove passkey.");
    }
  };

  const handleSetupPasskey = () => {
    setIsPasskeyModalOpen(true);
  };

  return (
    <>
      <AccountPreferencesShell
        plane="SYSTEM"
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
    </>
  );
}
