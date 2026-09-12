import { cn } from "@/lib/utils";

export type ProjectTab = "overview" | "activity" | "issues";

interface ProjectDetailTabsBarProps {
  activeTab: ProjectTab;
  setActiveTab: (tab: ProjectTab) => void;
  commentsCount: number;
  resolvedIssuesCount: number;
  totalIssuesCount: number;
}

export function ProjectDetailTabsBar({
  activeTab,
  setActiveTab,
  commentsCount,
  resolvedIssuesCount,
  totalIssuesCount,
}: ProjectDetailTabsBarProps) {
  return (
    <div className="px-6 border-b border-border/40 shrink-0 bg-background/50 flex items-center gap-1">
      <button
        onClick={() => setActiveTab("overview")}
        className={cn(
          "px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer",
          activeTab === "overview"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        Overview
      </button>
      <button
        onClick={() => setActiveTab("activity")}
        className={cn(
          "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer",
          activeTab === "activity"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <span>Activity</span>
        {commentsCount > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
            {commentsCount}
          </span>
        )}
      </button>
      <button
        onClick={() => setActiveTab("issues")}
        className={cn(
          "px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer",
          activeTab === "issues"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <span>Issues</span>
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
          {resolvedIssuesCount}/{totalIssuesCount}
        </span>
      </button>
    </div>
  );
}
