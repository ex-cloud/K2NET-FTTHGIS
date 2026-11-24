import * as React from "react";
import { toast } from "sonner";
import {
  AccountPreferencesShell,
  TotpSetupModal,
  PasskeyRegisterModal,
  EmailOtpSetupModal,
  type UserProfileData,
  type PersonalSecuritySummaryData,
  type PasswordPolicyData,
  type DeviceSessionData,
  type WebauthnCredentialData,
  type SocialIdentityData,
  type BackupCodesStatusData,
} from "@k2net/ui";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import {
  useAdminAccountLabels,
  useAdminSudoControls,
  useAdminMfaHandlers,
} from "./useAdminAccountHelpers";

export default function AdminAccountPreferencesPage() {
  const labels = useAdminAccountLabels();
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = React.useState(true);
  const [userProfile, setUserProfile] = React.useState<UserProfileData | undefined>(undefined);
  const [securitySummary, setSecuritySummary] = React.useState<PersonalSecuritySummaryData | undefined>(undefined);
  const [passwordPolicy, setPasswordPolicy] = React.useState<PasswordPolicyData | undefined>(undefined);
  const [devices, setDevices] = React.useState<DeviceSessionData[]>([]);
  const [passkeys, setPasskeys] = React.useState<WebauthnCredentialData[]>([]);
  const [socialIdentities, setSocialIdentities] = React.useState<SocialIdentityData[]>([]);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = React.useState(false);

  const {
    sudoStatus,
    isLockingSudo,
    refreshSudoStatus,
    handleLockSudo,
    handleElevateSudo,
  } = useAdminSudoControls(session?.accessToken);

  const fetchData = React.useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setIsLoading(true);
      const baseUrl = getBackendBaseUrl();
      const authToken = session.accessToken ?? undefined;

      // Parallel fetching of personal security summary, devices, password policy, passkeys, and social identities
      const [secRes, devRes, polRes, passkeyRes, socialRes] = await Promise.all([
        httpClient(`${baseUrl}/me/security`, { token: authToken }),
        httpClient(`${baseUrl}/me/devices`, { token: authToken }),
        httpClient(`${baseUrl}/users/password-policy`, { token: authToken }),
        httpClient(`${baseUrl}/me/webauthn/credentials`, { token: authToken }),
        httpClient(`${baseUrl}/users/me/social-identities`, { token: authToken }),
        refreshSudoStatus(),
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

      if (socialRes.ok) {
        const socialData: SocialIdentityData[] = await socialRes.json();
        setSocialIdentities(socialData);
      }
    } catch (e) {
      console.warn("Failed to fetch account security data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, session?.user, refreshSudoStatus]);

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
    const res = await httpClient(`${baseUrl}/me/devices/others`, {
      method: "DELETE",
      token: authToken,
    });
    if (res.ok) {
      toast.success(labels.allSessionsRevokedSuccess || "All other active sessions have been terminated.");
      fetchData();
    } else {
      toast.error(labels.deviceRevokeFailed || "Failed to revoke sessions.");
    }
  };

  const handleDisconnectProvider = async (provider: string) => {
    if (!session?.accessToken) return;
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/users/me/social-identities/${encodeURIComponent(provider)}`, {
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
  const [isEmailOtpModalOpen, setIsEmailOtpModalOpen] = React.useState(false);
  const {
    handleFetchTotpSetup,
    handleVerifyTotp,
    handleSendEmailOtpSetup,
    handleVerifyEmailOtpSetup,
    handleFetchPasskeyChallenge,
    handleVerifyPasskey,
  } = useAdminMfaHandlers(session?.accessToken);

  const handleDisableTotp = async () => {
    if (!session?.accessToken) return;
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

  const handleDisableEmailOtp = async () => {
    if (!session?.accessToken) return;
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/me/mfa/email`, {
      method: "DELETE",
      token: session.accessToken ?? undefined,
    });
    if (res.ok) {
      toast.success(labels.mfaEmailDisabledSuccess || "Email two-factor authentication disabled.");
      fetchData();
    } else {
      toast.error("Failed to disable Email 2FA.");
    }
  };

  const handleDeletePasskey = async (credentialId: string) => {
    if (!session?.accessToken) return;
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

  const handleFetchBackupCodesStatus = React.useCallback(async () => {
    if (!session?.accessToken) throw new Error("Unauthorized");
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/me/mfa/backup-codes`, {
      token: session.accessToken ?? undefined,
    });
    if (!res.ok) {
      throw new Error("Failed to fetch backup codes status");
    }
    return (await res.json()) as BackupCodesStatusData;
  }, [session?.accessToken]);

  const handleGenerateBackupCodes = React.useCallback(async () => {
    if (!session?.accessToken) throw new Error("Unauthorized");
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/me/mfa/backup-codes/generate`, {
      method: "POST",
      token: session.accessToken ?? undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, codes: [], message: data.message || "Failed to generate backup codes" };
    }
    return {
      success: true,
      codes: data.codes || [],
      remainingCount: data.remainingCount,
      totalCount: data.totalCount,
      generatedAt: data.generatedAt,
      message: data.message,
    };
  }, [session?.accessToken]);

  return (
    <>
      <AccountPreferencesShell
        plane="SYSTEM"
        user={userProfile}
        summary={securitySummary}
        socialIdentities={socialIdentities}
        passkeys={passkeys}
        policy={passwordPolicy}
        devices={devices}
        labels={labels}
        sudoStatus={sudoStatus}
        onLockSudo={handleLockSudo}
        onElevateSudo={handleElevateSudo}
        isLockingSudo={isLockingSudo}
        onSaveProfile={handleSaveProfile}
        onChangePassword={handleChangePassword}
        onSetupTotp={() => setIsTotpModalOpen(true)}
        onDisableTotp={handleDisableTotp}
        onSetupPasskey={() => setIsPasskeyModalOpen(true)}
        onDeletePasskey={handleDeletePasskey}
        onFetchBackupCodesStatus={handleFetchBackupCodesStatus}
        onGenerateBackupCodes={handleGenerateBackupCodes}
        onBackupCodesSuccess={() => {
          fetchData();
        }}
        onSetupEmailOtp={() => setIsEmailOtpModalOpen(true)}
        onDisableEmailOtp={handleDisableEmailOtp}
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
            prev ? { ...prev, mfaEnabled: true, totpEnabled: true } : undefined
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
            prev ? { ...prev, mfaEnabled: true, passkeyEnabled: true } : undefined
          );
          fetchData();
        }}
      />
      <EmailOtpSetupModal
        open={isEmailOtpModalOpen}
        onOpenChange={setIsEmailOtpModalOpen}
        labels={labels}
        onSendCode={handleSendEmailOtpSetup}
        onVerify={handleVerifyEmailOtpSetup}
        onSuccess={() => {
          toast.success(labels.mfaEmailActivatedSuccess || "Email two-factor authentication enabled!");
          setSecuritySummary((prev) =>
            prev ? { ...prev, mfaEnabled: true, emailOtpEnabled: true } : undefined
          );
          fetchData();
        }}
      />
    </>
  );
}
