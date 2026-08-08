"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout, Markdown } from "@k2net/ui";
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  User,
  MapPin,
  MessageSquare,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTasksQuery } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { task, loading, error } = useTasksQuery(id);

  if (error) {
    toast.error("Gagal memuat detail task");
  }

  if (loading) {
    return (
      <PageLayout variant="dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!task) return null;

  const isProject = task.type === "PROJECT";

  return (
    <PageLayout variant="dashboard">
      <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-6">

        {/* ── Breadcrumb ── */}
        <button
          onClick={() => router.push("/tasks")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Tasks & Tickets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {task.type}
                    </span>
                    {task.obsidianRef && (
                      <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {task.obsidianRef}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-md font-semibold shrink-0",
                    task.priority === "URGENT"
                      ? "text-destructive bg-destructive/10"
                      : task.priority === "HIGH"
                      ? "text-orange-500 bg-orange-500/10"
                      : "text-muted-foreground bg-muted"
                  )}
                >
                  {task.priority}
                </span>
              </div>

              {task.description ? (
                <Markdown content={task.description} />
              ) : (
                <p className="text-muted-foreground text-sm">Tidak ada deskripsi.</p>
              )}
            </div>

            {/* ── Comments Timeline ── */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Komentar & Aktivitas
              </h2>
              {!task.comments || task.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada komentar.</p>
              ) : (
                <div className="space-y-4">
                  {task.comments.map((c: import("@/hooks/useTasksQuery").TaskComment) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-foreground">{c.authorId}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 bg-muted rounded-lg px-3 py-2">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar metadata ── */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wide">
                Detail
              </h3>

              <MetaRow icon={CheckCircle2} label="Status" value={task.status} />
              <MetaRow icon={User} label="Assignee" value={task.assigneeId ?? "Belum ditugaskan"} />
              <MetaRow
                icon={Clock}
                label="Tenggat"
                value={task.dueDate ? new Date(task.dueDate).toLocaleDateString("id-ID") : "—"}
              />
              {task.referenceId && (
                <MetaRow icon={MapPin} label="Ref GIS" value={`${task.referenceType}: ${task.referenceId}`} />
              )}
              <MetaRow
                icon={Clock}
                label="Dibuat"
                value={new Date(task.createdAt).toLocaleString("id-ID")}
              />
            </div>

            {/* Obsidian link for PROJECT tasks */}
            {isProject && task.obsidianRef && (
              <a
                href={`obsidian://open?vault=K2NET_Engineering_Vault&file=${task.obsidianRef}`}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Buka di Obsidian Vault
              </a>
            )}
          </div>

        </div>
      </div>
    </PageLayout>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-foreground/75 dark:text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
