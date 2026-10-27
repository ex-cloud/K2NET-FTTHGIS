import { useState } from "react";
import { TrendingUp, MessageSquare, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { Card, TracingBeam } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type TaskComment } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { useSession } from "@/lib/auth-compat";
import { cn } from "@/lib/utils";

interface ProjectActivityTabProps {
  updateMode: "update" | "comment";
  setUpdateMode: (mode: "update" | "comment") => void;
  updateText: string;
  setUpdateText: (text: string) => void;
  postingUpdate: boolean;
  progressPercent: number;
  comments: TaskComment[];
  teamUsers?: TeamUser[];
  onPostUpdate: (customContent?: string) => Promise<void>;
}

type HealthOption = "On track" | "At risk" | "Off track";

function parseCommentContent(content: string) {
  const match = content.match(/^\[STATUS_UPDATE:\s*([^|]+)\s*\|\s*([^\]]+)\]\s*(.*)$/s);
  if (match) {
    return {
      isStatusUpdate: true,
      health: match[1].trim() as HealthOption,
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

  // 1. Check in teamUsers
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

  // 2. Check if it matches session user
  if (
    sessionUser &&
    (sessionUser.id === authorId || sessionUser.email === authorId)
  ) {
    const name = sessionUser.name || sessionUser.username || "Super Admin";
    return { name, initials: name.substring(0, 2).toUpperCase() };
  }

  // 3. If it looks like a UUID (length >= 20 and contains hyphens)
  if (/^[0-9a-f-]{20,}$/i.test(authorId)) {
    return { name: "Super Admin", initials: "SA" };
  }

  // 4. If email
  if (authorId.includes("@")) {
    const name = authorId.split("@")[0];
    return { name, initials: name.substring(0, 2).toUpperCase() };
  }

  return { name: authorId, initials: authorId.substring(0, 2).toUpperCase() };
}

export function ProjectActivityTab({
  updateMode,
  setUpdateMode,
  updateText,
  setUpdateText,
  postingUpdate,
  progressPercent,
  comments,
  teamUsers,
  onPostUpdate,
}: ProjectActivityTabProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [healthStatus, setHealthStatus] = useState<HealthOption>("On track");

  const handleSubmit = async () => {
    if (!updateText.trim()) return;
    if (updateMode === "update") {
      const formatted = `[STATUS_UPDATE: ${healthStatus} | Progress: ${progressPercent}%]\n\n${updateText.trim()}`;
      await onPostUpdate(formatted);
    } else {
      await onPostUpdate(updateText.trim());
    }
  };

  return (
    <TracingBeam className="pl-4 md:pl-10">
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        {/* ── 1. Composer Card ─────────────────────────────────────────── */}
        <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between border-b border-border/40 pb-2.5 gap-2">
            <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/70">
              <button
                type="button"
                onClick={() => setUpdateMode("update")}
                className={cn(
                  "text-xs px-3 h-7 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  updateMode === "update"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("workspace.activity_update_desc")}
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span>{t("workspace.activity_update_mode")}</span>
              </button>
              <button
                type="button"
                onClick={() => setUpdateMode("comment")}
                className={cn(
                  "text-xs px-3 h-7 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  updateMode === "comment"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("workspace.activity_comment_desc")}
              >
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t("workspace.activity_comment_mode")}</span>
              </button>
            </div>

            {/* Health status pill selector in Update mode */}
            {updateMode === "update" && (
              <div className="flex items-center gap-1 bg-background/60 p-0.5 rounded-lg border border-border/40">
                {(["On track", "At risk", "Off track"] as const).map((h) => {
                  const isActive = healthStatus === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHealthStatus(h)}
                      className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1",
                        isActive
                          ? h === "On track"
                            ? "bg-primary/15 text-primary font-bold shadow-2xs"
                            : h === "At risk"
                            ? "bg-amber-500/15 text-amber-500 font-bold shadow-2xs"
                            : "bg-rose-500/15 text-rose-500 font-bold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                      )}
                    >
                      {h === "On track" && <TrendingUp className="w-3 h-3" />}
                      {h === "At risk" && <AlertTriangle className="w-3 h-3" />}
                      {h === "Off track" && <AlertCircle className="w-3 h-3" />}
                      <span>{h}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder={
              updateMode === "update"
                ? t("workspace.activity_update_placeholder")
                : t("workspace.activity_comment_placeholder")
            }
            className="w-full min-h-[90px] text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {updateMode === "update" ? (
                <span>
                  {t("workspace.activity_delivery_progress")}:{" "}
                  <strong className="text-foreground font-mono">{progressPercent}%</strong>
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/80">
                  {t("workspace.activity_comment_desc")}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!updateText.trim() || postingUpdate}
              className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {postingUpdate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : updateMode === "update" ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5" />
              )}
              <span>
                {updateMode === "update"
                  ? t("workspace.activity_post_update")
                  : t("workspace.activity_post_comment")}
              </span>
            </button>
          </div>
        </Card>

        {/* ── 2. Timeline History Feed ─────────────────────────────────── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("workspace.activity_timeline_history")}
            </h4>
            <span className="text-[11px] font-mono text-muted-foreground">
              {t("workspace.activity_entries_count", { count: comments.length })}
            </span>
          </div>

          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {t("workspace.activity_no_entries")}
            </p>
          ) : (
            comments.map((c, idx) => {
              const author = getAuthorDisplay(c.authorId, teamUsers, session?.user);
              const parsed = parseCommentContent(c.content);

              return (
                <div
                  key={c.id || idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-card/40 border border-border/50 text-xs shadow-2xs hover:border-border/80 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px] shadow-2xs">
                    {author.initials}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{author.name}</span>
                        {parsed.isStatusUpdate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            <TrendingUp className="w-3 h-3" />
                            <span>{t("workspace.badge_status_update")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                            <MessageSquare className="w-3 h-3" />
                            <span>{t("workspace.badge_comment")}</span>
                          </span>
                        )}
                        {parsed.health && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                              parsed.health === "On track"
                                ? "text-primary bg-primary/10"
                                : parsed.health === "At risk"
                                ? "text-amber-500 bg-amber-500/10"
                                : "text-rose-500 bg-rose-500/10"
                            )}
                          >
                            {parsed.health}
                          </span>
                        )}
                        {parsed.progress && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {parsed.progress}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {parsed.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TracingBeam>
  );
}
