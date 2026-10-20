import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { MapPin, Loader2 } from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  EmptyState,
} from "@k2net/ui";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { useTranslation } from "@k2net/i18n";

interface DispatchedTask {
  id: string;
  title: string;
  status: string;
  assigneeId?: string;
  referenceType?: string;
  referenceId?: string;
}

export function DispatcherPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "";

  const { data: dispatchData, isLoading } = useQuery<{ content: DispatchedTask[] } | DispatchedTask[]>({
    queryKey: ["project-dispatch", _projectId],
    queryFn: async () => {
      try {
        return await apiClient<{ content: DispatchedTask[] } | DispatchedTask[]>(
          "/api/v1/tasks?size=20&status=IN_PROGRESS"
        );
      } catch (err) {
        console.warn("Failed to fetch dispatched tasks:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const activeTasks: DispatchedTask[] = React.useMemo(() => {
    if (!dispatchData) return [];
    if (Array.isArray(dispatchData)) return dispatchData;
    if (Array.isArray(dispatchData.content)) return dispatchData.content;
    return [];
  }, [dispatchData]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("issues.dispatcher_title")}
        subtitle={t("issues.dispatcher_subtitle")}
        icon={MapPin}
      />

      {isLoading ? (
        <Card className="border-border/60 p-8 flex items-center justify-center text-muted-foreground shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          <span className="text-xs">{t("common.loading", { defaultValue: "Loading..." })}</span>
        </Card>
      ) : activeTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTasks.map((task) => (
            <Card key={task.id} className="p-4 border-border/60 bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {(task.assigneeId || "FD").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {task.assigneeId || t("issues.assigned_technician")}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Ref: {task.referenceId || task.referenceType || task.id}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {task.status}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 space-y-1 text-xs">
                <span className="text-muted-foreground block text-[10px]">
                  {t("issues.active_task", { defaultValue: "Active Task:" })}
                </span>
                <span className="font-semibold text-foreground">{task.title}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MapPin className="h-6 w-6 text-muted-foreground" />}
          title={t("issues.active_technicians")}
          description={t("issues.dispatcher_subtitle")}
        />
      )}
    </PageLayout>
  );
}
