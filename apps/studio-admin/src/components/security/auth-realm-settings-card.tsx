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
  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Global Realm Security
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Configure basic registration permissions and credential checks on the Keycloak master domain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-foreground text-sm font-medium">Self-Registration</Label>
            <p className="text-xs text-muted-foreground">Allow users to create accounts without admin invitation.</p>
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
            <Label className="text-foreground text-sm font-medium">Email Verification</Label>
            <p className="text-xs text-muted-foreground">Require email verification before granting access.</p>
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
            <Label className="text-foreground text-sm font-medium">Self Reset Password</Label>
            <p className="text-xs text-muted-foreground">Provide a &quot;Forgot Password&quot; link on the login page.</p>
          </div>
          <Switch
            checked={resetAllowed}
            onCheckedChange={setResetAllowed}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t border-border pt-4 flex justify-end">
        <ActionTooltip label={isConfigChanged ? "Simpan Perubahan Keamanan Realm" : "Tidak Ada Perubahan"} shortcut="Ctrl+S">
          <Button
            onClick={handleSaveRealmConfig}
            disabled={isUpdatingRealmConfig || !isConfigChanged}
            variant="default"
            size="sm"
          >
            {isUpdatingRealmConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Save Security Policies
          </Button>
        </ActionTooltip>
      </CardFooter>
    </Card>
  );
}
