import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import { Network, Copy, Terminal } from "lucide-react";
import type { OltDevice } from "./types";

interface HardwareDevicesTableProps {
  oltDevices: OltDevice[];
  testingOltId: string | null;
  onTestPing: (olt: OltDevice) => void;
  onCopy: (text: string, label: string) => void;
}

export function HardwareDevicesTable({
  oltDevices,
  testingOltId,
  onTestPing,
  onCopy,
}: HardwareDevicesTableProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
      <div className="py-3 px-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
          Registered OLT Nodes ({oltDevices.length})
        </span>
        <span className="text-[11px] font-mono text-muted-foreground">Engine: ftth-poller (Go 5010)</span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6">
                Device Code &amp; Name
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Vendor &amp; Model
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Management IP
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                PON Ports
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Optical Rx Power
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {oltDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Network className="h-6 w-6 text-muted-foreground/40" />
                    <span>Belum ada perangkat OLT/CO yang terdaftar di jaringan tenant ini.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              oltDevices.map((olt) => (
                <ContextMenu key={olt.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                      <TableCell className="pl-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-foreground block">{olt.code}</span>
                            <span className="text-[11px] text-muted-foreground">{olt.name}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-foreground font-medium">{olt.vendorModel}</TableCell>

                      <TableCell className="py-3.5 font-mono text-foreground">{olt.ipAddress}</TableCell>

                      <TableCell className="py-3.5 font-mono">
                        <span className="font-semibold text-foreground">{olt.ponPortsUsed}</span>
                        <span className="text-muted-foreground">/{olt.ponPortsTotal} ports</span>
                      </TableCell>

                      <TableCell className="py-3.5 font-mono text-primary font-medium">
                        {olt.meanPowerDbm}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          <span>{olt.status}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5 pr-6 text-right">
                        <ActionTooltip label={`Test SNMP & SSH reachability for ${olt.code}`} shortcut="T">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={testingOltId === olt.id}
                            onClick={() => onTestPing(olt)}
                            className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1.5 px-2.5 font-mono cursor-pointer"
                          >
                            <Terminal className="h-3 w-3 text-muted-foreground" />
                            <span>{testingOltId === olt.id ? "Pinging..." : "Test Ping"}</span>
                          </Button>
                        </ActionTooltip>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
                    <ContextMenuItem
                      onClick={() => onTestPing(olt)}
                      className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
                    >
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span>Test SNMP Reachability</span>
                      <ContextMenuShortcut>T</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuSeparator className="bg-border/40 my-1" />

                    <ContextMenuItem
                      onClick={() => onCopy(olt.ipAddress, "Management IP")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Management IP ({olt.ipAddress})</span>
                      <ContextMenuShortcut>C</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => onCopy(olt.code, "Device Code")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Device Code ({olt.code})</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
