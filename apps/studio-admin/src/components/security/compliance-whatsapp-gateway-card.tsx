import { useState } from "react";
import { MessageSquare, Eye, EyeOff, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Switch,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ActionTooltip,
} from "@k2net/ui";

interface ComplianceWhatsappGatewayCardProps {
  waEnabled: boolean;
  setWaEnabled: (val: boolean) => void;
  waUrl: string;
  setWaUrl: (val: string) => void;
  waToken: string;
  setWaToken: (val: string) => void;
  isChanged: boolean;
  isUpdating: boolean;
  onSave: () => void;
}

export function ComplianceWhatsappGatewayCard({
  waEnabled,
  setWaEnabled,
  waUrl,
  setWaUrl,
  waToken,
  setWaToken,
  isChanged,
  isUpdating,
  onSave,
}: ComplianceWhatsappGatewayCardProps) {
  const [showToken, setShowToken] = useState<boolean>(false);

  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> WhatsApp API Gateway Config
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Integrate external messaging APIs (e.g. Fonnte, RuangWA) to broadcast alarms and verify OTPs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {/* WA Enabled switch */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/20">
          <div className="space-y-0.5">
            <Label className="text-foreground text-xs font-semibold">Enable WhatsApp Notifications</Label>
            <p className="text-[10px] text-muted-foreground font-normal">
              Switch to active or developer mock simulation mode.
            </p>
          </div>
          <Switch
            checked={waEnabled}
            onCheckedChange={setWaEnabled}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* API Endpoints and token inputs */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="wa_api_url" className="text-muted-foreground text-xs">
              Gateway API URL Endpoint
            </Label>
            <Input
              id="wa_api_url"
              value={waUrl}
              disabled={!waEnabled}
              onChange={(e) => setWaUrl(e.target.value)}
              placeholder="https://api.fonnte.com/send"
              className="bg-muted/60 border-border text-foreground text-xs h-9 disabled:opacity-40"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="wa_secret_token" className="text-muted-foreground text-xs">
              Authorization Secret Token
            </Label>
            <div className="relative">
              <Input
                id="wa_secret_token"
                type={showToken ? "text" : "password"}
                value={waToken}
                disabled={!waEnabled}
                onChange={(e) => setWaToken(e.target.value)}
                placeholder="Enter API token secret..."
                className="bg-muted/60 border-border text-foreground text-xs h-9 pr-10 disabled:opacity-40"
              />
              <button
                type="button"
                disabled={!waEnabled}
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Precaution banner */}
        {!waEnabled && (
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-normal">
              <strong>Developer Sandbox Fallback:</strong> WhatsApp API gateway is disabled. All OTP
              authentication and service messages will be routed straight to the backend debug console/logs.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
        <ActionTooltip
          label={isChanged ? "Simpan Perubahan Pengaturan Compliance" : "Tidak Ada Perubahan"}
          shortcut="Ctrl+S"
        >
          <Button
            onClick={onSave}
            disabled={isUpdating || !isChanged}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
          >
            {isUpdating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            Apply Configuration Settings
          </Button>
        </ActionTooltip>
      </CardFooter>
    </Card>
  );
}
