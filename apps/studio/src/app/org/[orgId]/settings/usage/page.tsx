"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { 
  BarChart3, 
  Database, 
  MapPin, 
  Users, 
  Activity, 
  Loader2,
  HardDrive,
  Globe
} from "lucide-react";
import { getCurrentOrgSlug } from "@/lib/domain";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Progress } from "@k2net/ui";
import { Badge } from "@k2net/ui";
import { UsagePageWrapper } from "@/components/page-guards/usage-page-wrapper";

interface Stats {
  projectCount: number;
  odcCount: number;
  odpCount: number;
  customerCount: number;
  totalCableLength: number;
  organizationName: string;
}

export default function UsagePage() {
  const params = useParams();
  const orgId = (params.orgId as string) || (typeof window !== "undefined" ? getCurrentOrgSlug() : "") || "";
  const { data: session } = useSession();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['org-stats', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/organizations/${orgId}/analytics/summary`, {
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!session?.accessToken
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const resourceCards = [
    { 
      title: "Active Projects", 
      value: stats?.projectCount || 0, 
      icon: Database, 
      color: "text-blue-500", 
      limit: 10,
      description: "Total number of live projects"
    },
    { 
      title: "ODC Units", 
      value: stats?.odcCount || 0, 
      icon: MapPin, 
      color: "text-primary", 
      limit: 50,
      description: "Optical Distribution Cabinets"
    },
    { 
      title: "ODP Points", 
      value: stats?.odpCount || 0, 
      icon: Activity, 
      color: "text-amber-500", 
      limit: 500,
      description: "Optical Distribution Points"
    },
    { 
      title: "Total Customers", 
      value: stats?.customerCount || 0, 
      icon: Users, 
      color: "text-purple-500", 
      limit: 5000,
      description: "Active home connections"
    }
  ];

  return (
    <UsagePageWrapper>
    <div className="p-8 space-y-8 w-full">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Resource Usage
        </h1>
        <p className="text-zinc-500 mt-1">
          Real-time overview of your organization&apos;s infrastructure and asset distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {resourceCards.map((card) => (
          <Card key={card.title} className="bg-[#0c0c0c] border-zinc-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">{card.value.toLocaleString()}</div>
              <p className="text-[10px] text-zinc-500 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#0c0c0c] border-zinc-800/50">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2 text-lg">
              <HardDrive className="w-5 h-5 text-primary" />
              Quota Management
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Track your current resource consumption against your plan limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 py-6">
            {resourceCards.map((card) => (
              <div key={card.title} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-200">{card.title}</p>
                    <p className="text-xs text-zinc-500">
                      {card.value} of {card.limit} used
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/5 text-primary border-primary/20">
                    {Math.round((card.value / card.limit) * 100)}%
                  </Badge>
                </div>
                <Progress value={(card.value / card.limit) * 100} className="h-1.5 bg-zinc-900" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#0c0c0c] border-zinc-800/50">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-blue-500" />
              Network Reach
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Spacial distribution stats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-3xl font-bold text-zinc-100">
                {(stats?.totalCableLength || 0 / 1000).toFixed(2)} km
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Total Fiber Length</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Avg. Fiber / ODP</span>
                <span className="text-zinc-200 font-mono">
                  {stats?.odpCount ? (stats.totalCableLength / stats.odpCount).toFixed(1) : 0} m
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Avg. Customers / ODP</span>
                <span className="text-zinc-200 font-mono">
                  {stats?.odpCount ? (stats.customerCount / stats.odpCount).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </UsagePageWrapper>
  );
}
