import { Badge, Button, Card, Input, ActionTooltip } from "@k2net/ui";
import { Key, Copy, Eye, EyeOff, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import type { ApiKeyOverview } from "./types";

interface ApiKeyCardProps {
  apiKeyOverview: ApiKeyOverview | null;
  showKey: boolean;
  setShowKey: (show: boolean) => void;
  isRegenerating: boolean;
  apiRateLimitMax: number;
  onRegenerateKey: () => void;
  onCopy: (text: string, label: string) => void;
}

export function ApiKeyCard({
  apiKeyOverview,
  showKey,
  setShowKey,
  isRegenerating,
  apiRateLimitMax,
  onRegenerateKey,
  onCopy,
}: ApiKeyCardProps) {
  const { canAccess } = usePermissions();
  const canManage = canAccess("system.organizations.webhooks.manage");

  const displayKey = apiKeyOverview?.maskedApiKey || "k2_live_••••••••••••••••••••";
  const rateLimit = apiKeyOverview?.rateLimitPerMinute || apiRateLimitMax || 5000;

  return (
    <Card className="p-5 space-y-4 bg-card border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Key className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-foreground">Kong Consumer API Key</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                {apiKeyOverview?.hasActiveKey !== false ? "ACTIVE" : "INACTIVE"}
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground text-[9px] font-mono gap-1">
                <ShieldCheck className="h-2.5 w-2.5 text-primary" />
                SHA-256 HASHED
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground text-[9px] font-mono">
                KONG SYNCED
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Kunci otentikasi REST API tenant untuk integrasi billing MikroTik, OSS, dan bot NOC.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerateKey}
              disabled={isRegenerating}
              className="h-7 px-2.5 text-xs border-border gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RefreshCw className={cn("h-3 w-3", isRegenerating && "animate-spin")} />
              <span>{isRegenerating ? "Menerbitkan..." : "Regenerate Key"}</span>
            </Button>
          ) : (
            <ActionTooltip label="Akses Read-Only: Memerlukan izin system.organizations.webhooks.manage">
              <span className="inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-7 px-2.5 text-xs border-border gap-1.5 text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  <ShieldAlert className="h-3 w-3" />
                  <span>Read-Only</span>
                </Button>
              </span>
            </ActionTooltip>
          )}
        </div>
      </div>

      {/* Key Input Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              value={displayKey}
              readOnly
              className="h-9 text-xs font-mono bg-background border-border text-foreground pr-10 select-all"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => onCopy(displayKey, "Kong API Key Masked")}
            className="h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Salin Key</span>
          </Button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span className="font-mono">
            Header: <code>X-API-Key: {apiKeyOverview?.apiKeyPrefix || "k2_live_"}...</code>
          </span>
          <span className="font-mono">
            Rate Limit: <strong className="text-foreground">{rateLimit.toLocaleString()} req/min</strong>
          </span>
        </div>
      </div>
    </Card>
  );
}
