import { TrendingUp, AlertTriangle, AlertCircle, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type Task, type TaskComment } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { useSession } from "@/lib/auth-compat";
import { cn } from "@/lib/utils";

interface ProjectOverviewSummaryCardProps {
  healthStatus: "On track" | "At risk" | "Off track";
  assigneeId: string | null;
  projectTask: Task;
  comments?: TaskComment[];
  teamUsers?: TeamUser[];
  onNavigateToActivity?: () => void;
}

function parseCommentContent(content: string) {
  const match = content.match(/^\[STATUS_UPDATE:\s*([^|]+)\s*\|\s*([^\]]+)\]\s*(.*)$/s);
  if (match) {
    return {
      isStatusUpdate: true,
      health: match[1].trim(),
      progress: match[2].trim(),
      body: match[3].trim(),
    };
  }
  return {
    isStatusUpdate: false,
    health: null,
    progress: null,
    body: content,
  };
}

function getAuthorDisplay(
  authorId?: string,
  teamUsers?: TeamUser[],
  sessionUser?: { id?: string; email?: string; name?: string; username?: string }
): { name: string; initials: string } {
  if (!authorId) return { name: "Super Admin", initials: "SA" };

  if (teamUsers && teamUsers.length > 0) {
    const found = teamUsers.find(
      (u) =>
        u.id === authorId ||
        (u.email && u.email.toLowerCase() === authorId.toLowerCase())
    );
    if (found) {
      const name = found.name || found.email.split("@")[0];
      const initials = (found.name || found.email).substring(0, 2).toUpperCase();
      return { name, initials };
    }
  }

  if (
    sessionUser &&
    (sessionUser.id === authorId || sessionUser.email === authorId)
  ) {
    const name = sessionUser.name || sessionUser.username || "Super Admin";
    return { name, initials: name.substring(0, 2).toUpperCase() };
  }

  if (/^[0-9a-f-]{20,}$/i.test(authorId)) {
    return { name: "Super Admin", initials: "SA" };
  }

  if (authorId.includes("@")) {
    const name = authorId.split("@")[0];
    return { name, initials: name.substring(0, 2).toUpperCase() };
  }

  return { name: authorId, initials: authorId.substring(0, 2).toUpperCase() };
}

export function ProjectOverviewSummaryCard({
  healthStatus,
  assigneeId: _assigneeId,
  projectTask,
  comments = [],
  teamUsers = [],
  onNavigateToActivity,
}: ProjectOverviewSummaryCardProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();

  // Find the latest status update comment, or the latest comment overall
  const allComments = comments.length > 0 ? comments : (projectTask.comments ?? []);
  const statusUpdates = allComments.filter((c) =>
    c.content.startsWith("[STATUS_UPDATE:")
  );
  const latestEntry =
    statusUpdates.length > 0
      ? statusUpdates[statusUpdates.length - 1]
      : allComments.length > 0
      ? allComments[allComments.length - 1]
      : null;

  const parsed = latestEntry ? parseCommentContent(latestEntry.content) : null;
  const author = latestEntry
    ? getAuthorDisplay(latestEntry.authorId, teamUsers, session?.user)
    : null;

  return (
    <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3 shadow-xs">
      {/* Card Header with Real Pulse Status */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>{t("workspace.summary_latest_update")}</span>
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
            healthStatus === "On track"
              ? "text-primary bg-primary/10"
              : healthStatus === "At risk"
              ? "text-amber-500 bg-amber-500/10"
              : "text-destructive bg-destructive/10"
          )}
        >
          {healthStatus === "On track" && <TrendingUp className="w-3 h-3" />}
          {healthStatus === "At risk" && <AlertTriangle className="w-3 h-3" />}
          {healthStatus === "Off track" && <AlertCircle className="w-3 h-3" />}
          <span>{healthStatus}</span>
        </span>
      </div>

      {latestEntry && parsed && author ? (
        <div className="space-y-2.5">
          {/* Real Author & Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
              {author.initials}
            </div>
            <span className="font-medium text-foreground">{author.name}</span>
            <span>·</span>
            <span className="font-mono text-[11px]">
              {new Date(latestEntry.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {parsed.isStatusUpdate && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded ml-auto">
                {t("workspace.badge_status_update")}
              </span>
            )}
          </div>

          {/* Real Content from Database */}
          <div className="text-xs text-foreground/90 leading-relaxed bg-background/60 p-3 rounded-lg border border-border/40 whitespace-pre-wrap font-sans">
            {parsed.body}
          </div>
        </div>
      ) : (
        /* Dynamic Empty State when no updates exist yet in DB */
        <div className="p-3 rounded-lg bg-background/40 border border-border/40 space-y-2 text-xs text-muted-foreground">
          <p className="leading-relaxed">
            {t("workspace.summary_no_updates")}
          </p>
          {onNavigateToActivity && (
            <button
              type="button"
              onClick={onNavigateToActivity}
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer pt-0.5"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{t("workspace.summary_write_update")}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
