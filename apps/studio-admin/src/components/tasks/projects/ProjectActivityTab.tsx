

import React from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { Card, TracingBeam } from "@k2net/ui";
import { type TaskComment } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";

interface ProjectActivityTabProps {
  updateMode: "update" | "comment";
  setUpdateMode: (mode: "update" | "comment") => void;
  updateText: string;
  setUpdateText: (text: string) => void;
  postingUpdate: boolean;
  progressPercent: number;
  comments: TaskComment[];
  onPostUpdate: () => Promise<void>;
}

export function ProjectActivityTab({
  updateMode,
  setUpdateMode,
  updateText,
  setUpdateText,
  postingUpdate,
  progressPercent,
  comments,
  onPostUpdate,
}: ProjectActivityTabProps) {
  return (
    <TracingBeam className="pl-4 md:pl-10">
      <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* Update Composer */}
      <Card className="border border-border/60 bg-card/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUpdateMode("update")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer",
                updateMode === "update"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => setUpdateMode("comment")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer",
                updateMode === "comment"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Comment
            </button>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            On track
          </span>
        </div>

        <textarea
          value={updateText}
          onChange={(e) => setUpdateText(e.target.value)}
          placeholder="Write a project update..."
          className="w-full min-h-[80px] text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0 resize-none"
        />

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Progress: <strong className="text-foreground font-mono">{progressPercent}%</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onPostUpdate}
            disabled={!updateText.trim() || postingUpdate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {postingUpdate && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>Post update</span>
          </button>
        </div>
      </Card>

      {/* Activity Timeline Feed */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Timeline History</h4>

        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Belum ada linimasa pembaruan.</p>
        ) : (
          comments.map((c, idx) => (
            <div key={c.id || idx} className="flex items-start gap-3 p-3 rounded-xl bg-card/30 border border-border/40 text-xs">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                {c.authorId ? c.authorId.substring(0, 1).toUpperCase() : "A"}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{c.authorId ? c.authorId.split("@")[0] : "Team Member"}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-foreground/90 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </TracingBeam>
  );
}
