import {
  Zap,
  Users,
  Router,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@k2net/ui";
import { Skeleton } from "@k2net/ui";
import { useNetworkStats } from "@/hooks/queries/useNetworkStats";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

function StatCard({ title, icon, children, defaultOpen = true }: { title: string, icon: ReactNode, children: ReactNode, defaultOpen?: boolean }) {
  return (
    <div className="bg-background/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-xl overflow-hidden pointer-events-auto">
      <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors group">
          <div className="flex items-center gap-1.5">
            {icon}
            <span>{title}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 pt-0 border-t border-border/10">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function StatsPanelSkeleton() {
  return (
    <div className="absolute top-[80px] left-4 flex flex-col gap-4 w-[280px] z-10">
      <StatCard title="Network Statistics" icon={<TrendingUp className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/40 flex flex-col justify-center h-[58px]">
              <Skeleton className="h-2 w-12 mb-2 bg-white/5" />
              <Skeleton className="h-4 w-16 bg-white/10" />
            </div>
          ))}
        </div>
      </StatCard>

      <StatCard title="Capacity Monitoring" icon={<Users className="w-3.5 h-3.5" />}>
        <div className="flex flex-col gap-3 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-background/50 backdrop-blur-sm p-2.5 rounded-lg border border-border/40">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-2 w-20 bg-white/5" />
                <Skeleton className="h-2 w-8 bg-white/10" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      </StatCard>
    </div>
  );
}

export function StatsPanel() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params?.projectId as string;
  
  const { data: stats, isLoading, isError } = useNetworkStats(
    session?.accessToken as string | undefined, 
    projectId
  );

  if (isLoading) {
    return <StatsPanelSkeleton />;
  }

  if (isError || !stats) {
    return (
      <div className="absolute top-[80px] left-4 w-[280px] z-10">
        <div className="bg-destructive/10 backdrop-blur-xl border border-destructive/20 p-4 rounded-xl text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">Connection Lost</p>
          <p className="text-[9px] text-muted-foreground mt-1">Unable to sync network metrics.</p>
        </div>
      </div>
    );
  }

  const getCapacityColor = (color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
      case "sky":
        return "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]";
      default:
        return "bg-zinc-500";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: "bg-red-500/10 text-red-500",
        };
      default:
        return {
          icon: <Zap className="w-4 h-4" />,
          color: "bg-amber-500/10 text-amber-500",
        };
    }
  };

  return (
    <>
      {/* Left Column (Under Search) */}
      <div className="absolute top-[80px] left-4 flex flex-col gap-4 w-[280px] z-10">
        <StatCard title="Network Statistics" icon={<TrendingUp className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/40 shadow-inner flex flex-col justify-center transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Zap className="w-3 h-3 text-primary" /> Cable
              </div>
              <div className="text-sm font-bold font-mono tracking-tight text-foreground/90">
                {stats.totalCableLengthKm.toFixed(1)} <span className="text-[10px] text-muted-foreground font-sans font-normal">KM</span>
              </div>
            </div>
            <div className="bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/40 shadow-inner flex flex-col justify-center transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Users className="w-3 h-3 text-sky-500" /> Users
              </div>
              <div className="text-sm font-bold font-mono tracking-tight text-primary shadow-emerald-500/10 text-shadow-sm">
                {stats.totalUsers.toLocaleString()}
              </div>
            </div>
            <div className="bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/40 shadow-inner flex flex-col justify-center transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Router className="w-3 h-3 text-muted-foreground" /> Nodes
              </div>
              <div className="text-sm font-bold font-mono tracking-tight text-foreground/90">
                {stats.totalNodes.toLocaleString()}
              </div>
            </div>
            <div className="bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/40 shadow-inner flex flex-col justify-center transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <TrendingUp className="w-3 h-3 text-muted-foreground" /> Growth
              </div>
              <div className="text-sm font-bold font-mono tracking-tight text-primary shadow-emerald-500/10 text-shadow-sm">
                +{stats.growthPercentage}%
              </div>
            </div>
          </div>
        </StatCard>

        <StatCard title="Capacity Monitoring" icon={<Users className="w-3.5 h-3.5" />}>
          <div className="flex flex-col gap-3 mt-2">
            {stats.topCapacities?.slice(0, 3).map((item, idx) => (
              <div key={idx} className="bg-background/50 backdrop-blur-sm p-2.5 rounded-lg border border-border/40 shadow-inner transition-colors hover:bg-muted/50">
                <div className="flex justify-between items-center text-[10px] mb-1.5">
                  <span className="text-muted-foreground font-bold font-mono truncate mr-2">
                    {item.label}
                  </span>
                  <span
                    className={`${item.percentage > 70 ? "text-primary" : "text-sky-500"} font-bold shrink-0`}
                  >
                    {Math.round(item.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-muted/80 h-1.5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full ${getCapacityColor(item.color)} transition-all duration-1000 ease-in-out`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats.topCapacities || stats.topCapacities.length === 0) && (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                No capacity data available
              </div>
            )}
          </div>
        </StatCard>

        <StatCard title="Active Maintenance" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
          <div className="flex flex-col gap-2 mt-2 max-h-[175px] overflow-y-auto custom-scrollbar pr-1">
            {stats.activeMaintenances?.map((item, idx) => {
              const { icon, color } = getSeverityIcon(item.severity);
              return (
                <div
                  key={idx}
                  className="group flex items-center gap-3 p-2.5 bg-background/50 backdrop-blur-sm border border-border/40 rounded-lg hover:bg-muted/80 transition-all cursor-pointer shadow-inner shrink-0"
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${color} shadow-sm`}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold font-mono truncate text-foreground/90 group-hover:text-foreground">
                      {item.code}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase truncate mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>
              );
            })}
            {(!stats.activeMaintenances || stats.activeMaintenances.length === 0) && (
               <div className="text-[10px] font-medium text-primary/80 bg-primary/10 p-4 rounded-lg border border-primary/20 text-center flex flex-col items-center justify-center gap-1.5">
                 <Zap className="w-4 h-4 text-primary/80" />
                 All systems optimal.
               </div>
            )}
          </div>
        </StatCard>
      </div>
    </>
  );
}

