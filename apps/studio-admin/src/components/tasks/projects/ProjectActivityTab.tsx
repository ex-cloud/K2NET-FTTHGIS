import { useState, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  CornerDownRight,
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
  replyToId?: string;
  replyToAuthor?: string;
  legacyQuoteSnippet?: string;
  body: string;
}

interface EnrichedCommentNode {
  comment: TaskComment;
  parsed: ParsedComment;
  author: { name: string; initials: string };
  replies: EnrichedCommentNode[];
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

  const replyMatch = content.match(/^\[REPLY_TO:([^|\]]+)(?:\|@([^\]]+))?\]\s*(.*)$/s);
  if (replyMatch) {
    return {
      isStatusUpdate: false,
      isSystemEvent: false,
      health: null,
      progress: null,
      replyToId: replyMatch[1].trim(),
      replyToAuthor: replyMatch[2]?.trim(),
      body: replyMatch[3].trim(),
    };
  }

  const legacyQuoteMatch = content.match(/^>\s*@([^:]+):\s*"([^"]*)"\s*\n+(.*)$/s);
  if (legacyQuoteMatch) {
    return {
      isStatusUpdate: false,
      isSystemEvent: false,
      health: null,
      progress: null,
      replyToAuthor: legacyQuoteMatch[1].trim(),
      legacyQuoteSnippet: legacyQuoteMatch[2].trim(),
      body: legacyQuoteMatch[3].trim(),
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

function buildTimelineTree(
  comments: TaskComment[],
  teamUsers?: TeamUser[],
  sessionUser?: { id?: string; email?: string; name?: string; username?: string }
): EnrichedCommentNode[] {
  const rootEntries: EnrichedCommentNode[] = [];
  const commentToRootMap = new Map<string, EnrichedCommentNode>();
  const allNonSystemNodes: EnrichedCommentNode[] = [];

  for (const c of comments) {
    const parsed = parseCommentContent(c.content);
    const author = getAuthorDisplay(c.authorId, teamUsers, sessionUser);
    const node: EnrichedCommentNode = {
      comment: c,
      parsed,
      author,
      replies: [],
    };

    if (parsed.isSystemEvent) {
      rootEntries.push(node);
      continue;
    }

    let parentRoot: EnrichedCommentNode | undefined;

    if (parsed.replyToId) {
      parentRoot = commentToRootMap.get(parsed.replyToId);
    } else if (parsed.legacyQuoteSnippet) {
      const snippet = parsed.legacyQuoteSnippet.toLowerCase();
      for (let i = allNonSystemNodes.length - 1; i >= 0; i--) {
        const candidate = allNonSystemNodes[i];
        const candidateClean = candidate.parsed.body.trim().toLowerCase();
        if (snippet && candidateClean.startsWith(snippet)) {
          parentRoot = commentToRootMap.get(candidate.comment.id) ?? candidate;
          break;
        }
      }
    }

    if (parentRoot) {
      parentRoot.replies.push(node);
      if (c.id) commentToRootMap.set(c.id, parentRoot);
    } else {
      rootEntries.push(node);
      if (c.id) commentToRootMap.set(c.id, node);
    }

    allNonSystemNodes.push(node);
  }

  return rootEntries;
}

function formatCommentTimestamp(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AuditTrailFeedItem({ node }: { node: EnrichedCommentNode }) {
  const { t } = useTranslation();
  const { comment, parsed, author } = node;
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
        {formatCommentTimestamp(comment.createdAt)}
      </span>
    </div>
  );
}

function SubtreeReplyItem({
  replyNode,
  onReplyClick,
}: {
  replyNode: EnrichedCommentNode;
  onReplyClick: (targetAuthor: string) => void;
}) {
  const { t } = useTranslation();
  const { comment, parsed, author } = replyNode;

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-border/40 text-xs hover:border-border/70 transition-colors">
      <div className="w-6 h-6 rounded-full bg-muted text-foreground font-bold flex items-center justify-center shrink-0 mt-0.5 text-[9px] border border-border/60">
        {author.initials}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground text-[11px]">@{author.name}</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatCommentTimestamp(comment.createdAt)}
          </span>
        </div>
        <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-xs">
          {parsed.replyToAuthor && (
            <span className="inline-block font-semibold text-foreground bg-muted/80 px-1.5 py-0.2 rounded text-[11px] mr-1.5">
              @{parsed.replyToAuthor}
            </span>
          )}
          <span>{parsed.body}</span>
        </div>
        <div className="pt-0.5 flex items-center">
          <button
            type="button"
            onClick={() => onReplyClick(author.name)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
          >
            <CornerUpLeft className="w-3 h-3" />
            <span>{t("workspace.activity_reply")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentThreadItem({
  node,
  postingUpdate,
  onPostReply,
}: {
  node: EnrichedCommentNode;
  postingUpdate: boolean;
  onPostReply: (rootId: string, targetAuthor: string, text: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const { comment, parsed, author, replies } = node;
  const [isExpanded, setIsExpanded] = useState(true);
  const [replyTargetAuthor, setReplyTargetAuthor] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const handleOpenReply = (targetAuthor: string) => {
    setReplyTargetAuthor(targetAuthor);
    setIsExpanded(true);
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 30);
  };

  const handleSendReply = async () => {
    if (!replyDraft.trim() || !replyTargetAuthor) return;
    await onPostReply(comment.id, replyTargetAuthor, replyDraft.trim());
    setReplyDraft("");
    setReplyTargetAuthor(null);
  };

  return (
    <div className="space-y-1.5">
      {/* ── Komentar Induk (Parent Comment) ─────────────────────────────── */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card/40 border border-border/50 text-xs shadow-2xs hover:border-border/80 transition-colors">
        <div className="w-7 h-7 rounded-full bg-muted text-foreground font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px] border border-border/60 shadow-2xs">
          {author.initials}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">@{author.name}</span>
              {parsed.isStatusUpdate ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
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
              {formatCommentTimestamp(comment.createdAt)}
            </span>
          </div>

          <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {parsed.body}
          </div>

          {/* ── Action Row: Reply & Subtree Toggle (YouTube Style) ──────── */}
          <div className="pt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleOpenReply(author.name)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              <CornerUpLeft className="w-3 h-3" />
              <span>{t("workspace.activity_reply")}</span>
            </button>

            {replies.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground hover:bg-muted/60 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>{t("workspace.activity_hide_replies")} ({replies.length})</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>{t("workspace.activity_replies_count", { count: replies.length })}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Subtree Thread Container (Nested Replies + Inline Reply Composer) ── */}
      {((replies.length > 0 && isExpanded) || replyTargetAuthor) && (
        <div className="ml-4 pl-4 border-l-2 border-border/60 space-y-2 pt-1">
          {isExpanded &&
            replies.map((replyNode, rIdx) => (
              <SubtreeReplyItem
                key={replyNode.comment.id || rIdx}
                replyNode={replyNode}
                onReplyClick={handleOpenReply}
              />
            ))}

          {replyTargetAuthor && (
            <div className="p-3 rounded-lg bg-card/60 border border-border/70 space-y-2 shadow-2xs animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <CornerDownRight className="w-3 h-3 text-muted-foreground" />
                  <span>{t("workspace.activity_replying_to", { name: replyTargetAuthor })}</span>
                </span>
              </div>
              <textarea
                ref={replyInputRef}
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSendReply();
                  }
                  if (e.key === "Escape") {
                    setReplyTargetAuthor(null);
                  }
                }}
                rows={2}
                placeholder={t("workspace.activity_reply_placeholder", { name: replyTargetAuthor })}
                className="w-full text-xs bg-muted/20 border border-border/60 rounded-md p-2 outline-none text-foreground placeholder:text-muted-foreground/50 focus:border-border resize-none leading-relaxed"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyTargetAuthor(null);
                    setReplyDraft("");
                  }}
                  className="px-2.5 h-6 text-[11px] font-medium rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={!replyDraft.trim() || postingUpdate}
                  className="inline-flex items-center gap-1 px-2.5 h-6 text-[11px] font-medium rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {postingUpdate && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{t("workspace.activity_reply")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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

  const handlePostReply = async (rootId: string, targetAuthor: string, text: string) => {
    const formatted = `[REPLY_TO:${rootId}|@${targetAuthor}] ${text}`;
    await onPostUpdate(formatted);
  };

  const timelineTree = buildTimelineTree(comments, teamUsers, session?.user);

  return (
    <TracingBeam className="pl-4 md:pl-10">
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        {/* ── 1. Root Comment Composer Card ────────────────────────────── */}
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

        {/* ── 2. Timeline History Feed (Threaded Subtree) ──────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("workspace.activity_timeline_history")}
            </h4>
            <span className="text-[11px] font-mono text-muted-foreground">
              {t("workspace.activity_entries_count", { count: comments.length })}
            </span>
          </div>

          {timelineTree.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {t("workspace.activity_no_entries")}
            </p>
          ) : (
            timelineTree.map((node, idx) => {
              if (node.parsed.isSystemEvent) {
                return <AuditTrailFeedItem key={node.comment.id || idx} node={node} />;
              }

              return (
                <CommentThreadItem
                  key={node.comment.id || idx}
                  node={node}
                  postingUpdate={postingUpdate}
                  onPostReply={handlePostReply}
                />
              );
            })
          )}
        </div>
      </div>
    </TracingBeam>
  );
}
