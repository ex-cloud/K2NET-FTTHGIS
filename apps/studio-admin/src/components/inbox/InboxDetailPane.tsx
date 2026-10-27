import * as React from "react";
import {
  Inbox,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  CreditCard,
  Receipt,
  ChevronDown,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Link } from "@/lib/navigation-compat";
import { TaskCommentsSection } from "@/components/tasks/TaskCommentsSection";
import type { TaskComment } from "@/hooks/useTasksQuery";
import {
  type InboxQueueItem,
  formatRelativeTime,
} from "./inbox-types";

// ── Subcomponent 1: Contextual Action Buttons ────────────────────────────────

interface DetailToolbarActionsProps {
  selectedItem: InboxQueueItem;
  onUpdateTaskStatus?: (taskId: string, status: string) => Promise<void>;
  onUpdateTaskPriority?: (taskId: string, priority: string) => Promise<void>;
  onResolveAndNext?: (taskId: string) => Promise<void>;
}

function DetailToolbarActions({
  selectedItem,
  onUpdateTaskStatus,
  onUpdateTaskPriority,
  onResolveAndNext,
}: DetailToolbarActionsProps) {
  const { t } = useTranslation();
  const raw = selectedItem.rawItem;

  if (raw.type === "TRIAL") {
    return (
      <div className="flex items-center gap-2">
        <Link href={`/organizations/${raw.data.slug || raw.data.id || ""}`}>
          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 font-medium">
            <ExternalLink className="size-3 mr-1.5" />
            {t("common.inbox_action_inspect_tenants")}
          </Button>
        </Link>
        <Link href="/billing/subscriptions">
          <Button size="sm" className="h-7 text-xs px-2.5 font-medium">
            <CreditCard className="size-3 mr-1.5" />
            {t("common.inbox_action_review_sub")}
          </Button>
        </Link>
      </div>
    );
  }

  if (raw.type === "LICENSE") {
    return (
      <div className="flex items-center gap-2">
        <Link href="/licensing/licenses">
          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 font-medium">
            <KeyRound className="size-3 mr-1.5" />
            {t("common.inbox_action_manage_lic")}
          </Button>
        </Link>
        <Link href="/billing/invoices">
          <Button size="sm" className="h-7 text-xs px-2.5 font-medium">
            <Receipt className="size-3 mr-1.5" />
            {t("common.inbox_action_view_invoices")}
          </Button>
        </Link>
      </div>
    );
  }

  if (raw.type === "APPROVAL_SESSION" || raw.type === "APPROVAL_STATS") {
    return (
      <Link href="/organizations/impersonation">
        <Button size="sm" className="h-7 text-xs px-2.5 font-medium">
          <ShieldAlert className="size-3 mr-1.5" />
          {t("common.inbox_action_authorize")}
        </Button>
      </Link>
    );
  }

  const isResolvable = selectedItem.status !== "RESOLVED" && selectedItem.status !== "CLOSED";

  return (
    <div className="flex items-center gap-2">
      {/* Resolve & Next Quick Action Button */}
      {isResolvable && onResolveAndNext && (
        <Button
          size="sm"
          onClick={() => onResolveAndNext(selectedItem.id)}
          className="h-7 text-xs px-2.5 font-medium bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
        >
          <CheckCircle className="size-3 mr-1.5" />
          <span>{t("common.inbox_action_resolve_next")}</span>
          <kbd className="ml-1.5 px-1 py-0.2 rounded bg-background/20 text-[10px] font-mono select-none">
            ⌘↵
          </kbd>
        </Button>
      )}

      {onUpdateTaskStatus && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 font-medium">
              <span>{selectedItem.status}</span>
              <ChevronDown className="size-3 ml-1 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => onUpdateTaskStatus(selectedItem.id, "TODO")}>
              TODO
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateTaskStatus(selectedItem.id, "IN_PROGRESS")}>
              IN_PROGRESS
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateTaskStatus(selectedItem.id, "RESOLVED")}>
              RESOLVED
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateTaskStatus(selectedItem.id, "CLOSED")}>
              CLOSED
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {onUpdateTaskPriority && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 font-medium font-mono">
              <span>{selectedItem.priority}</span>
              <ChevronDown className="size-3 ml-1 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => onUpdateTaskPriority(selectedItem.id, "LOW")}>
              LOW
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateTaskPriority(selectedItem.id, "MEDIUM")}>
              MEDIUM
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateTaskPriority(selectedItem.id, "HIGH")}>
              HIGH
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateTaskPriority(selectedItem.id, "URGENT")}>
              URGENT
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Link href={selectedItem.category === "B2B_TICKET" ? "/support/tickets" : "/workspace/issues"}>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 font-medium">
          <ExternalLink className="size-3 mr-1.5" />
          {t("common.inbox_action_open_full")}
        </Button>
      </Link>
    </div>
  );
}

// ── Subcomponent 2: Context Card Derived from Real DTO ───────────────────────

