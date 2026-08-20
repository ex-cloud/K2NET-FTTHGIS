import React from "react";
import { Circle, Timer, Clock, CheckCircle2 } from "lucide-react";

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

import { type KanbanColumn } from "@k2net/ui";

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "BACKLOG", title: "Backlog" },
  { id: "TODO", title: "Todo" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "WAITING_ON_CLIENT", title: "Waiting" },
  { id: "RESOLVED", title: "Resolved" },
  { id: "CLOSED", title: "Closed" },
];
