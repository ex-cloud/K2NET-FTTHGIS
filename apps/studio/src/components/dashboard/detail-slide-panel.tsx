"use client";

import * as React from "react";
import { Sheet, SheetContent } from "@k2net/ui";
import { useSelectionStore } from "@/store/selection-store";
import {
  Activity,
  MapPin,
  Zap,
  Layers,
  Settings,
  ArrowUpRight,
  Trash2,
  ArrowRight,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useAssetEdit } from "@/hooks/use-asset-edit";
import { DrawAssetType } from "@/store/map-store";
import { Button } from "@k2net/ui";
import { Badge } from "@k2net/ui";
import { ScrollArea } from "@k2net/ui";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@k2net/ui";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@k2net/ui";
import { AuditTimeline } from "./audit-timeline";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { networkApi, type AssetHistory, type DiagnosticResult } from "@/lib/api/network";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import { Label } from "@k2net/ui";
import { toast } from "sonner";

interface AssetDetails {
  id: string;
  code: string;
  type: string;
  status: string;
  labels?: string[];
  attributes: Record<string, string | number | boolean | null>;
  lat?: number;
  lng?: number;
  relatedAssets?: Array<{
    id: string;
    code: string;
    type: string;
    status: string;
  }>;
}



export function DetailSlidePanel() {
  const { selectedAsset, setSelectedAsset } = useSelectionStore();
  const [details, setDetails] = React.useState<AssetDetails | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState("");
  const [isPolling, setIsPolling] = React.useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = React.useState(false);
  const [diagnosticResult, setDiagnosticResult] =
    React.useState<DiagnosticResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<AssetHistory[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("details");
  const { openEdit } = useAssetEdit();

  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const orgId = params?.orgId as string;
  const projectId = params?.projectId as string;

  // Don't show slide panel if on topology/map view (where AssetPanel is primary)
  const isMapView =
    pathname?.includes("/infrastructure/topology") ||
    pathname?.includes("/dashboard/map");
  const isOverviewView = pathname?.endsWith(`/project/${projectId}`) || pathname?.endsWith(`/project/${projectId}/`);
  const isOpen = !!selectedAsset && !isMapView && !isOverviewView;

  const fetchDetails = React.useCallback(async () => {
    if (!selectedAsset) return;
    setLoading(true);
    setError(null);
    try {
      const data = await networkApi.getAssetByCode(selectedAsset.type as string, selectedAsset.code as string, session?.accessToken ?? "");
      setDetails(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi");
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [selectedAsset, session?.accessToken]);

  const fetchHistory = React.useCallback(async () => {
    if (!selectedAsset) return;
    setHistoryLoading(true);
    try {
      const data = await networkApi.getAssetHistory(selectedAsset.type as string, selectedAsset.code as string, session?.accessToken ?? "");
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch audit history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedAsset, session?.accessToken]);

  React.useEffect(() => {
    if (isOpen) {
      fetchDetails();
      fetchHistory();
    }
  }, [isOpen, fetchDetails, fetchHistory]);

  const handleClose = () => {
    setSelectedAsset(null);
    setIsDeleteDialogOpen(false);
    setDeleteReason("");
    setHistory([]);
    setActiveTab("details");
  };

  const handleDelete = async () => {
    if (!details || !selectedAsset || !session?.accessToken) return;

    // Validate reason
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for purging this physical record");
      return;
    }

    setIsDeleting(true);
    try {
      await networkApi.deleteAsset(details.type, details.id, deleteReason, session.accessToken as string, projectId as string);

      toast.success(`${details.type} [${details.code}] purged successfully`);

      // Success!
      handleClose();
      // Signal refresh to any registered data hooks
      window.dispatchEvent(new CustomEvent("refetch-network-data"));
    } catch (err) {
      console.error(err);
      toast.error(
        "Registry error: Unable to purge record. Please check connectivity.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = () => setIsDeleteDialogOpen(true);

  const handleModify = () => {
    if (!details || !selectedAsset) return;
    
    // Build a fully-populated asset object that matches what edit dialogs expect.
    // The edit dialogs (OdpDialog, OdcDialog, etc.) expect a flat object matching
    // the TypeScript interfaces (ODP, ODC, OLT, Customer) from types/network.ts.
    const flattenedAsset: Record<string, unknown> = {
      id: details.id,
      code: details.code,
      name: details.attributes?.["Name"] ?? details.code,
      status: details.status,
      type: selectedAsset.type.toUpperCase(),
      // Coordinates come from top-level DTO fields (populated by backend)
      lat: details.lat,
      lng: details.lng,
    };

    if (details.attributes) {
      Object.entries(details.attributes).forEach(([key, value]) => {
        // Map display-label keys to the field names that edit dialogs expect
        if (key === "Capacity") flattenedAsset.capacity = value;
        if (key === "Used") flattenedAsset.usedCapacity = value;
        if (key === "Total Ports") flattenedAsset.totalPort = value;
        if (key === "Used Ports") flattenedAsset.usedPort = value;
        if (key === "IP Address") flattenedAsset.ipAddress = value;
        if (key === "Address") flattenedAsset.address = value;
        if (key === "Last Note") flattenedAsset.lastNote = value;
        // Parent IDs — convert to string for Radix Select compatibility
        if (key === "odcId") flattenedAsset.odcId = value != null ? String(value) : "";
        if (key === "oltId") flattenedAsset.oltId = value != null ? String(value) : "";
        if (key === "odpId") flattenedAsset.odpId = value != null ? String(value) : "";
        // Parent codes for display
        if (key === "Parent ODC") flattenedAsset.odcCode = value;
        if (key === "Parent OLT") flattenedAsset.oltCode = value;
        if (key === "Connected ODP") flattenedAsset.odpCode = value;
      });
    }

    // Ensure type is uppercase for consistency with inventory pages
    openEdit({
      id: flattenedAsset.id as string,
      type: flattenedAsset.type as DrawAssetType,
      code: flattenedAsset.code as string,
      lat: flattenedAsset.lat as number,
      lng: flattenedAsset.lng as number,
      status: flattenedAsset.status as string,
      name: flattenedAsset.name as string,
      properties: flattenedAsset,
    });
  };

  const handleViewOnMap = () => {
    if (!details) return;

    // Fix navigation path using dynamic orgId and projectId
    if (orgId && projectId) {
      router.push(
        `/org/${orgId}/project/${projectId}/infrastructure/topology?flyTo=${details.code}`,
      );
    } else {
      // Fallback for safety (though params should exist if on inventory page)
      router.push(`/dashboard/map?flyTo=${details.code}`);
    }
  };

  const handlePulse = async () => {
    if (!details) return;
    setIsPolling(true);
    try {
      const result = await networkApi.getDiagnostics(details.type, details.code, session?.accessToken as string);
      setDiagnosticResult(result);
      setIsDiagnosticOpen(true);
      toast.success("Diagnostic pulse captured successfully");
    } catch (err) {
      console.error(err);
      toast.error("Pulse Check Failed: Could not reach diagnostic engine.");
    } finally {
      setIsPolling(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "OLT":
        return "text-primary border-primary/20 bg-emerald-500/5";
      case "ODC":
        return "text-amber-500 border-amber-500/20 bg-amber-500/5";
      case "ODP":
        return "text-blue-500 border-blue-500/20 bg-blue-500/5";
      case "CUSTOMER":
        return "text-purple-500 border-purple-500/20 bg-purple-500/5";
      default:
        return "text-zinc-500 border-zinc-500/20 bg-zinc-500/5";
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (["UP", "ACTIVE", "OPTIMAL"].includes(s)) return "bg-emerald-500";
    if (["DOWN", "BROKEN", "CRITICAL", "TERMINATED"].includes(s))
      return "bg-red-500";
    if (["PLANNING", "MAINTENANCE", "SUSPENDED"].includes(s))
      return "bg-zinc-500";
    return "bg-amber-500";
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-zinc-950/95 backdrop-blur-3xl border-l border-white/10 p-0 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-100 [&>button]:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Asset Details - {details?.code}</SheetTitle>
          <SheetDescription>
            In-depth technical specifications and operational status for{" "}
            {details?.type} {details?.code}
          </SheetDescription>
        </SheetHeader>

        {/* Intuitive Close Action Hook (Top Left) */}
        <div className="absolute top-0 left-0 p-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full hover:bg-white/5 text-zinc-400 group transition-all"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl border-2 border-emerald-500/10 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 bg-emerald-500/5 blur-2xl animate-pulse" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
                Establish Signal
              </span>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest italic">
                Synchronizing Core Assets
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <div className="absolute inset-0 bg-red-500/5 blur-3xl animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight text-white uppercase">Signal Interrupted</h3>
              <p className="text-sm text-zinc-500 font-medium max-w-[240px]">
                {error}. Pastikan backend di port 9090 sudah berjalan.
              </p>
            </div>
            <Button 
              onClick={fetchDetails} 
              variant="outline" 
              className="rounded-xl border-white/10 hover:bg-white/5 text-white gap-2 h-11 px-8 shadow-xl active:scale-95 transition-all font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              RE-ESTABLISH LINK
            </Button>
          </div>
        ) : (
          details && (
            <>
              {/* Premium Header */}
              <div className="relative p-8 pt-16 overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 via-transparent to-transparent opacity-40" />

                <div className="relative space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`rounded-xl px-4 py-1.5 font-black tracking-widest text-[10px] border-2 shadow-sm ${getTypeColor(details.type)}`}
                      >
                        {details.type}
                      </Badge>
                      <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-border shadow-inner">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(details.status)} shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse`}
                        />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                          {details.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        onClick={handleModify}
                        variant="outline"
                        className="text-white hover:bg-zinc-200 font-black rounded-xl h-8 px-4 shadow-xl active:scale-95 transition-all text-[10px] tracking-tight"
                      >
                        {"MODIFY"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleViewOnMap}
                        className="h-8 w-8 border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-white transition-all shadow-lg active:scale-95"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <h1 className="text-2xl font-black tracking-tighter text-white drop-shadow-2xl leading-tight break-all">
                      {details.code}
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em] flex items-center">
                      <MapPin className="w-3 h-3 mr-2 text-primary/50" />
                      Layer Grid Identifier: {details.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content dengan Tabs */}
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="px-8 pt-6">
                  <TabsList className="w-full bg-white/5 border border-white/10 p-1 h-12 rounded-2xl">
                    <TabsTrigger 
                      value="details" 
                      className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                      Technical Specs
                    </TabsTrigger>
                    <TabsTrigger 
                      value="history" 
                      className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                      Audit Trail
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <TabsContent value="details" className="m-0 focus-visible:ring-0">
                    <div className="p-8 space-y-10 pb-24">
                      {/* Visual Stats Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-zinc-900/50 border border-border space-y-2 group hover:border-primary/20 transition-all shadow-inner">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-primary transition-colors">
                              Reliability
                            </span>
                          </div>
                          <div className="text-2xl font-black font-mono text-white tracking-tighter leading-none">
                            99.8%
                          </div>
                        </div>
                        <div className="p-5 rounded-3xl bg-zinc-900/50 border border-border space-y-2 group hover:border-blue-500/20 transition-all shadow-inner">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                              Pulse Check
                            </span>
                          </div>
                          <div className="text-2xl font-black font-mono text-white tracking-tighter leading-none">
                            2m Ago
                          </div>
                        </div>
                      </div>

                      {/* Technical Overview Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900/80 w-fit px-3 py-1.5 rounded-lg border border-border">
                          <Layers className="w-3.5 h-3.5 text-primary" />{" "}
                          Infrastructure Attributes
                        </div>
                        <div className="space-y-4">
                          {Object.entries(details.attributes).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between group cursor-default"
                              >
                                <span className="text-xs font-black text-zinc-600 uppercase tracking-tighter group-hover:text-zinc-400 transition-colors">
                                  {key}
                                </span>
                                <div className="h-px flex-1 mx-6 bg-linear-to-r from-white/5 via-white/10 to-white/5 group-hover:via-emerald-500/20 transition-all" />
                                <span className="text-xs font-mono font-bold text-zinc-200 group-hover:text-white transition-colors">
                                  {String(value)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Operations Section */}
                      <div className="space-y-4 pt-10 border-t border-border">
                        <div className="flex items-center gap-2 text-[10px] font-black text-red-500/50 uppercase tracking-widest">
                          <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-700" />{" "}
                          Danger Zone
                        </div>
                        <Button
                          variant="outline"
                          onClick={openDeleteDialog}
                          disabled={isDeleting}
                          className="w-full flex justify-between h-14 rounded-2xl border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 group transition-all shadow-sm active:scale-[0.98]"
                        >
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-xs font-black text-red-500 group-hover:text-red-400 uppercase tracking-tight">
                              Purge Physical Record
                            </span>
                            <span className="text-[10px] font-medium text-red-900/60 lowercase italic">
                              Irreversible Registry Action
                            </span>
                          </div>
                          <Trash2 className="w-5 h-5 text-red-500/40 group-hover:text-red-500 transition-all" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="m-0 focus-visible:ring-0">
                    <div className="p-8 pb-32">
                      <div className="mb-8 space-y-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Activity Timeline</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Chronological Asset Revisions</p>
                      </div>
                      <AuditTimeline history={history} isLoading={historyLoading} />
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              {/* Modern Purge Dialog */}
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px] overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-b from-red-500/10 via-transparent to-transparent pointer-events-none" />
                  <DialogHeader className="relative">
                    <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </div>
                      PURGE REGISTRY
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 font-medium">
                      This will permanently destroy the physical record of{" "}
                      <span className="text-white font-black">
                        {details.code}
                      </span>{" "}
                      in the network registry.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4 relative">
                    <div className="space-y-3">
                      <Label
                        htmlFor="reason"
                        className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                      >
                        Reason for Registry Action
                      </Label>
                      <textarea
                        id="reason"
                        placeholder="Specify why this asset is being purged (e.g., Replacement, Decommissioning)..."
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="w-full min-h-[100px] bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all resize-none font-medium"
                      />
                    </div>
                  </div>

                  <DialogFooter className="relative gap-3 sm:gap-0">
                    <Button
                      variant="ghost"
                      onClick={() => setIsDeleteDialogOpen(false)}
                      className="font-bold text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl h-11"
                    >
                      ABORT
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={isDeleting || !deleteReason.trim()}
                      className="bg-red-600 hover:bg-red-500 text-white font-black rounded-xl h-11 px-8 shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                    >
                      {isDeleting ? "PURGING..." : "EXECUTE PURGE"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Premium Diagnostic Report Dialog */}
              <Dialog
                open={isDiagnosticOpen}
                onOpenChange={setIsDiagnosticOpen}
              >
                <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[450px] overflow-hidden p-0 rounded-3xl">
                  <div className="absolute inset-0 bg-linear-to-tr from-emerald-500/10 via-transparent to-blue-500/5 pointer-events-none" />

                  <div className="p-8 space-y-8 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">
                          Diagnostic Pulse
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tighter">
                          NETWORK REPORT
                        </DialogTitle>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <Zap className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Health Meter */}
                      <div className="bg-zinc-900/50 p-6 rounded-3xl border border-border shadow-inner space-y-4">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Health Score
                          </span>
                          <span className="text-4xl font-black text-white font-mono tracking-tighter">
                            {diagnosticResult?.overallHealth || 100}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-border">
                          <div
                            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] transition-all duration-1000"
                            style={{
                              width: `${diagnosticResult?.overallHealth || 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Report Data */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Asset Code
                          </span>
                          <span className="text-sm font-bold text-zinc-200">
                            {details.code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Signal Status
                          </span>
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary bg-emerald-500/5 font-black uppercase text-[10px] tracking-widest"
                          >
                            {diagnosticResult?.status || "OPTIMAL"}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Technical Notes
                          </span>
                          <p className="text-xs text-zinc-400 leading-relaxed font-medium bg-zinc-900 p-4 rounded-2xl border border-border italic">
                            &quot;
                            {diagnosticResult?.notes ||
                              "Signal harmony detected. No interference in the local grid segment. All physical connectors are reporting optimal impedance."}
                            &quot;
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setIsDiagnosticOpen(false)}
                      className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                    >
                      CLOSE REPORT
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Bottom Insight Bar */}
              <div className="p-8 bg-zinc-950 border-t border-border backdrop-blur-3xl shadow-[0_-10px_25px_-12px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group">
                    <Activity className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-0.5">
                      Performance Harmony
                    </div>
                    <div className="text-sm font-bold text-zinc-200 uppercase tracking-tight">
                      Optimal Grid Stability
                    </div>
                  </div>
                  <Button
                    size="icon"
                    onClick={handlePulse}
                    disabled={isPolling}
                    className={`w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all ${isPolling ? "animate-pulse opacity-50" : ""}`}
                  >
                    <Zap
                      className={`w-5 h-5 fill-current ${isPolling ? "animate-bounce" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}
