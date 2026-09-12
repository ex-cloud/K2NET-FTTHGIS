import { useState } from "react";
import { Input } from "@k2net/ui";
import { Eye, EyeOff } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { SettingsFormRow } from "./settings-form-row";

interface SmtpCredentialsSectionProps {
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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SettingsSection
      title="SMTP Relay Credentials & Host"
      description="Kredensial otentikasi server mail relay (Brevo / SendGrid / Custom SMTP Server)."
    >
      <SettingsFormRow
        label="SMTP Hostname"
        description="Alamat host server SMTP (misal: smtp-relay.brevo.com atau smtp.gmail.com)."
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
        label="SMTP Server Port"
        description="Port TLS/STARTTLS (587 atau 2525) atau SSL (465)."
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
        label="SMTP Username"
        description="Username atau ID akun otentikasi relay email."
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
        label="SMTP Password / API Key"
        description="Kata sandi otentikasi atau kunci API relay email."
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </SettingsFormRow>

      <SettingsFormRow
        label="Default Sender Email ('From' Address)"
        description="Alamat email pengirim default yang tercantum pada penerima email."
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
