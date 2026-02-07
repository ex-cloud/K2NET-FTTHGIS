"use client";

import { Users, Activity, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UserStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    pendingRequests: number;
  } | null;
}

export function UserStats({ stats }: UserStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {/* Total Users */}
      <Card className="bg-background/60 backdrop-blur border-l-4 border-l-emerald-500 border-y border-r border-border/40 shadow-sm">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <Users className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Users
            </div>
            <div className="text-2xl font-mono font-bold">
              {stats?.totalUsers.toLocaleString() || "..."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Now */}
      <Card className="bg-background/60 backdrop-blur border-l-4 border-l-sky-500 border-y border-r border-border/40 shadow-sm">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 rounded-xl">
            <Activity className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Active Now
            </div>
            <div className="text-2xl font-mono font-bold">
              {stats?.activeUsers.toLocaleString() || "..."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Requests */}
      <Card className="bg-background/60 backdrop-blur border-l-4 border-l-amber-500 border-y border-r border-border/40 shadow-sm">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Open Requests
            </div>
            <div className="text-2xl font-mono font-bold">
              {stats?.pendingRequests.toString().padStart(2, "0") || "00"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
