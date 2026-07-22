"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Users, UserCheck, Clock } from "lucide-react";

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
      <Card animatedBeam beamColor="#8b5cf6">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span>Total Users</span>
            <Users className="w-3.5 h-3.5 text-violet-400 group-hover:text-violet-300 transition-colors" />
          </CardDescription>
          <CardTitle className="mt-1 text-2xl font-bold text-violet-400">
            {stats?.totalUsers.toLocaleString() || "0"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-[10px] text-muted-foreground">Registered platform identity accounts</div>
        </CardContent>
      </Card>

      {/* Active Now */}
      <Card animatedBeam beamColor="#3ecf8e">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span>Active Now</span>
            <UserCheck className="w-3.5 h-3.5 text-primary group-hover:text-emerald-300 transition-colors" />
          </CardDescription>
          <CardTitle className="mt-1 text-2xl font-bold text-primary">
            {stats?.activeUsers.toLocaleString() || "0"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-[10px] text-muted-foreground">Verified &amp; active session accounts</div>
        </CardContent>
      </Card>

      {/* Open Requests */}
      <Card animatedBeam beamColor="#0ea5e9">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span>Open Requests</span>
            <Clock className="w-3.5 h-3.5 text-sky-400 group-hover:text-sky-300 transition-colors" />
          </CardDescription>
          <CardTitle className="mt-1 text-2xl font-bold text-sky-400">
            {stats?.pendingRequests.toString() || "0"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-[10px] text-muted-foreground">Pending identity access invitations</div>
        </CardContent>
      </Card>
    </div>
  );
}
