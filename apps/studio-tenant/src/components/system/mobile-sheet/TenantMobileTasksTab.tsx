import * as React from "react";
import { MessageSquare, BellOff, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { useTranslation } from "@k2net/i18n";

interface AlertTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  createdAt?: string;
}

interface TenantMobileTasksTabProps {
  onNavigate: (href: string) => void;
  onClose: () => void;
  projectId?: string;
}

export function TenantMobileTasksTab({
  onNavigate,
  onClose,
  projectId,
}: TenantMobileTasksTabProps) {
  const { t } = useTranslation();

  const { data: taskData, isLoading } = useQuery<{ content: AlertTask[] } | AlertTask[]>({
    queryKey: ["mobile-tasks", projectId],
    queryFn: async () => {
      try {
        return await apiClient<{ content: AlertTask[] } | AlertTask[]>(
          "/api/v1/tasks?size=5&status=IN_PROGRESS"
        );
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const alerts: AlertTask[] = React.useMemo(() => {
    if (!taskData) return [];
    if (Array.isArray(taskData)) return taskData;
    if (Array.isArray(taskData.content)) return taskData.content;
    return [];
  }, [taskData]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">
            {t("tasks.operational_notifications", { defaultValue: "Operational Notifications" })}
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {alerts.length} {t("common.active", { defaultValue: "Active" })}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground text-xs gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>{t("common.loading", { defaultValue: "Loading..." })}</span>
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(projectId ? `/project/${projectId}/issues/tickets` : "/projects");
                onClose();
              }}
              className="flex flex-col text-left w-full p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-primary truncate max-w-[140px]">{item.id}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                  {item.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight">{item.title}</p>
              {item.description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
              )}
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
            <BellOff className="size-8 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">{t("common.no_results")}</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              {t("tasks.no_active_alerts", { defaultValue: "No active operational alerts for this workspace." })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
