import type React from "react";
import { Circle, Timer, Clock, CheckCircle2, Bug, Sparkles, Zap, CheckSquare } from "lucide-react";
import { type KanbanColumn } from "@k2net/ui";

export const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  BACKLOG: { label: "Backlog", icon: Circle, className: "text-muted-foreground bg-muted" },
  TODO: { label: "Todo", icon: Circle, className: "text-foreground bg-muted" },
  IN_PROGRESS: { label: "In Progress", icon: Timer, className: "text-primary bg-primary/10" },
  WAITING_ON_CLIENT: { label: "Waiting", icon: Clock, className: "text-amber-500 bg-amber-500/10" },
  RESOLVED: { label: "Resolved", icon: CheckCircle2, className: "text-green-500 bg-green-500/10" },
  CLOSED: { label: "Closed", icon: CheckCircle2, className: "text-muted-foreground bg-muted" },
};

export const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  URGENT: { label: "URGENT", className: "text-destructive bg-destructive/10" },
  HIGH: { label: "HIGH", className: "text-orange-500 bg-orange-500/10" },
  NORMAL: { label: "NORMAL", className: "text-foreground bg-muted" },
  LOW: { label: "LOW", className: "text-muted-foreground bg-muted" },
};

export type IssueSubtype = "TASK" | "BUG" | "FEATURE" | "IMPROVEMENT";

export interface SubtypeConfig {
  key: IssueSubtype;
  label: string;
  icon: React.ElementType;
  className: string;
  badgeClass: string;
  i18nKey: string;
}

export const ISSUE_SUBTYPES: Record<IssueSubtype, SubtypeConfig> = {
  TASK: {
    key: "TASK",
    label: "Task",
    icon: CheckSquare,
    className: "text-foreground",
    badgeClass: "text-muted-foreground bg-muted/60 border-border/40",
    i18nKey: "workspace.subtype_task",
  },
  BUG: {
    key: "BUG",
    label: "Bug",
    icon: Bug,
    className: "text-destructive",
    badgeClass: "text-destructive bg-destructive/10 border-destructive/20",
    i18nKey: "workspace.subtype_bug",
  },
  FEATURE: {
    key: "FEATURE",
    label: "Feature",
    icon: Sparkles,
    className: "text-purple-400",
    badgeClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    i18nKey: "workspace.subtype_feature",
  },
  IMPROVEMENT: {
    key: "IMPROVEMENT",
    label: "Improvement",
    icon: Zap,
    className: "text-blue-400",
    badgeClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    i18nKey: "workspace.subtype_improvement",
  },
};

export function getIssueSubtypeConfig(subtype?: string): SubtypeConfig {
  const normalized = (subtype?.toUpperCase() || "TASK") as IssueSubtype;
  return ISSUE_SUBTYPES[normalized] ?? ISSUE_SUBTYPES.TASK;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "BACKLOG", title: "Backlog" },
  { id: "TODO", title: "Todo" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "WAITING_ON_CLIENT", title: "Waiting" },
  { id: "RESOLVED", title: "Resolved" },
  { id: "CLOSED", title: "Closed" },
];
