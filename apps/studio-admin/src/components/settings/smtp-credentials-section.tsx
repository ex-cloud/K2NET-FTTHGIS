import { useState } from "react";
import { Input } from "@k2net/ui";
import { Eye, EyeOff } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { SettingsFormRow } from "./settings-form-row";
import { useTranslation } from "@k2net/i18n";

export interface SmtpCredentialsSectionProps {
  smtpHost: string;
  onSmtpHostChange: (val: string) => void;
  smtpPort: string;
  onSmtpPortChange: (val: string) => void;
  smtpUsername: string;
  onSmtpUsernameChange: (val: string) => void;
  smtpPassword: string;
  onSmtpPasswordChange: (val: string) => void;
  smtpFrom: string;
  onSmtpFromChange: (val: string) => void;
}

export function SmtpCredentialsSection({
  smtpHost,
  onSmtpHostChange,
  smtpPort,
  onSmtpPortChange,
  smtpUsername,
  onSmtpUsernameChange,
  smtpPassword,
  onSmtpPasswordChange,
  smtpFrom,
  onSmtpFromChange,
}: SmtpCredentialsSectionProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SettingsSection
      title={t("settings.smtp.credentials_title")}
      description={t("settings.smtp.credentials_desc")}
    >
      <SettingsFormRow
        label={t("settings.smtp.hostname_label")}
        description={t("settings.smtp.hostname_desc")}
      >
        <Input
          type="text"
          value={smtpHost}
          onChange={(e) => onSmtpHostChange(e.target.value)}
          placeholder="smtp-relay.brevo.com"
          className="bg-background/80 border-border text-foreground text-xs w-full max-w-sm font-mono focus:border-primary"
        />
      </SettingsFormRow>

      <SettingsFormRow
        label={t("settings.smtp.port_label")}
        description={t("settings.smtp.port_desc")}
      >
        <Input
          type="number"
          value={smtpPort}
          onChange={(e) => onSmtpPortChange(e.target.value)}
          placeholder="587"
          className="bg-background/80 border-border text-foreground text-xs w-28 text-right font-mono focus:border-primary"
        />
      </SettingsFormRow>

      <SettingsFormRow
        label={t("settings.smtp.username_label")}
        description={t("settings.smtp.username_desc")}
      >
        <Input
          type="text"
          value={smtpUsername}
          onChange={(e) => onSmtpUsernameChange(e.target.value)}
          placeholder="username@smtp-provider.com"
          className="bg-background/80 border-border text-foreground text-xs w-full max-w-sm font-mono focus:border-primary"
        />
      </SettingsFormRow>

      <SettingsFormRow
        label={t("settings.smtp.password_label")}
        description={t("settings.smtp.password_desc")}
      >
        <div className="relative w-full max-w-sm">
          <Input
            type={showPassword ? "text" : "password"}
            value={smtpPassword}
            onChange={(e) => onSmtpPasswordChange(e.target.value)}
            placeholder="••••••••••••••••"
            className="bg-background/80 border-border text-foreground text-xs pr-10 font-mono focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </SettingsFormRow>

      <SettingsFormRow
        label={t("settings.smtp.sender_email_label")}
        description={t("settings.smtp.sender_email_desc")}
        divider={false}
      >
        <Input
          type="email"
          value={smtpFrom}
          onChange={(e) => onSmtpFromChange(e.target.value)}
          placeholder="noreply@kdua.net"
          className="bg-background/80 border-border text-foreground text-xs w-full max-w-sm font-mono focus:border-primary"
        />
      </SettingsFormRow>
    </SettingsSection>
  );
}
