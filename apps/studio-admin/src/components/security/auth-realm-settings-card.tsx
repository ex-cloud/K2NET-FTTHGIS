import React from "react";
import { Lock, RefreshCw } from "lucide-react";
import {
  Button,
  Label,
  Switch,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
  ActionTooltip,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export function AuthRealmSettingsCard({
  regAllowed,
  setRegAllowed,
  emailVerify,
  setEmailVerify,
  resetAllowed,
  setResetAllowed,
  handleSaveRealmConfig,
  isUpdatingRealmConfig,
  isConfigChanged,
}: {
  regAllowed: boolean;
  setRegAllowed: (v: boolean) => void;
  emailVerify: boolean;
  setEmailVerify: (v: boolean) => void;
  resetAllowed: boolean;
  setResetAllowed: (v: boolean) => void;
  handleSaveRealmConfig: () => void;
  isUpdatingRealmConfig: boolean;
  isConfigChanged: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> {t("security.realm_security_title")}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          {t("security.realm_security_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-foreground text-sm font-medium">{t("security.self_registration_title")}</Label>
            <p className="text-xs text-muted-foreground">{t("security.self_registration_desc")}</p>
          </div>
          <Switch
            checked={regAllowed}
            onCheckedChange={setRegAllowed}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <Separator className="bg-muted/60" />

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-foreground text-sm font-medium">{t("security.email_verification_title")}</Label>
            <p className="text-xs text-muted-foreground">{t("security.email_verification_desc")}</p>
          </div>
          <Switch
            checked={emailVerify}
            onCheckedChange={setEmailVerify}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <Separator className="bg-muted/60" />

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-foreground text-sm font-medium">{t("security.password_reset_title")}</Label>
            <p className="text-xs text-muted-foreground">{t("security.password_reset_desc")}</p>
          </div>
          <Switch
            checked={resetAllowed}
            onCheckedChange={setResetAllowed}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t border-border pt-4 flex justify-end">
        <ActionTooltip label={isConfigChanged ? t("security.save_changes") : t("security.no_matrix_changes")} shortcut="Ctrl+S">
          <Button
            onClick={handleSaveRealmConfig}
            disabled={isUpdatingRealmConfig || !isConfigChanged}
            variant="default"
            size="sm"
          >
            {isUpdatingRealmConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null} {t("common.save")}
          </Button>
        </ActionTooltip>
      </CardFooter>
    </Card>
  );
}
