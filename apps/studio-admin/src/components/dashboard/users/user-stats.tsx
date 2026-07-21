"use client";

import { Card, CardContent } from "@k2net/ui";

interface UserStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    pendingRequests: number;
  } | null;
}

export function UserStats({ stats }: UserStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Total Users */}
      <Card className="bg-card border border-border rounded-lg shadow-none overflow-hidden">
        <CardContent className="p-4 flex flex-col justify-center">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            Total Users
          </div>
          <div className="text-xl font-bold text-foreground">
            {stats?.totalUsers.toLocaleString() || "0"}
          </div>
        </CardContent>
      </Card>

      {/* Active Now */}
      <Card className="bg-card border border-border rounded-lg shadow-none overflow-hidden">
        <CardContent className="p-4 flex flex-col justify-center">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            Active Now
          </div>
          <div className="text-xl font-bold text-foreground">
            {stats?.activeUsers.toLocaleString() || "0"}
          </div>
        </CardContent>
      </Card>

      {/* Open Requests */}
      <Card className="bg-card border border-border rounded-lg shadow-none overflow-hidden">
        <CardContent className="p-4 flex flex-col justify-center">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            Open Requests
          </div>
          <div className="text-xl font-bold text-foreground">
            {stats?.pendingRequests.toString() || "0"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
