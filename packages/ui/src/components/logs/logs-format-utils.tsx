import * as React from "react";
import {
  Globe,
  Shield,
  Send,
  Database,
  Server,
  Cpu,
  Sparkles,
  FolderKanban,
  MapPin,
  Radio,
  Wifi,
  CreditCard,
  HardDrive,
  FileOutput,
  CalendarClock,
  Map,
} from "lucide-react";

interface SourceIconMatcher {
  match: (src: string) => boolean;
  IconComponent: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const SOURCE_ICON_MATCHERS: SourceIconMatcher[] = [
  { match: (s) => s.includes("ai") || s.includes("rag"), IconComponent: Sparkles },
  { match: (s) => s.includes("task") || s.includes("obsidian"), IconComponent: FolderKanban },
  { match: (s) => s.includes("martin") || s.includes("tile"), IconComponent: MapPin },
  { match: (s) => s.includes("poller"), IconComponent: Radio },
  { match: (s) => s.includes("olt"), IconComponent: Wifi },
  { match: (s) => s.includes("map"), IconComponent: Map },
  { match: (s) => s.includes("payment"), IconComponent: CreditCard },
  { match: (s) => s.includes("storage") || s.includes("minio"), IconComponent: HardDrive },
  { match: (s) => s.includes("export"), IconComponent: FileOutput },
  { match: (s) => s.includes("scheduler"), IconComponent: CalendarClock },
  { match: (s) => s.includes("kong") || s.includes("edge") || s.includes("traefik"), IconComponent: Globe },
  { match: (s) => s.includes("keycloak") || s.includes("auth"), IconComponent: Shield },
  { match: (s) => s.includes("notification") || s.includes("whatsapp") || s.includes("sms"), IconComponent: Send },
  { match: (s) => s.includes("db") || s.includes("postgres") || s.includes("redis"), IconComponent: Database },
  { match: (s) => s.includes("backend"), IconComponent: Server },
];

export function getLogsSourceIcon(source: string, className?: string) {
  const src = (source || "").toLowerCase();
  const matched = SOURCE_ICON_MATCHERS.find((m) => m.match(src));
  const IconComp = matched ? matched.IconComponent : Cpu;
  return (
    <IconComp
      className={className || "w-3.5 h-3.5 text-muted-foreground/80 shrink-0"}
      strokeWidth={1.5}
    />
  );
}

export function getDetailedTime(timestampStr: string) {
  const d = new Date(timestampStr);
  if (isNaN(d.getTime())) {
    return { utc: "—", local: "—", tzName: "Local", relative: "—", timestamp: "—" };
  }

  const utcFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  const utcStr = utcFormatter.format(d).replace(",", "");

  const localFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const localStr = localFormatter.format(d).replace(",", "");

  let tzName = "Local";
  try {
    tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  } catch {
    // ignore
  }

  let relativeStr = "";
  const diffMs = Date.now() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 5) {
    relativeStr = "just now";
  } else if (diffSecs < 60) {
    relativeStr = `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    relativeStr = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    relativeStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    relativeStr = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  return {
    utc: utcStr,
    local: localStr,
    tzName,
    relative: relativeStr,
    timestamp: String(d.getTime()),
  };
}
