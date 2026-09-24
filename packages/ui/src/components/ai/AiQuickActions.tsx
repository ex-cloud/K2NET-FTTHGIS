import React from "react";
import {
  ChevronRight,
  Zap,
  MapPin,
  Activity,
  Database,
  GitPullRequest,
  ShieldCheck,
  Sparkles,
  Cpu,
  Search,
  Server,
  Layers,
  Network,
} from "lucide-react";
import { cn } from "../../utils";
import type { QuickIdea } from "./types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  mappin: MapPin,
  activity: Activity,
  database: Database,
  gitpullrequest: GitPullRequest,
  shieldcheck: ShieldCheck,
  sparkles: Sparkles,
  cpu: Cpu,
  search: Search,
  server: Server,
  layers: Layers,
  network: Network,
};

interface AiQuickActionsProps {
  ideas: QuickIdea[];
  onSelect: (idea: QuickIdea) => void;
  columns?: 1 | 2;
  label?: string;
  className?: string;
}

export function AiQuickActions({
  ideas,
  onSelect,
  columns = 1,
  label = "IDEAS & QUICK ACTIONS",
  className,
}: AiQuickActionsProps) {
  if (!ideas || ideas.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase px-0.5">
          {label}
        </p>
      )}
      <div
        className={cn(
          columns === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-2.5" : "space-y-2"
        )}
      >
        {ideas.map((idea) => {
          let IconComponent: React.ComponentType<{ className?: string }> = Zap;

          if (typeof idea.icon === "function" || typeof idea.icon === "object") {
            IconComponent = idea.icon as React.ComponentType<{ className?: string }>;
          } else if (typeof idea.icon === "string") {
            const key = idea.icon.toLowerCase().replace(/[-_]/g, "");
            IconComponent = ICON_MAP[key] || Zap;
          }

          const desc = idea.desc || idea.description || idea.prompt;

          return (
            <button
              key={idea.id}
              type="button"
              onClick={() => onSelect(idea)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left",
                "bg-card hover:bg-muted/60 border border-border hover:border-primary/40",
                "transition-all duration-150 group cursor-pointer shadow-xs"
              )}
            >
              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all border border-primary/20">
                <IconComponent className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {idea.title}
                </p>
                {desc && (
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {desc}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