function CategoryContextCard({ selectedItem }: { selectedItem: InboxQueueItem }) {
  const { t } = useTranslation();
  const raw = selectedItem.rawItem;

  if (raw.type === "TRIAL") {
    return (
      <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
          {t("common.inbox_trial_summary_title")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_trial_plan_label")}</span>
            <span className="font-semibold text-foreground">
              {raw.data.subscriptionPlan?.name || raw.data.plan || "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_trial_quotas")}</span>
            <span className="font-mono font-medium text-foreground">
              {raw.data.subscriptionPlan
                ? `${raw.data.subscriptionPlan.maxProjects ?? 0} Projects · ${raw.data.subscriptionPlan.maxOdps ?? 0} ODPs`
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_trial_realm")}</span>
            <span className="font-mono text-primary font-medium">
              {raw.data.slug ? `tenant_${raw.data.slug}` : "—"}
            </span>
          </div>
        </div>
        {raw.data.adminEmail && (
          <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t("common.inbox_trial_admin_label")}:</span> {raw.data.adminEmail}
            {raw.data.adminUsername && ` (${raw.data.adminUsername})`}
          </div>
        )}
      </div>
    );
  }

  if (raw.type === "LICENSE") {
    return (
      <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
          {t("common.inbox_license_summary_title")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_license_grace_count")}</span>
            <span className="font-mono text-destructive font-semibold">
              {raw.data.gracePeriodLicenses ?? 0}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_license_suspended_count")}</span>
            <span className="font-mono text-destructive font-semibold">
              {raw.data.suspendedLicenses ?? 0}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_license_active_count")}</span>
            <span className="font-mono text-foreground font-semibold">
              {raw.data.activeLicenses ?? 0} / {raw.data.totalLicenses ?? 0}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (raw.type === "APPROVAL_SESSION") {
    return (
      <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
          {t("common.inbox_action_authorize")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_impersonation_target")}</span>
            <span className="font-semibold text-foreground">{raw.data.targetOrgName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_impersonation_duration")}</span>
            <span className="font-mono text-foreground font-semibold">
              {Math.max(0, Math.floor(raw.data.remainingSeconds / 60))}m
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_impersonation_reason")}</span>
            <span className="text-foreground">{raw.data.reason}</span>
          </div>
        </div>
      </div>
    );
  }

  if (raw.type === "APPROVAL_STATS") {
    return (
      <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
          {t("common.inbox_action_authorize")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_elevations_active")}</span>
            <span className="font-mono text-foreground font-semibold">{raw.data.activeCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_elevations_today")}</span>
            <span className="font-mono text-foreground">{raw.data.todayCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("common.inbox_elevations_7d")}</span>
            <span className="font-mono text-foreground">{raw.data.total7dCount}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Main Component: InboxDetailPane ──────────────────────────────────────────

interface InboxDetailPaneProps {
  selectedItem: InboxQueueItem | null;
  onUpdateTaskStatus?: (taskId: string, status: string) => Promise<void>;
  onUpdateTaskPriority?: (taskId: string, priority: string) => Promise<void>;
  onResolveAndNext?: (taskId: string) => Promise<void>;
  onCommentAdded?: (comment: TaskComment) => void;
  onBackToQueue?: () => void;
}

export function InboxDetailPane({
  selectedItem,
  onUpdateTaskStatus,
  onUpdateTaskPriority,
  onResolveAndNext,
  onCommentAdded,
  onBackToQueue,
}: InboxDetailPaneProps) {
  const { t } = useTranslation();

  if (!selectedItem) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center space-y-3 bg-background/50">
        <div className="w-12 h-12 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground">
          <Inbox className="size-6 stroke-1" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {t("common.inbox_select_item_title")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          {t("common.inbox_select_item_desc")}
        </p>
      </div>
    );
  }

  const isTask = selectedItem.rawItem.type === "TASK";

  return (
    <div className="flex-1 h-full flex flex-col bg-background/50 overflow-hidden relative">
      {/* Top Action Toolbar */}
      <div className="h-12 border-b border-border/60 px-4 md:px-6 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          {/* Mobile Back Button */}
          {onBackToQueue && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onBackToQueue}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground lg:hidden cursor-pointer"
              title={t("common.inbox_back_to_queue")}
            >
              <ArrowLeft className="size-3.5 mr-1" />
              <span>{t("common.inbox_back_to_queue")}</span>
            </Button>
          )}

          <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5 font-semibold">
            {selectedItem.code}
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {selectedItem.status}
          </Badge>
        </div>

        <DetailToolbarActions
          selectedItem={selectedItem}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onUpdateTaskPriority={onUpdateTaskPriority}
          onResolveAndNext={onResolveAndNext}
        />
      </div>

      {/* Scrollable Detail Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar-thin">
        {/* Header Title Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground font-mono">
              {selectedItem.subtitle}
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {selectedItem.title}
          </h1>
        </div>

        {/* Metadata Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-card/40 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              {t("common.inbox_meta_requester")}
            </span>
            <span className="text-xs font-semibold text-foreground truncate block">
              {selectedItem.requesterName || "—"}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-card/40 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              {t("common.inbox_meta_org")}
            </span>
            <span className="text-xs font-semibold text-foreground truncate block">
              {selectedItem.organizationName || "—"}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-card/40 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              {t("common.inbox_meta_priority")}
            </span>
            <span className="text-xs font-mono font-semibold text-foreground block">
              {selectedItem.priority}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-card/40 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              {t("common.inbox_meta_created")}
            </span>
            <span className="text-xs font-mono text-muted-foreground block">
              {formatRelativeTime(selectedItem.createdAt, t)}
            </span>
          </div>
        </div>

        {/* Category-Specific Context Content from Real Backend DTO */}
        <CategoryContextCard selectedItem={selectedItem} />

        {/* Main Text Content */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
            {t("common.inbox_description_title")}
          </h4>
          <div className="p-4 rounded-xl border border-border/60 bg-card/20 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
            {selectedItem.description || t("common.inbox_no_description")}
          </div>
        </div>
      </div>

      {/* Quick Comment / Audit Note Box Bottom */}
      <div className="border-t border-border/60 p-4 bg-background shrink-0">
        {isTask ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
              {t("common.inbox_comments_title")}
            </h4>
            <TaskCommentsSection
              taskId={selectedItem.id}
              comments={selectedItem.rawItem.type === "TASK" ? selectedItem.rawItem.data.comments || [] : []}
              onCommentAdded={onCommentAdded || (() => {})}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
              {t("common.inbox_audit_notes_title")}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("common.inbox_audit_disclaimer")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
