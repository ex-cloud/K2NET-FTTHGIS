import { Fingerprint, Globe } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ActionTooltip,
} from "@k2net/ui";
import type { SsoProvider } from "@/hooks/useSecuritySettings";

export function AuthSsoProvidersCard({
  ssoProviders,
  selectedProvider,
  setSelectedProvider,
  clientIdInput,
  setClientIdInput,
  clientSecretInput,
  setClientSecretInput,
  handleSaveSso,
  isUpdatingSsoProvider,
}: {
  ssoProviders: SsoProvider[];
  selectedProvider: string | null;
  setSelectedProvider: (v: string | null) => void;
  clientIdInput: string;
  setClientIdInput: (v: string) => void;
  clientSecretInput: string;
  setClientSecretInput: (v: string) => void;
  handleSaveSso: (providerId: string) => void;
  isUpdatingSsoProvider: boolean;
}) {
  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-primary" /> Identity Providers (SSO)
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Activate Google, Microsoft, GitHub, or LinkedIn single sign-on buttons.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid grid-cols-2 gap-4">
          {["google", "microsoft", "github", "linkedin-openid"].map((provider) => {
            const configured = ssoProviders.find(p => p.alias === provider);
            return (
              <button
                key={provider}
                onClick={() => {
                  setSelectedProvider(provider);
                  setClientIdInput(configured?.clientId || "");
                  setClientSecretInput("");
                }}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                  selectedProvider === provider
                    ? "border-primary bg-primary/10 text-primary"
                    : configured?.enabled
                    ? "border-border bg-card/30 text-foreground hover:border-border"
                    : "border-border/50 bg-background/20 text-muted-foreground hover:border-border"
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs capitalize font-medium">{provider.replace("-openid", "")}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                  configured?.enabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/60"
                }`}>
                  {configured?.enabled ? "Active" : "Not Configured"}
                </span>
              </button>
            );
          })}
        </div>

        {selectedProvider && (
          <div className="p-4 rounded-xl border border-border bg-background/60 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold capitalize text-primary">Configure {selectedProvider.replace("-openid", "")} SSO</h4>
              <button onClick={() => setSelectedProvider(null)} className="text-[10px] text-muted-foreground hover:text-muted-foreground">Cancel</button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="sso_client_id" className="text-muted-foreground text-[10px]">Client ID</Label>
                <Input
                  id="sso_client_id"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="OAuth Client ID"
                  className="bg-muted/60 border-border text-foreground text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sso_client_secret" className="text-muted-foreground text-[10px]">Client Secret</Label>
                <Input
                  id="sso_client_secret"
                  type="password"
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder="OAuth Client Secret"
                  className="bg-muted/60 border-border text-foreground text-xs h-8"
                />
              </div>
              <ActionTooltip label={`Aktifkan Integrasi SSO ${selectedProvider}`} shortcut="Enter">
                <Button
                  onClick={() => handleSaveSso(selectedProvider)}
                  disabled={isUpdatingSsoProvider}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 font-medium transition-all"
                >
                  {isUpdatingSsoProvider ? "Connecting..." : "Enable Provider"}
                </Button>
              </ActionTooltip>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
