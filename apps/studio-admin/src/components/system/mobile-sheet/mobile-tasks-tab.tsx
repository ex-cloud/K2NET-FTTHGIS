import * as React from "react";
import { ClipboardList, AlertCircle, Server, ChevronRight } from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import { useTaskSummary } from "@/hooks/useTaskSummary";

interface MobileTasksTabProps {
  onNavigate: (url: string) => void;
}

export function MobileTasksTab({ onNavigate }: MobileTasksTabProps) {
  const { summary: taskSummary } = useTaskSummary();

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-200">
      <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Projects &amp; Issues Inbox</span>
        </div>
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
          {taskSummary?.urgentCount ?? 0} Urgent
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Metric stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg border border-border/60 bg-card/40 text-center">
            <span className="text-[10px] text-muted-foreground block">Total Open</span>
            <span className="text-base font-bold text-foreground">{taskSummary?.totalOpen ?? 0}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border/60 bg-card/40 text-center">
            <span className="text-[10px] text-destructive block">Urgent</span>
            <span className="text-base font-bold text-destructive">{taskSummary?.urgentCount ?? 0}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border/60 bg-card/40 text-center">
            <span className="text-[10px] text-primary block">Resolved</span>
            <span className="text-base font-bold text-primary">{taskSummary?.resolvedToday ?? 0}</span>
          </div>
        </div>

        {/* Action shortcuts */}
        <div className="space-y-1.5 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("/tasks?scope=TENANT_TO_PLATFORM")}
            className="w-full flex items-center justify-between p-2.5 rounded-md border border-border/60 bg-card hover:bg-muted/60 text-left text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-3.5 text-primary" />
              <span className="font-semibold text-foreground">B2B Mitra Escalations</span>
            </div>
            <ChevronRight className="size-3 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/tasks?scope=PLATFORM_INTERNAL")}
            className="w-full flex items-center justify-between p-2.5 rounded-md border border-border/60 bg-card hover:bg-muted/60 text-left text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Server className="size-3.5 text-primary" />
              <span className="font-semibold text-foreground">Internal Platform Issues</span>
            </div>
            <ChevronRight className="size-3 text-muted-foreground" />
          </button>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => onNavigate("/tasks")}
            className="w-full h-8 text-xs font-medium"
          >
            Open Full Kanban Board &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
