"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useSelectionStore } from "@/store/selection-store";
import { 
  Activity, 
  MapPin, 
  Zap, 
  Layers, 
  Settings, 
  ArrowUpRight,
  Trash2,
  Edit2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { getBackendBaseUrl } from "@/lib/api-config";
import { usePathname } from "next/navigation";

interface AssetDetails {
  id: string;
  code: string;
  type: string;
  status: string;
  labels?: string[];
  attributes: Record<string, string | number | boolean | null>;
  relatedAssets?: Array<{id: string, code: string, type: string, status: string}>;
}

export function DetailSlidePanel() {
  const { selectedAsset, setSelectedAsset } = useSelectionStore();
  const [details, setDetails] = React.useState<AssetDetails | null>(null);
  const [loading, setLoading] = React.useState(false);
  const pathname = usePathname();

  // Don't show slide panel if on topology/map view (where AssetPanel is primary)
  const isMapView = pathname?.includes("/infrastructure/topology") || pathname?.includes("/dashboard/map");
  const isOpen = !!selectedAsset && !isMapView;

  const fetchDetails = React.useCallback(async () => {
    if (!selectedAsset) return;
    setLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await fetch(`${baseUrl}/network/assets/by-code/${selectedAsset.type}/${selectedAsset.code}`);
      if (!res.ok) throw new Error("Failed to fetch asset details");
      const data = await res.json();
      setDetails(data);
    } catch (err) {
      console.error(err);
      // Fallback for demo/missing data
      setDetails({
        id: selectedAsset.id || "0",
        code: selectedAsset.code || "UNKNOWN",
        type: selectedAsset.type,
        status: selectedAsset.status || "UNKNOWN",
        attributes: {
          "Source Control": "Local GIS Data",
          "Last Synced": new Date().toISOString().split('T')[0],
          "Validation": "Active"
        }
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAsset]);

  React.useEffect(() => {
    if (isOpen) fetchDetails();
  }, [isOpen, fetchDetails]);

  const handleClose = () => setSelectedAsset(null);

  const getTypeColor = (type: string) => {
    switch(type) {
      case "OLT": return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
      case "ODC": return "text-amber-500 border-amber-500/20 bg-amber-500/5";
      case "ODP": return "text-blue-500 border-blue-500/20 bg-blue-500/5";
      case "CUSTOMER": return "text-purple-500 border-purple-500/20 bg-purple-500/5";
      default: return "text-zinc-500 border-zinc-500/20 bg-zinc-500/5";
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (["UP", "ACTIVE", "OPTIMAL"].includes(s)) return "bg-emerald-500";
    if (["DOWN", "BROKEN", "CRITICAL", "TERMINATED"].includes(s)) return "bg-red-500";
    if (["PLANNING", "MAINTENANCE", "SUSPENDED"].includes(s)) return "bg-zinc-500";
    return "bg-amber-500";
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md bg-zinc-950/95 backdrop-blur-3xl border-l border-white/10 p-0 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-[100]"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Asset Details - {details?.code}</SheetTitle>
          <SheetDescription>In-depth technical specifications and operational status for {details?.type} {details?.code}</SheetDescription>
        </SheetHeader>

        {/* Navigation Action Hook */}
        <div className="absolute top-0 right-0 p-4 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="rounded-full hover:bg-white/5 text-zinc-400 group"
          >
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl border-2 border-emerald-500/10 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 bg-emerald-500/5 blur-2xl animate-pulse" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/70">Establish Signal</span>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest italic">Synchronizing Core Assets</span>
            </div>
          </div>
        ) : details && (
          <>
            {/* Premium Header */}
            <div className="relative p-8 pt-16 overflow-hidden border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent opacity-40" />
              
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`rounded-xl px-4 py-1.5 font-black tracking-widest text-[10px] border-2 shadow-sm ${getTypeColor(details.type)}`}>
                    {details.type}
                  </Badge>
                  <div className="flex items-center gap-3 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(details.status)} shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{details.status}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
                    {details.code}
                  </h1>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.25em] flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-emerald-500/50" />
                    Layer Grid Identifier: {details.id}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-black rounded-2xl h-10 px-6 shadow-xl active:scale-95 transition-all">
                    <Edit2 className="w-4 h-4 mr-2" /> MODIFY
                  </Button>
                  <Button variant="outline" size="sm" className="h-10 px-4 border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl text-white font-bold transition-all shadow-lg active:scale-95">
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-10 pb-24">
                {/* Visual Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-2 group hover:border-emerald-500/20 transition-all shadow-inner">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Reliability</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-white tracking-tighter leading-none">99.8%</div>
                  </div>
                  <div className="p-5 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-2 group hover:border-blue-500/20 transition-all shadow-inner">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Pulse Check</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-white tracking-tighter leading-none">2m Ago</div>
                  </div>
                </div>

                {/* Technical Overview Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900/80 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" /> Infrastructure Attributes
                  </div>
                  <div className="space-y-4">
                    {Object.entries(details.attributes).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between group cursor-default">
                        <span className="text-xs font-black text-zinc-600 uppercase tracking-tighter group-hover:text-zinc-400 transition-colors">{key}</span>
                        <div className="h-[1px] flex-1 mx-6 bg-gradient-to-r from-white/5 via-white/10 to-white/5 group-hover:via-emerald-500/20 transition-all" />
                        <span className="text-xs font-mono font-bold text-zinc-200 group-hover:text-white transition-colors">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operations Section */}
                <div className="space-y-4 pt-10 border-t border-white/5">
                   <div className="flex items-center gap-2 text-[10px] font-black text-red-500/50 uppercase tracking-widest">
                    <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-700" /> Danger Zone
                  </div>
                  <Button variant="outline" className="w-full flex justify-between h-14 rounded-2xl border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 group transition-all shadow-sm active:scale-[0.98]">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-xs font-black text-red-500 group-hover:text-red-400 uppercase tracking-tight">Purge Physical Record</span>
                      <span className="text-[10px] font-medium text-red-900/60 lowercase italic">Irreversible Registry Action</span>
                    </div>
                    <Trash2 className="w-5 h-5 text-red-500/40 group-hover:text-red-500 transition-all" />
                  </Button>
                </div>
              </div>
            </ScrollArea>

            {/* Bottom Insight Bar */}
            <div className="p-8 bg-zinc-950 border-t border-white/5 backdrop-blur-3xl shadow-[0_-10px_25px_-12px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner group">
                  <Activity className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-0.5">Performance Harmony</div>
                  <div className="text-sm font-bold text-zinc-200 uppercase tracking-tight">Optimal Grid Stability</div>
                </div>
                <Button size="icon" className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                  <Zap className="w-5 h-5 fill-current" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
