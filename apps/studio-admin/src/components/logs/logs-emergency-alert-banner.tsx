import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShieldAlert, Eye, X, Volume2, VolumeX, Bell } from "lucide-react";
import { Button, cn } from "@k2net/ui";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";

export interface LogsEmergencyAlertBannerProps {
  incident: AuditStreamEntry | null;
  onInvestigate: (incident: AuditStreamEntry) => void;
  onDismiss: (incidentId: string) => void;
}

function playSecurityChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // High alert tone followed by resolution tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.15); // D5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio Context might be restricted until user gesture
  }
}

export function LogsEmergencyAlertBanner({
  incident,
  onInvestigate,
  onDismiss,
}: LogsEmergencyAlertBannerProps) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("k2net_soc_alert_sound") === "true";
  });

  const [desktopNotifEnabled, setDesktopNotifEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    return Notification.permission === "granted" && localStorage.getItem("k2net_soc_alert_notif") === "true";
  });

  const lastSoundPlayedIncidentId = useRef<string | null>(null);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("k2net_soc_alert_sound", String(next));
      if (next) playSecurityChime();
      return next;
    });
  }, []);

  const toggleDesktopNotif = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setDesktopNotifEnabled(true);
        localStorage.setItem("k2net_soc_alert_notif", "true");
      }
    } else {
      setDesktopNotifEnabled((prev) => {
        const next = !prev;
        localStorage.setItem("k2net_soc_alert_notif", String(next));
        return next;
      });
    }
  }, []);

  // Trigger alert effects on new incident
  useEffect(() => {
    if (!incident) return;

    if (soundEnabled && lastSoundPlayedIncidentId.current !== incident.id) {
      lastSoundPlayedIncidentId.current = incident.id;
      playSecurityChime();
    }

    if (desktopNotifEnabled && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("🚨 CRITICAL Security Incident", {
          body: `${incident.action} by ${incident.actor || "Unknown"} on ${incident.tenantSlug || "system"}`,
          icon: "/favicon.ico",
        });
      } catch {
        // Notification error ignored
      }
    }
  }, [incident, soundEnabled, desktopNotifEnabled]);

  if (!incident) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-destructive/10 border-b border-destructive/30 text-foreground text-xs font-mono shrink-0 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-destructive animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive animate-ping opacity-75" />
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider">
            CRITICAL INCIDENT
          </span>
          <span className="font-semibold text-foreground truncate">
            {incident.action}
          </span>
          <span className="text-muted-foreground text-[11px] truncate">
            by <strong className="text-foreground">{incident.actor || "System"}</strong> on tenant <strong className="text-foreground">{incident.tenantSlug || "system"}</strong>
          </span>
          <span className="text-[10px] text-muted-foreground/80 font-mono">
            ({new Date(incident.timestamp).toLocaleTimeString()})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        <button
          type="button"
          onClick={toggleSound}
          title={soundEnabled ? "Mute SOC alert chime" : "Enable SOC alert chime"}
          className={cn(
            "p-1.5 rounded text-xs transition-colors cursor-pointer",
            soundEnabled
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-muted"
          )}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={toggleDesktopNotif}
          title={desktopNotifEnabled ? "Disable desktop push alerts" : "Enable desktop push alerts"}
          className={cn(
            "p-1.5 rounded text-xs transition-colors cursor-pointer",
            desktopNotifEnabled
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-muted"
          )}
        >
          <Bell className="w-3.5 h-3.5" />
        </button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => onInvestigate(incident)}
          className="h-6 px-2.5 text-[11px] font-medium gap-1.5 shadow-sm hover:opacity-90"
        >
          <Eye className="w-3 h-3" />
          <span>Investigate</span>
        </Button>

        <button
          type="button"
          onClick={() => onDismiss(incident.id)}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Acknowledge & Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
