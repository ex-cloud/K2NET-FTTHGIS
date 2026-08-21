import * as React from "react";
import { cn } from "../utils";
import { GlowingEffect } from "./glowing-effect";

export interface CardProps extends React.ComponentProps<"div"> {
  glowingEffect?: boolean;
}

function Card({ 
  className, 
  glowingEffect = false,
  children, 
  ...props 
}: CardProps) {
  const isFlexRow = className?.includes("flex-row");
  const gapClass = className?.split(" ").find((c) => c.startsWith("gap-")) || "";
  const justifyClass = className?.split(" ").find((c) => c.startsWith("justify-")) || "";

  return (
    <div
      data-slot="card"
      className={cn(
        "group relative flex flex-col gap-6 rounded-xl border border-border/80 bg-card/60 dark:bg-card/45 backdrop-blur-xl text-card-foreground py-6 shadow-sm transition-all duration-300",
        !glowingEffect && "hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10",
        className
      )}
      {...props}
    >
      {/* Interactive Cursor-Following Glowing Effect (Refined Sleek Hairline) */}
      {glowingEffect ? (
        <GlowingEffect
          spread={16}
          glow={true}
          disabled={false}
          proximity={42}
          inactiveZone={0.12}
          borderWidth={1}
        />
      ) : null}

      <div 
        className={cn(
          "relative z-20 h-full w-full",
          isFlexRow 
            ? cn("flex flex-row items-center", gapClass || "gap-4", justifyClass)
            : cn("flex flex-col", justifyClass)
        )}
      >
        {children}
      </div>
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
