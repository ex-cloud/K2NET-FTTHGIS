import * as React from "react";
import { Laptop, Smartphone, Monitor, ShieldCheck, ShieldAlert, Trash2, LogOut, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { DeviceSessionData, AccountLabels } from "./account-types";

export interface ActiveSessionsCardProps {
  devices?: DeviceSessionData[];
  labels?: AccountLabels;
  onRevokeDevice?: (deviceId: number) => Promise<void> | void;
  onRevokeAllSessions?: () => Promise<void> | void;
  isLoading?: boolean;
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

  const handleRevokeSingle = async (deviceId: number) => {
    if (!onRevokeDevice) return;
    try {
      setRevokingId(deviceId);
      await onRevokeDevice(deviceId);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!onRevokeAllSessions) return;
    try {
      setIsRevokingAll(true);
      await onRevokeAllSessions();
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getDeviceIcon = (os: string) => {
    const lower = os.toLowerCase();
    if (lower.includes("ios") || lower.includes("android") || lower.includes("mobile")) {
      return <Smartphone className="size-4 text-muted-foreground shrink-0" />;
    }
    if (lower.includes("mac") || lower.includes("windows") || lower.includes("linux")) {
      return <Laptop className="size-4 text-muted-foreground shrink-0" />;
    }
    return <Monitor className="size-4 text-muted-foreground shrink-0" />;
  };

  return (
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
            onClick={handleRevokeAll}
            disabled={isLoading || isRevokingAll || devices.length <= 1}
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
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
        {devices.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {labels?.noDevicesFound || "No recognized devices registered yet."}
          </div>
        ) : (
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 text-[11px]">
                  <TableHead className="h-8">Device & OS</TableHead>
                  <TableHead className="h-8">Browser</TableHead>
                  <TableHead className="h-8">IP Address</TableHead>
                  <TableHead className="h-8">Last Active</TableHead>
                  <TableHead className="h-8">Status</TableHead>
                  <TableHead className="h-8 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device, idx) => {
                  const isCurrent = device.isCurrent || idx === 0;
                  const isRevokingThis = revokingId === device.id;

                  return (
                    <TableRow key={device.id || idx} className="text-xs">
                      <TableCell className="py-2 font-medium">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.os || "")}
                          <span className="truncate max-w-[140px]">{device.os || "Unknown OS"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground truncate max-w-[130px]">
                        {device.browser || "Unknown Browser"}
                      </TableCell>
                      <TableCell className="py-2 font-mono text-[11px] text-muted-foreground">
                        {device.ipAddress || "—"}
                      </TableCell>
                      <TableCell className="py-2 text-[11px] text-muted-foreground whitespace-nowrap">
                        {device.lastUsedAt || "Recent"}
                      </TableCell>
                      <TableCell className="py-2">
                        {isCurrent ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium"
                          >
                            <ShieldCheck className="size-3" />
                            <span>{labels?.currentDeviceBadge || "Current Session"}</span>
                          </Badge>
                        ) : device.verified ? (
                          <Badge
                            variant="outline"
                            className="border-border/80 text-[10px] text-muted-foreground font-medium"
                          >
                            <span>{labels?.trustedBadge || "Trusted"}</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium"
                          >
                            <ShieldAlert className="size-3" />
                            <span>{labels?.untrustedBadge || "Verification Required"}</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {!isCurrent && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRevokeSingle(device.id)}
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
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
