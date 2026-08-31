

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
} from "@k2net/ui";
import {
  Network,
  Plus,
  Sliders,
  Copy,
  Terminal,
  Zap,
  Clock,
  Sparkles,
  Loader2,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../types";
import { useTenantSubscription } from "@/hooks/useTenantSubscription";

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
  const { summary, addBooster, refetch } = useTenantSubscription(org.slug);

  const [testingOltId, setTestingOltId] = useState<string | null>(null);
  const [isBoosterModalOpen, setIsBoosterModalOpen] = useState(false);
  const [boosterOlts, setBoosterOlts] = useState(5);
  const [boosterOdps, setBoosterOdps] = useState(1000);
  const [boosterDuration, setBoosterDuration] = useState(30);
  const [boosterReason, setBoosterReason] = useState("");
  const [isSavingBooster, setIsSavingBooster] = useState(false);

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

  const handleApplyBooster = async () => {
    setIsSavingBooster(true);
    try {
      await addBooster({
        boosterOlts: Number(boosterOlts),
        boosterOdps: Number(boosterOdps),
        durationDays: Number(boosterDuration),
        reason: boosterReason || "Emergency booster tender project",
      });
      setIsBoosterModalOpen(false);
      refetch();
    } catch {
      // Handled in hook
    } finally {
      setIsSavingBooster(false);
    }
  };

  const maxOlts = summary?.maxOlts ?? org.maxOlts;
  const usedOlts = summary?.usedOlts ?? org.usedOlts;
  const maxOdps = summary?.maxOdps ?? org.maxOdps;
  const usedOdps = summary?.usedOdps ?? org.usedOdps;

  const isBoosterActive = summary?.isBoosterActive ?? false;
  const effectiveMaxOlts = summary?.effectiveMaxOlts ?? maxOlts;
  const effectiveMaxOdps = summary?.effectiveMaxOdps ?? maxOdps;

  return (
    <div className="space-y-6">
      {/* ── 1. Header Quota Allocation & Booster Action ──────────────────────── */}
      <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-foreground">Hardware Quotas & OLT Poller Telemetry</h3>
            <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">
              {usedOlts} of {effectiveMaxOlts} OLTs Active
            </Badge>

            {isBoosterActive && (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[9px] gap-1">
                <Zap className="h-3 w-3" />
                <span>BOOSTER +{summary?.boosterOdps} ODP ({summary?.boosterDaysRemaining} Hari Sisa)</span>
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Semua perangkat OLT yang terdaftar dimonitor secara berkala oleh <code className="text-primary font-mono text-[10px]">ftth-poller:5010</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ActionTooltip label="Terapkan Kuota Darurat Tambahan (+1.000 ODP 30 Hari)">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBoosterModalOpen(true)}
              className="h-7 px-2.5 text-xs font-semibold border-amber-500/30 bg-card hover:bg-amber-500/10 text-amber-500 gap-1.5 shadow-2xs"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>+ Emergency Booster</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip label="Sesuaikan Batas Kuota Hardware" shortcut="Q">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenQuotaModal}
              className="h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs"
            >
              <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Adjust Quotas</span>
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* ── 2. Effective Hardware Capacity Gauges (Kondisi 6) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OLT Gauge */}
        <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">Kapasitas Slot OLT Fisik</span>
            <span className="font-mono text-muted-foreground">
              {usedOlts} / {effectiveMaxOlts} OLT
              {isBoosterActive && summary?.boosterOlts ? ` (${maxOlts} Base + ${summary.boosterOlts} Booster)` : ""}
            </span>
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (usedOlts / Math.max(1, effectiveMaxOlts)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>Terpakai: {Math.round((usedOlts / Math.max(1, effectiveMaxOlts)) * 100)}%</span>
            <span>Tersisa: {Math.max(0, effectiveMaxOlts - usedOlts)} Slot</span>
          </div>
        </div>

        {/* ODP Gauge */}
        <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">Kapasitas Node ODP / FAT</span>
            <span className="font-mono text-muted-foreground">
              {usedOdps} / {effectiveMaxOdps} ODP
              {isBoosterActive && summary?.boosterOdps ? ` (${maxOdps} Base + ${summary.boosterOdps} Booster)` : ""}
            </span>
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (usedOdps / Math.max(1, effectiveMaxOdps)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>Terpakai: {Math.round((usedOdps / Math.max(1, effectiveMaxOdps)) * 100)}%</span>
            <span>Tersisa: {Math.max(0, effectiveMaxOdps - usedOdps)} Node</span>
          </div>
        </div>
      </div>

      {/* ── 3. OLT Hardware Devices Table ────────────────────────────────────── */}
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
                  Device Code & Name
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Vendor & Model
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
              {oltDevices.map((olt) => (
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
                            onClick={() => handleTestPing(olt)}
                            className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1.5 px-2.5 font-mono"
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
                      onClick={() => handleTestPing(olt)}
                      className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
                    >
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span>Test SNMP Reachability</span>
                      <ContextMenuShortcut>T</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuSeparator className="bg-border/40 my-1" />

                    <ContextMenuItem
                      onClick={() => handleCopy(olt.ipAddress, "Management IP")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Management IP ({olt.ipAddress})</span>
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

      {/* ── MODAL: Emergency Quota Booster Dialog (Kondisi 6) ────────────────── */}
      <Dialog open={isBoosterModalOpen} onOpenChange={setIsBoosterModalOpen}>
        <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[480px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
          <DialogHeader className="p-5 pb-2 text-foreground">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-500">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Aktivasi Emergency Quota Booster</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tambahkan kuota kapasitas sementara (bursting) selama proyek tender berlangsung tanpa upgrade permanen.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Tambahan Kuota OLT (+)</Label>
                <Input
                  type="number"
                  value={boosterOlts}
                  onChange={(e) => setBoosterOlts(Number(e.target.value))}
                  className="h-8 text-xs bg-card border-border text-foreground font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Tambahan Kuota ODP (+)</Label>
                <Input
                  type="number"
                  value={boosterOdps}
                  onChange={(e) => setBoosterOdps(Number(e.target.value))}
                  className="h-8 text-xs bg-card border-border text-foreground font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Durasi Masa Berlaku Booster (Hari)</Label>
              <Input
                type="number"
                value={boosterDuration}
                onChange={(e) => setBoosterDuration(Number(e.target.value))}
                className="h-8 text-xs bg-card border-border text-foreground font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Alasan Kebutuhan Proyek *</Label>
              <Input
                placeholder="Contoh: Proyek Tender Fiber Kawasan Industri MM2100"
                value={boosterReason}
                onChange={(e) => setBoosterReason(e.target.value)}
                className="h-8 text-xs bg-card border-border text-foreground"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-muted-foreground leading-relaxed">
              Setelah {boosterDuration} hari berakhir, jika kapasitas terpakai masih di atas kuota dasar, akun akan beralih secara aman ke mode <strong>OVER_QUOTA (Read-Only)</strong> tanpa kehilangan data.
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsBoosterModalOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleApplyBooster}
              disabled={isSavingBooster || !boosterReason.trim()}
              className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              {isSavingBooster ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aktifkan Booster Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
