import React from "react";
import { PebbleBotSvg } from "../linear-isometric";
import { cn } from "../../utils";

interface AiGreetingProps {
  greeting?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AiGreeting({
  greeting,
  subtitle = "What are we doing today?",
  size = "md",
  className,
}: AiGreetingProps) {
  const dynamicGreeting =
    greeting ||
    (() => {
      const h = new Date().getHours();
      if (h < 12) return "Good morning.";
      if (h < 18) return "Good afternoon.";
      return "Good evening.";
    })();

  return (
    <div className={cn("text-center py-2 space-y-3 select-none", className)}>
      <PebbleBotSvg size={size} className="mx-auto" />
      <div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          {dynamicGreeting}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
