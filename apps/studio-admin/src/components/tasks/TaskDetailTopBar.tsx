import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { ScopeBadge } from "./ScopeBadge";
import type { Task } from "@/hooks/useTasksQuery";

interface TaskDetailTopBarProps {
  task: Task;
  saving: boolean;
  isDirty: boolean;
}

export function TaskDetailTopBar({ task, saving, isDirty }: TaskDetailTopBarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [parentPlanTitle, setParentPlanTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!task.parentTaskId || !session?.accessToken) {
      setParentPlanTitle(null);
      return;
    }
    let isMounted = true;
    const baseUrl = getBackendBaseUrl();
    httpClient(`${baseUrl}/tasks/${task.parentTaskId}`, {
      token: session.accessToken as string,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setParentPlanTitle(data.title || data.obsidianRef || null);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [task.parentTaskId, session?.accessToken]);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-2 text-xs">
        {task.parentTaskId ? (
          <>
            <button
              onClick={() => router.push("/workspace/plans")}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </button>
            <span className="text-muted-foreground/50">›</span>
            <button
              onClick={() => router.push(`/workspace/plans/${task.parentTaskId}`)}
              className="text-foreground/80 hover:text-primary font-medium transition-colors cursor-pointer truncate max-w-[200px]"
              title={parentPlanTitle || task.obsidianRef || "Parent Plan"}
            >
              {parentPlanTitle || task.obsidianRef || "Parent Plan"}
            </button>
            <span className="text-muted-foreground/50">›</span>
            <span className="font-semibold text-foreground truncate max-w-[240px]">
              {task.title}
            </span>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                if (task.type === "PROJECT") router.push("/workspace/plans");
                else if (task.scope === "TENANT_TO_PLATFORM") router.push("/support/tickets");
                else router.push("/workspace/issues");
              }}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>
                {task.type === "PROJECT"
                  ? "Plans & Specs"
                  : task.scope === "TENANT_TO_PLATFORM"
                    ? "Support Tickets"
                    : "Issues & Tasks"}
              </span>
            </button>
            <span className="text-muted-foreground/50">›</span>
            {task.obsidianRef ? (
              <span className="text-foreground/80 font-medium font-mono">
                {task.obsidianRef}
              </span>
            ) : (
              <span className="text-foreground/80 font-medium">
                {task.scope === "PLATFORM_INTERNAL" ? "Internal K2NET" : "B2B Mitra"}
              </span>
            )}
            <span className="text-muted-foreground/50">›</span>
            <span className="font-semibold text-foreground truncate max-w-[220px]">
              {task.title}
            </span>
          </>
        )}
      </div>


      <div className="flex items-center gap-2">
        <ScopeBadge scope={task.scope} />
        {saving && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving...
          </span>
        )}
        {isDirty && !saving && (
          <span className="text-amber-500 text-[10px]">● Unsaved</span>
        )}
        {task.obsidianRef && (
          <a
            href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${task.obsidianRef}`}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 px-2 py-1 rounded-md transition-colors"
            title="Open in Obsidian"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Obsidian
          </a>
        )}
      </div>
    </div>
  );
}
