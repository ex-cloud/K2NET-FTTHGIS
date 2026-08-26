"use client";

import React from "react";
import { cn } from "../../utils";
import { ISOMETRIC_FIGURES_LIST } from "./figure-registry";

export interface LinearIsometricShowcaseProps {
  className?: string;
  activeHeroId?: string;
  onSetLoginHero?: (id: string, title: string) => void;
}

export function LinearIsometricShowcase({
  className,
  activeHeroId,
  onSetLoginHero,
}: LinearIsometricShowcaseProps) {
  return (
    <div className={cn("w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {ISOMETRIC_FIGURES_LIST.map((item) => {
        const isActive = activeHeroId === item.id;

        return (
          <div
            key={item.id}
            className={cn(
              "flex flex-col justify-between p-6 rounded-2xl bg-card border transition-all duration-300 group shadow-md hover:shadow-2xl relative",
              isActive ? "border-primary/80 ring-1 ring-primary/40" : "border-border/60 hover:border-primary/50"
            )}
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest mb-3">
                <span className="text-foreground font-bold">{item.fig}</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.tag}
                </span>
              </div>

              {item.component}
            </div>

            <div className="space-y-3 pt-4 border-t border-border/40 mt-2">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {onSetLoginHero && (
                <button
                  type="button"
                  onClick={() => onSetLoginHero(item.id, item.title)}
                  className={cn(
                    "w-full py-2 px-3 rounded-lg text-xs font-mono font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/40 font-semibold"
                      : "bg-secondary text-secondary-foreground border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  )}
                >
                  {isActive ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span>Active on Login Page</span>
                    </>
                  ) : (
                    <span>Set as Login Hero</span>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
