import { TrendingUp, Sparkles } from "lucide-react";
import { Card } from "@k2net/ui";
import { type Task } from "@/hooks/useTasksQuery";

interface ProjectOverviewSummaryCardProps {
  healthStatus: "On track" | "At risk" | "Off track";
  assigneeId: string | null;
  projectTask: Task;
}

export function ProjectOverviewSummaryCard({
  healthStatus,
  assigneeId,
  projectTask,
}: ProjectOverviewSummaryCardProps) {
  return (
    <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Latest Status Update</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <TrendingUp className="w-3 h-3" />
          {healthStatus}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">
          {assigneeId ? assigneeId.substring(0, 1).toUpperCase() : "E"}
        </div>
        <span className="font-medium text-foreground">{assigneeId ? assigneeId.split("@")[0] : "Engineering Lead"}</span>
        <span>·</span>
        <span className="font-mono text-[11px]">
          {projectTask.updatedAt
            ? new Date(projectTask.updatedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Today"}
        </span>
      </div>

      <p className="text-xs text-foreground/85 leading-relaxed bg-background/50 p-3 rounded-lg border border-border/40 font-mono">
        Projek payung ini bertindak sebagai master inisiatif platform. Tambahkan issue teknis di tab &apos;Issues&apos; untuk memecah pekerjaan.
      </p>
    </Card>
  );
}
