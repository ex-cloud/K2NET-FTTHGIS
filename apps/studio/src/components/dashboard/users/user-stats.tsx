"use client";

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Total Users */}
      <Card className="bg-[#0c0c0c] border border-zinc-800/60 rounded-md shadow-none overflow-hidden">
        <CardContent className="p-4 flex flex-col justify-center">
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1.5">
            Total Users
          </div>
          <div className="text-xl font-medium text-zinc-100">
            {stats?.totalUsers.toLocaleString() || "0"}
          </div>
        </CardContent>
      </Card>

      {/* Active Now */}
      <Card className="bg-[#0c0c0c] border border-zinc-800/60 rounded-md shadow-none overflow-hidden">
        <CardContent className="p-4 flex flex-col justify-center">
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1.5">
            Active Now
          </div>
          <div className="text-xl font-medium text-zinc-100">
            {stats?.activeUsers.toLocaleString() || "0"}
          </div>
        </CardContent>
      </Card>

      {/* Open Requests */}
      <Card className="bg-[#0c0c0c] border border-zinc-800/60 rounded-md shadow-none overflow-hidden">
        <CardContent className="p-4 flex flex-col justify-center">
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1.5">
            Open Requests
          </div>
          <div className="text-xl font-medium text-zinc-100">
            {stats?.pendingRequests.toString() || "0"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
