import * as React from "react";
import { User, Shield, Monitor, Link2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";
import { PageLayout } from "../page-layout";
import { PageHero } from "../layout/page-hero";
import { ProfileContactCard } from "./profile-contact-card";
import { PasswordSecurityCard } from "./password-security-card";
import { MfaPasskeyCard } from "./mfa-passkey-card";
import { ActiveSessionsCard } from "./active-sessions-card";
import { SocialIdentitiesCard } from "./social-identities-card";
import {
  PlaneType,
  UserProfileData,
  PersonalSecuritySummaryData,
  PasswordPolicyData,
  DeviceSessionData,
  AccountLabels,
} from "./account-types";

export interface AccountPreferencesShellProps {
  plane?: PlaneType;
  user?: UserProfileData;
  summary?: PersonalSecuritySummaryData;
  policy?: PasswordPolicyData;
  devices?: DeviceSessionData[];
  labels?: AccountLabels;
  onSaveProfile?: (data: { name: string; phone: string }) => Promise<void> | void;
  onChangePassword?: (data: { currentPassword: string; newPassword: string }) => Promise<void> | void;
  onSetupTotp?: () => void;
  onSetupPasskey?: () => void;
  onRevokeDevice?: (deviceId: number) => Promise<void> | void;
  onRevokeAllSessions?: () => Promise<void> | void;
  onConnectProvider?: (provider: "google" | "github") => Promise<void> | void;
  onDisconnectProvider?: (provider: "google" | "github") => Promise<void> | void;
  isLoading?: boolean;
}

export function AccountPreferencesShell({
  plane = "TENANT",
  user,
  summary,
  policy,
  devices = [],
  labels,
  onSaveProfile,
  onChangePassword,
  onSetupTotp,
  onSetupPasskey,
  onRevokeDevice,
  onRevokeAllSessions,
  onConnectProvider,
  onDisconnectProvider,
  isLoading = false,
}: AccountPreferencesShellProps) {
  const [activeTab, setActiveTab] = React.useState("general");

  const title = labels?.title || "Account Preferences";
  const subtitle =
    labels?.subtitle ||
    "Manage personal profile details, authentication security, multi-factor authentication, active sessions, and connected identities.";

  return (
    <PageLayout className="space-y-6">
      <PageHero
        eyebrow={plane === "SYSTEM" ? "PLATFORM OPERATOR" : "WORKSPACE MEMBER"}
        title={title}
        subtitle={subtitle}
        icon={User}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 p-1 border border-border/60">
          <TabsTrigger value="general" className="gap-2 text-xs">
            <User className="size-3.5" />
            <span>{labels?.tabGeneral || "General Profile"}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs">
            <Shield className="size-3.5" />
            <span>{labels?.tabSecurity || "Security & 2FA"}</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2 text-xs">
            <Monitor className="size-3.5" />
            <span>{labels?.tabSessions || "Sessions & Devices"}</span>
          </TabsTrigger>
          <TabsTrigger value="identities" className="gap-2 text-xs">
            <Link2 className="size-3.5" />
            <span>{labels?.tabIdentities || "Social Identities"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <ProfileContactCard
            user={user}
            labels={labels}
            onSaveProfile={onSaveProfile}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <MfaPasskeyCard
            plane={plane}
            summary={summary}
            labels={labels}
            onSetupTotp={onSetupTotp}
            onSetupPasskey={onSetupPasskey}
            isLoading={isLoading}
          />
          <PasswordSecurityCard
            policy={policy}
            labels={labels}
            onChangePassword={onChangePassword}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <ActiveSessionsCard
            devices={devices}
            labels={labels}
            onRevokeDevice={onRevokeDevice}
            onRevokeAllSessions={onRevokeAllSessions}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="identities" className="space-y-4">
          <SocialIdentitiesCard
            linkedProviders={summary?.linkedProviders}
            labels={labels}
            onConnectProvider={onConnectProvider}
            onDisconnectProvider={onDisconnectProvider}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
