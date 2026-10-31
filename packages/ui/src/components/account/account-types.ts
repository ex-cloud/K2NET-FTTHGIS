export type PlaneType = "SYSTEM" | "TENANT";

export interface UserProfileData {
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface PasswordPolicyData {
  minLength: number;
  requireSymbols: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
}

export interface DeviceSessionData {
  id: number;
  deviceFingerprint: string;
  browser: string;
  os: string;
  ipAddress: string;
  verified: boolean;
  lastUsedAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface PersonalSecuritySummaryData {
  username?: string;
  email?: string;
  phone?: string;
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  mfaEnforcementSource?: string;
  trustedDevicesCount: number;
  activeSessionsCount: number;
  linkedProviders?: string[];
}

export interface AccountLabels {
  title?: string;
  subtitle?: string;
  tabGeneral?: string;
  tabSecurity?: string;
  tabSessions?: string;
  tabIdentities?: string;
  profileTitle?: string;
  profileDesc?: string;
  fullNameLabel?: string;
  fullNamePlaceholder?: string;
  usernameLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  phonePlaceholder?: string;
  phoneDesc?: string;
  saveProfileBtn?: string;
  saving?: string;
  profileSavedSuccess?: string;
  profileSaveFailed?: string;
  passwordTitle?: string;
  passwordDesc?: string;
  currentPasswordLabel?: string;
  currentPasswordPlaceholder?: string;
  newPasswordLabel?: string;
  newPasswordPlaceholder?: string;
  confirmPasswordLabel?: string;
  confirmPasswordPlaceholder?: string;
  changePasswordBtn?: string;
  passwordChangedSuccess?: string;
  passwordChangeFailed?: string;
  passwordMismatchError?: string;
  passwordPolicyTitle?: string;
  policyMinLength?: string;
  policySymbols?: string;
  policyNumbers?: string;
  policyUppercase?: string;
  strengthWeak?: string;
  strengthMedium?: string;
  strengthStrong?: string;
  mfaTitle?: string;
  mfaDesc?: string;
  mfaStatusActive?: string;
  mfaStatusInactive?: string;
  mfaLockedPlatform?: string;
  mfaLockedTenant?: string;
  mfaOptional?: string;
  mfaSetupTotp?: string;
  mfaSetupPasskey?: string;
  mfaOptInNotice?: string;
  sessionsTitle?: string;
  sessionsDesc?: string;
  currentDeviceBadge?: string;
  trustedBadge?: string;
  untrustedBadge?: string;
  revokeDeviceBtn?: string;
  revokeAllSessionsBtn?: string;
  deviceRevokedSuccess?: string;
  deviceRevokeFailed?: string;
  allSessionsRevokedSuccess?: string;
  noDevicesFound?: string;
  socialTitle?: string;
  socialDesc?: string;
  connectBtn?: string;
  disconnectBtn?: string;
  connectedBadge?: string;
  disconnectSuccess?: string;
  disconnectFailed?: string;
  idleLockTitle?: string;
  idleLockDesc?: string;
  unlockSessionBtn?: string;
}
