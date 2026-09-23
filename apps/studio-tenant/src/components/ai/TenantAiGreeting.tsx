import * as React from "react";
import { PebbleBotSvg, cn } from "@k2net/ui";
import type { QuickIdea } from "./types";

interface TenantAiGreetingProps {
  greeting: string;
  quickIdeas: QuickIdea[];
  onSelectIdea: (prompt: string) => void;
}

export function TenantAiGreeting({
  greeting,
  quickIdeas,
  onSelectIdea,
}: TenantAiGreetingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
      <div className="space-y-3">
        <PebbleBotSvg size="lg" className="mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">{greeting}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            What are we doing today?
          </p>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase mb-3">
          IDEAS &amp; QUICK ACTIONS
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickIdeas.map((idea) => {
            const Icon = idea.icon;
            return (
              <button
                key={idea.id}
                type="button"
                onClick={() => onSelectIdea(idea.prompt)}
                className={cn(
                  "flex items-start gap-3.5 p-4 rounded-2xl text-left",
                  "bg-card hover:bg-muted/60 border border-border hover:border-primary/40",
                  "transition-all duration-150 group cursor-pointer shadow-xs"
                )}
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-all mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {idea.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {idea.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
