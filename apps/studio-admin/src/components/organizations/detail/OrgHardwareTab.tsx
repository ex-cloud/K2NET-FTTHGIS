"use client";

import { useState } from "react";
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
import {
  Network,
  Plus,
  Sliders,
  Copy,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../types";

interface OrgHardwareTabProps {
  organization: EnrichedOrganization;
  onOpenQuotaModal: () => void;
}

interface OltDevice {
  id: string;
  code: string;
  name: string;
  vendorModel: string;
  ipAddress: string;
  popLocation: string;
  ponPortsUsed: number;
  ponPortsTotal: number;
  ontCount: number;
  meanPowerDbm: string;
  status: "UP" | "DEGRADED" | "OFFLINE";
  lastPolled: string;
}

export function OrgHardwareTab({
  organization: org,
  onOpenQuotaModal,
}: OrgHardwareTabProps) {
  const [testingOltId, setTestingOltId] = useState<string | null>(null);

  // Mock list of registered OLTs for this tenant
  const oltDevices: OltDevice[] = [
    {
      id: "olt-1",
      code: `${org.slug.toUpperCase()}-OLT-01`,
      name: `${org.name} Core GPON Node`,
      vendorModel: "Huawei SmartAX MA5800-X7",
      ipAddress: "10.200.10.1:22",
      popLocation: "POP Gandaria Datacenter",
      ponPortsUsed: 14,
      ponPortsTotal: 16,
      ontCount: 1840,
      meanPowerDbm: "-18.2 dBm",
      status: "UP",
      lastPolled: "4s ago",
    },
    {
      id: "olt-2",
      code: `${org.slug.toUpperCase()}-OLT-02`,
      name: `${org.name} Distribution Substation`,
      vendorModel: "ZTE ZXA10 C320",
      ipAddress: "10.200.10.2:22",
      popLocation: "POP Dago Utara",
      ponPortsUsed: 6,
      ponPortsTotal: 8,
      ontCount: 680,
      meanPowerDbm: "-19.6 dBm",
      status: "UP",
      lastPolled: "4s ago",
    },
  ];

  const handleTestPing = (olt: OltDevice) => {
    setTestingOltId(olt.id);
    setTimeout(() => {
      setTestingOltId(null);
      toast.success(`SNMP & SSH test reachability passed for ${olt.code}`, {
        description: `Ping: 12ms | SSH handshake OK | 14 PON ports active`,
      });
    }, 1000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Quota Allocation Summary */}
      <div className="p-3.5 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-foreground">Hardware Quotas & OLT Poller Telemetry</h3>
            <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">
              {org.usedOlts} of {org.maxOlts} Slots Used
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Semua perangkat OLT yang terdaftar dimonitor secara berkala oleh <code className="text-primary font-mono text-[10px]">ftth-poller:5010</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ActionTooltip label="Adjust OLT & ODP Quota Allocations" shortcut="Q">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenQuotaModal}
              className="h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs"
            >
              <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Adjust Quota Limits</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip label="Allocate Additional OLT Hardware Slot">
            <Button
              size="sm"
              onClick={onOpenQuotaModal}
              className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Allocate OLT Slot</span>
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* 2. OLT Hardware Devices Table */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
        <div className="py-3 px-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Registered OLT Nodes ({oltDevices.length})
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Scrape interval: 30 seconds
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6">
                  Device Code
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Hardware Model
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Management IP
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  POP Location
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  PON Ports
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Optical Power
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {oltDevices.map((olt) => (
                <ContextMenu key={olt.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                      {/* Device Code */}
                      <TableCell className="pl-6 py-3.5">
                        <div className="space-y-0.5">
                          <div className="font-bold text-foreground font-mono flex items-center gap-1.5">
                            <Network className="h-3.5 w-3.5 text-primary" />
                            <span>{olt.code}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block">{olt.name}</span>
                        </div>
                      </TableCell>

                      {/* Model */}
                      <TableCell className="py-3.5 font-medium text-foreground">
                        {olt.vendorModel}
                      </TableCell>

                      {/* IP Address */}
                      <TableCell className="py-3.5 font-mono text-[11px] text-muted-foreground">
                        {olt.ipAddress}
                      </TableCell>

                      {/* POP */}
                      <TableCell className="py-3.5 text-muted-foreground">
                        {olt.popLocation}
                      </TableCell>

                      {/* PON Ports */}
                      <TableCell className="py-3.5">
                        <div className="space-y-1">
                          <span className="font-mono text-[11px] text-foreground font-medium">
                            {olt.ponPortsUsed}/{olt.ponPortsTotal} Ports
                          </span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            ({olt.ontCount} ONTs active)
                          </span>
                        </div>
                      </TableCell>

                      {/* Optical Power */}
                      <TableCell className="py-3.5">
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
                          {olt.meanPowerDbm}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5">
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          <span>{olt.status}</span>
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 pr-6 text-right">
                        <ActionTooltip label="Test SNMP & SSH Poller Response" shortcut="P">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestPing(olt)}
                            disabled={testingOltId === olt.id}
                            className="h-7 px-2 text-xs font-semibold border-border bg-card hover:bg-muted gap-1 text-foreground shadow-2xs"
                          >
                            <Terminal className="h-3 w-3 text-muted-foreground" />
                            <span>Ping / Test</span>
                          </Button>
                        </ActionTooltip>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
                    <ContextMenuItem
                      onClick={() => handleTestPing(olt)}
                      className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
                    >
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span>Test SNMP & SSH Reachability</span>
                      <ContextMenuShortcut>P</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={onOpenQuotaModal}
                      className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                    >
                      <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Adjust OLT Quotas</span>
                      <ContextMenuShortcut>Q</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuSeparator className="bg-border/40 my-1" />

                    <ContextMenuItem
                      onClick={() => handleCopy(olt.ipAddress, "Management IP")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy IP ({olt.ipAddress})</span>
                      <ContextMenuShortcut>C</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => handleCopy(olt.code, "Device Code")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Device Code ({olt.code})</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
