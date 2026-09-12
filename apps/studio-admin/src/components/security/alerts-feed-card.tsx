import { Radio, Sparkles, Globe, ShieldAlert, ShieldAlert as ShieldIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  UniversalContextMenu,
  type ContextMenuGroupConfig,
} from "@k2net/ui";
import { toast } from "sonner";
import type { SecurityEvent } from "@/hooks/useSecuritySettings";

interface AlertsFeedCardProps {
  alerts: SecurityEvent[];
  loadingAlerts: boolean;
  selectedAlert: SecurityEvent | null;
  onSelectAlert: (alert: SecurityEvent) => void;
  onBlockIpShortcut: (ip: string, reason: string) => void;
}

const severityColor = (severity: string) => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return "border-rose-500/30 bg-rose-500/10 text-rose-400";
    case "WARNING":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    default:
      return "border-border bg-card/30 text-muted-foreground";
  }
};

export function AlertsFeedCard({
  alerts,
  loadingAlerts,
  selectedAlert,
  onSelectAlert,
  onBlockIpShortcut,
}: AlertsFeedCardProps) {
  const getAlertContextMenuGroups = (alertItem: SecurityEvent): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Tanya AI Analisis Ancaman",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisis insiden keamanan: ${alertItem.eventType} (${alertItem.severity}) oleh pengguna "${alertItem.username}" dari IP ${alertItem.ipAddress} (${alertItem.location || "Unknown"}). Detail: ${alertItem.details}. Berikan rekomendasi mitigasi dan langkah pembatasan akses.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Salin IP Address",
          icon: Globe,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(alertItem.ipAddress || "");
            toast.success(`IP ${alertItem.ipAddress} disalin!`);
          },
        },
        {
          label: "Salin Event Type",
          icon: ShieldAlert,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(alertItem.eventType || "");
            toast.success(`Event ${alertItem.eventType} disalin!`);
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Blokir IP di Firewall",
          icon: ShieldIcon,
          shortcut: "Alt+B",
          onClick: () => {
            onBlockIpShortcut(alertItem.ipAddress, `Blokir otomatis respon terhadap anomali ${alertItem.eventType}`);
            toast.info(`IP ${alertItem.ipAddress} dimasukkan ke form blokir firewall.`);
          },
        },
      ],
    },
  ];

  return (
    <Card glowingEffect className="bg-card/30 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" /> Threat Live Feed
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Real-time security incidents log on master portal.
          </CardDescription>
        </div>
        <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono">
          Live
        </span>
      </CardHeader>
      <CardContent className="pt-5 p-3">
        {loadingAlerts ? (
          <div className="space-y-3 p-3">
            <Skeleton className="h-16 w-full bg-muted" />
            <Skeleton className="h-16 w-full bg-muted" />
            <Skeleton className="h-16 w-full bg-muted" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border rounded-xl bg-background/20 text-muted-foreground text-xs">
            No security alerts detected. System secure.
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3 pr-1">
            {alerts.map((alert) => (
              <UniversalContextMenu key={alert.id} groups={getAlertContextMenuGroups(alert)}>
                <div
                  onClick={() => onSelectAlert(alert)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                    selectedAlert?.id === alert.id
                      ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30"
                      : "border-border bg-background/45 hover:border-border hover:bg-muted/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${severityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.eventType.replace("_", " ")}
                      </span>
                      <h4 className="text-xs font-semibold text-foreground mt-1">{alert.username}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {alert.ipAddress} ({alert.location || "Unknown"})
                      </p>
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {new Date(alert.createdAt).toLocaleTimeString("id-ID", { hour12: false })}
                    </span>
                  </div>

                  {selectedAlert?.id === alert.id && (
                    <div className="mt-3 pt-3 border-t border-border/60 text-[10px] text-muted-foreground leading-relaxed font-sans space-y-2">
                      <p className="text-muted-foreground bg-background/80 p-2 rounded-lg border border-border/40">
                        {alert.details}
                      </p>
                      {alert.os && (
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-muted-foreground pt-1">
                          <span>OS: {alert.os}</span>
                          <span>Browser: {alert.browser}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </UniversalContextMenu>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
