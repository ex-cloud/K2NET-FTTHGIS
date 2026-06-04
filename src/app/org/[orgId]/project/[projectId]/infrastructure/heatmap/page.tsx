import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Map as MapIcon,
  Sliders,
  Play,
  Share2,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HeatmapPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 h-full bg-transparent overflow-hidden relative pt-16">
      {/* Background Grid Accent Removed - Using Global Grid */}

      {/* Main Heatmap Visual Area */}
      <div className="flex-1 flex flex-col relative items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-rose-500/20 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative w-48 h-48 rounded-full border-4 border-zinc-800 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ef444460,transparent_70%)]" />
              <div className="text-4xl font-black text-white">GIS</div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">
            Heatmap Visualization
          </h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            Optimizing signal distribution across high-density urban clusters.
          </p>
        </div>

        {/* Playback Controls (Bottom) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-4 rounded-2xl flex items-center gap-6">
            <Button
              size="icon"
              className="bg-emerald-500 hover:bg-emerald-600 rounded-full"
            >
              <Play className="w-5 h-5 fill-current" />
            </Button>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-[60%] w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
              <div
                className="h-full bg-emerald-500/30 rounded-full"
                style={{ width: "60%" }}
              />
            </div>
            <div className="text-[10px] font-bold text-zinc-400 font-mono tracking-widest">
              T-03H (NOW)
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Controller */}
      <aside className="w-80 border-l border-zinc-800/60 bg-zinc-950/50 backdrop-blur-xl p-6 flex flex-col gap-8 z-10">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            Heatmap Controller
          </h3>
          <p className="text-xs text-zinc-500 font-medium leading-tight">
            Configure signal intensity and metric overlays.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Metric Selector
            </label>
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <MapIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-none">
                    Signal Strength
                  </div>
                  <div className="text-[9px] text-emerald-500/60 font-medium">
                    RSRP / RSRQ Levels
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-300 leading-none">
                    Traffic Load
                  </div>
                  <div className="text-[9px] text-zinc-600 font-medium">
                    Gbps / Sector
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <span className="text-zinc-400">Opacity</span>
                <span className="text-emerald-500">70%</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: "70%" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <span className="text-zinc-400">Intensity Gradient</span>
                <span className="text-emerald-500">1.2x</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: "45%" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white gap-2 h-9 text-xs font-bold uppercase">
            <Share2 className="w-3.5 h-3.5" />
            Share View
          </Button>
          <Button
            variant="ghost"
            className="w-full text-zinc-500 gap-2 h-9 text-xs font-bold uppercase"
          >
            <Printer className="w-3.5 h-3.5" />
            Export PDF
          </Button>
        </div>
      </aside>
    </div>
  );
}
