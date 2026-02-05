"use client";

import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export function UserFilters() {
  return (
    <aside className="hidden xl:flex w-80 flex-col border-l border-border/40 bg-background/50 backdrop-blur h-full">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Advanced Filters
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Department */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Department
            </Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dept-eng"
                  defaultChecked
                  className="border-white/10 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <label
                  htmlFor="dept-eng"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Engineering
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dept-ops"
                  className="border-white/10 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <label
                  htmlFor="dept-ops"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Operations
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dept-cyber"
                  className="border-white/10 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <label
                  htmlFor="dept-cyber"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cybersecurity
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dept-logs"
                  className="border-white/10 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <label
                  htmlFor="dept-logs"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Logistics
                </label>
              </div>
            </div>
          </div>

          {/* Area Group */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Area Group
            </Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-full bg-muted/40 border-border/40 text-xs">
                <SelectValue placeholder="Select Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="na-hub">North American Hub</SelectItem>
                <SelectItem value="ea-bb">Euro-Asia Backbone</SelectItem>
                <SelectItem value="ds-nodes">Deep-Sea Nodes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Security Clearance */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Security Clearance
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 border border-border/40 rounded bg-muted/20 text-[10px] font-bold uppercase text-muted-foreground hover:border-emerald-500 hover:text-emerald-500 transition-all">
                Level 01
              </button>
              <button className="p-2 border border-emerald-500 rounded bg-emerald-500/10 text-[10px] font-bold uppercase text-emerald-500">
                Level 02
              </button>
              <button className="p-2 border border-border/40 rounded bg-muted/20 text-[10px] font-bold uppercase text-muted-foreground hover:border-emerald-500 hover:text-emerald-500 transition-all">
                Level 03
              </button>
              <button className="p-2 border border-border/40 rounded bg-muted/20 text-[10px] font-bold uppercase text-muted-foreground hover:border-emerald-500 hover:text-emerald-500 transition-all">
                Super User
              </button>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-background/60 backdrop-blur p-4 rounded-xl border border-dashed border-border/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Active Alerts
              </span>
              <span className="text-[10px] font-mono text-red-500">
                2 URGENT
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-[10px] text-red-400">
                Unauthorized access attempt in Sector 7G
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-6 border-t border-border/40 bg-muted/10 mt-auto">
        <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest border border-border/10">
          Clear All Filters
        </Button>
      </div>
    </aside>
  );
}
