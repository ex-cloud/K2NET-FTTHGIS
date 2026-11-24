import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Laptop,
  Smartphone,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  LogOut,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { DataTable } from "../data-table/data-table";
import { DeviceSessionData, AccountLabels } from "./account-types";

export interface ActiveSessionsCardProps {
  devices?: DeviceSessionData[];
  labels?: AccountLabels;
  onRevokeDevice?: (deviceId: number) => Promise<void> | void;
  onRevokeAllSessions?: () => Promise<void> | void;
  isLoading?: boolean;
}

function formatSessionTimestamp(raw?: string): string {
  if (!raw) return "—";
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return raw.split(".")[0]?.replace("T", " ") || raw;
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderDeviceIcon(os: string) {
  const lower = (os || "").toLowerCase();
  if (lower.includes("ios") || lower.includes("android") || lower.includes("mobile")) {
    return <Smartphone className="size-4 text-muted-foreground shrink-0" />;
  }
  if (lower.includes("mac") || lower.includes("windows") || lower.includes("linux")) {
    return <Laptop className="size-4 text-muted-foreground shrink-0" />;
  }
  return <Monitor className="size-4 text-muted-foreground shrink-0" />;
}

export function ActiveSessionsCard({
  devices = [],
  labels,
  onRevokeDevice,
  onRevokeAllSessions,
  isLoading = false,
}: ActiveSessionsCardProps) {
  const [revokingId, setRevokingId] = React.useState<number | null>(null);
  const [isRevokingAll, setIsRevokingAll] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const handleRevokeSingle = React.useCallback(
    async (deviceId: number) => {
      if (!onRevokeDevice) return;
      try {
        setRevokingId(deviceId);
        await onRevokeDevice(deviceId);
      } finally {
        setRevokingId(null);
      }
    },
    [onRevokeDevice]
  );

  const handleConfirmRevokeAll = React.useCallback(async () => {
    if (!onRevokeAllSessions) return;
    try {
      setIsRevokingAll(true);
      await onRevokeAllSessions();
      setIsConfirmOpen(false);
    } finally {
      setIsRevokingAll(false);
    }
  }, [onRevokeAllSessions]);

  const normalizedDevices = React.useMemo<DeviceSessionData[]>(() => {
    const hasExplicitCurrent = devices.some((d) => Boolean(d.isCurrent));
    return devices.map((d, idx) => ({
      ...d,
      isCurrent: hasExplicitCurrent ? Boolean(d.isCurrent) : idx === 0,
    }));
  }, [devices]);

  const columns = React.useMemo<ColumnDef<DeviceSessionData, unknown>[]>(
    () => [
      {
        accessorKey: "os",
        header: () => <span>{labels?.sessionsColDeviceOs || "Device & OS"}</span>,
        cell: ({ row }) => {
          const os = row.original.os || "Unknown OS";
          return (
            <div className="flex items-center gap-2 font-medium text-foreground">
              {renderDeviceIcon(os)}
              <span className="truncate max-w-[160px]">{os}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "browser",
        header: () => <span>{labels?.sessionsColBrowser || "Browser"}</span>,
        cell: ({ row }) => (
          <span className="text-muted-foreground truncate max-w-[150px] block">
            {row.original.browser || "Unknown Browser"}
          </span>
        ),
      },
      {
        accessorKey: "ipAddress",
        header: () => <span>{labels?.sessionsColIp || "IP Address"}</span>,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.ipAddress || "—"}
          </span>
        ),
      },
      {
        accessorKey: "lastUsedAt",
        header: () => <span>{labels?.sessionsColLastActive || "Last Active"}</span>,
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {formatSessionTimestamp(row.original.lastUsedAt)}
          </span>
        ),
      },
      {
        id: "status",
        header: () => <span>{labels?.sessionsColStatus || "Status"}</span>,
        cell: ({ row }) => {
          const isCurrent = Boolean(row.original.isCurrent);
          if (isCurrent) {
            return (
              <Badge
                variant="outline"
                className="gap-1 border-foreground/30 bg-foreground/10 text-foreground text-[10px] font-medium"
              >
                <ShieldCheck className="size-3" />
                <span>{labels?.currentDeviceBadge || "Current Session"}</span>
              </Badge>
            );
          }
          if (row.original.verified) {
            return (
              <Badge
                variant="outline"
                className="border-border/80 bg-muted/30 text-[10px] text-muted-foreground font-medium"
              >
                <span>{labels?.trustedBadge || "Trusted"}</span>
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="gap-1 border-border bg-muted/50 text-foreground text-[10px] font-medium"
            >
              <ShieldAlert className="size-3" />
              <span>{labels?.untrustedBadge || "Verification Required"}</span>
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right">
            <span>{labels?.sessionsColAction || "Action"}</span>
          </div>
        ),
        cell: ({ row }) => {
          const isCurrent = Boolean(row.original.isCurrent);
          const isRevokingThis = revokingId === row.original.id;
          if (isCurrent) {
            return <div className="text-right text-[11px] text-muted-foreground/60">—</div>;
          }
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => void handleRevokeSingle(row.original.id)}
                disabled={isLoading || isRevokingThis}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-6 px-2 text-[11px] gap-1"
              >
                {isRevokingThis ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
                <span>{labels?.revokeDeviceBtn || "Revoke"}</span>
              </Button>
            </div>
          );
        },
      },
    ],
    [handleRevokeSingle, isLoading, labels, revokingId]
  );

  return (
    <>
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Monitor className="size-4 text-muted-foreground" />
                {labels?.sessionsTitle || "Active Sessions & Trusted Devices"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {labels?.sessionsDesc ||
                  "Devices and browsers that have authenticated with your account credentials."}
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isLoading || isRevokingAll || normalizedDevices.length <= 1}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
            >
              {isRevokingAll ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <LogOut className="size-3.5" />
              )}
              <span>{labels?.revokeAllSessionsBtn || "Revoke All Other Sessions"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable<DeviceSessionData, unknown>
            columns={columns}
            data={normalizedDevices}
            isLoading={isLoading}
            skeletonRowCount={3}
            density="compact"
            emptyState={{
              title: labels?.noDevicesFound || "No recognized devices registered yet.",
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {labels?.revokeAllConfirmTitle || "Revoke All Other Active Sessions?"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {labels?.revokeAllConfirmDesc ||
                "This will immediately sign out all other browsers and devices connected to your account across all active sessions, while keeping your current browser session active."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isRevokingAll}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {labels?.cancelBtn || "Cancel"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void handleConfirmRevokeAll()}
              disabled={isRevokingAll}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isRevokingAll ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <LogOut className="size-3.5" />
              )}
              <span>
                {labels?.revokeAllConfirmBtn ||
                  labels?.revokeAllSessionsBtn ||
                  "Revoke All Other Sessions"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
