import { useRef } from "react";
import {
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  UserCheck,
  FileEdit,
  Sparkles,
  GitCommit,
  CornerUpLeft,
} from "lucide-react";
import { Card, TracingBeam } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type TaskComment } from "@/hooks/useTasksQuery";
import { type TeamUser } from "@/hooks/useTeamUsers";
import { useSession } from "@/lib/auth-compat";
import { cn } from "@/lib/utils";

interface ProjectActivityTabProps {
  updateText: string;
  setUpdateText: (text: string) => void;
  postingUpdate: boolean;
  comments: TaskComment[];
  teamUsers?: TeamUser[];
  onPostUpdate: (customContent?: string) => Promise<void>;
}

type HealthOption = "On track" | "At risk" | "Off track";

interface ParsedComment {
  isStatusUpdate: boolean;
  isSystemEvent: boolean;
  systemAction?: string;
  systemDetail?: string;
  health: HealthOption | null;
  progress: string | null;
  body: string;
}

function parseCommentContent(content: string): ParsedComment {
  const statusMatch = content.match(/^\[STATUS_UPDATE:\s*([^|]+)\s*\|\s*([^\]]+)\]\s*(.*)$/s);
  if (statusMatch) {
    return {
      isStatusUpdate: true,
      isSystemEvent: false,
      health: statusMatch[1].trim() as HealthOption,
      progress: statusMatch[2].trim(),
      body: statusMatch[3].trim(),
    };
  }

  const systemMatch = content.match(/^\[SYSTEM_EVENT:\s*([^|]+)\s*\|\s*([^\]]+)\]$/s);
  if (systemMatch) {
    return {
      isStatusUpdate: false,
      isSystemEvent: true,
      systemAction: systemMatch[1].trim(),
      systemDetail: systemMatch[2].trim(),
      health: null,
      progress: null,
      body: "",
    };
  }

  return {
    isStatusUpdate: false,
    isSystemEvent: false,
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

function AuditTrailFeedItem({
  comment,
  parsed,
  author,
}: {
  comment: TaskComment;
  parsed: ParsedComment;
  author: { name: string; initials: string };
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/25 border border-border/40 text-[11px] text-muted-foreground shadow-2xs hover:border-border/70 transition-colors">
      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {parsed.systemAction === "STATUS_CHANGE" && <CheckCircle2 className="w-3 h-3 text-primary" />}
        {parsed.systemAction === "PRIORITY_CHANGE" && <AlertTriangle className="w-3 h-3 text-amber-500" />}
        {parsed.systemAction === "LEAD_CHANGE" && <UserCheck className="w-3 h-3 text-blue-400" />}
        {parsed.systemAction === "SPEC_UPDATED" && <FileEdit className="w-3 h-3 text-purple-400" />}
        {parsed.systemAction === "DOC_CREATED" && <Sparkles className="w-3 h-3 text-primary" />}
        {!["STATUS_CHANGE", "PRIORITY_CHANGE", "LEAD_CHANGE", "SPEC_UPDATED", "DOC_CREATED"].includes(
          parsed.systemAction || ""
        ) && <GitCommit className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-foreground">{author.name}</span>
        <span>
          {parsed.systemAction === "STATUS_CHANGE"
            ? t("workspace.activity_event_status_changed", { detail: parsed.systemDetail || "" })
            : parsed.systemAction === "PRIORITY_CHANGE"
            ? t("workspace.activity_event_priority_changed", { detail: parsed.systemDetail || "" })
            : parsed.systemAction === "LEAD_CHANGE"
            ? t("workspace.activity_event_lead_changed", { detail: parsed.systemDetail || "" })
            : parsed.systemAction === "SPEC_UPDATED"
            ? t("workspace.activity_event_spec_updated")
            : parsed.systemAction === "DOC_CREATED"
            ? t("workspace.activity_event_doc_created")
            : parsed.systemDetail || ""}
        </span>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
        {new Date(comment.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

function CommentCardItem({
  comment,
  parsed,
  author,
  onReply,
}: {
  comment: TaskComment;
  parsed: ParsedComment;
  author: { name: string; initials: string };
  onReply: (authorName: string, bodyText: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card/40 border border-border/50 text-xs shadow-2xs hover:border-border/80 transition-colors">
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
            {new Date(comment.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap space-y-1">
          {parsed.body.split("\n").map((line, lIdx) => {
            if (line.startsWith(">")) {
              return (
                <div
                  key={lIdx}
                  className="border-l-2 border-primary/50 pl-2 py-0.5 text-muted-foreground italic bg-muted/20 rounded-r text-[11px]"
                >
                  {line.replace(/^>\s*/, "")}
                </div>
              );
            }
            return <div key={lIdx}>{line}</div>;
          })}
        </div>
        <div className="pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={() => onReply(author.name, parsed.body)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group"
          >
            <CornerUpLeft className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>{t("workspace.activity_reply")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectActivityTab({
  updateText,
  setUpdateText,
  postingUpdate,
  comments,
  teamUsers,
  onPostUpdate,
}: ProjectActivityTabProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!updateText.trim()) return;
    await onPostUpdate(updateText.trim());
  };

  const handleReply = (authorName: string, bodyText: string) => {
    const cleanSnippet = bodyText
      .split("\n")
      .filter((l) => !l.startsWith(">"))
      .join(" ")
      .trim()
      .substring(0, 80);
    const quote = `> @${authorName}: "${cleanSnippet}"\n\n`;
    setUpdateText(quote);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  return (
    <TracingBeam className="pl-4 md:pl-10">
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        {/* ── 1. Composer Card ─────────────────────────────────────────── */}
        <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                {t("workspace.activity_comment_mode")}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {t("workspace.activity_comment_desc")}
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t("workspace.activity_comment_placeholder")}
            className="w-full min-h-[90px] text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <span className="text-[11px] text-muted-foreground/75">
              {t("workspace.activity_send_shortcut")}
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!updateText.trim() || postingUpdate}
              className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {postingUpdate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5" />
              )}
              <span>{t("workspace.activity_post_comment")}</span>
            </button>
          </div>
        </Card>

        {/* ── 2. Timeline History Feed ─────────────────────────────────── */}
        <div className="space-y-3 pt-2">
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

              if (parsed.isSystemEvent) {
                return (
                  <AuditTrailFeedItem
                    key={c.id || idx}
                    comment={c}
                    parsed={parsed}
                    author={author}
                  />
                );
              }

              return (
                <CommentCardItem
                  key={c.id || idx}
                  comment={c}
                  parsed={parsed}
                  author={author}
                  onReply={handleReply}
                />
              );
            })
          )}
        </div>
      </div>
    </TracingBeam>
  );
}
