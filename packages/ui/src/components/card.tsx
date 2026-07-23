import * as React from "react";
import { cn } from "../utils";

export interface CardProps extends React.ComponentProps<"div"> {
  animatedBeam?: boolean;
  beamColor?: string;
  beamDuration?: number;
}

function Card({ 
  className, 
  animatedBeam = false, 
  beamColor = "#3ecf8e", 
  beamDuration = 4,
  children, 
  ...props 
}: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "group relative flex flex-col gap-6 rounded-xl border border-border/80 bg-card/60 dark:bg-card/45 backdrop-blur-xl text-card-foreground py-6 shadow-sm transition-all duration-300 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10",
        className
      )}
      {...props}
    >
      {/* Rotating Conic Gradient Laser Beam on Hover (1px Border Perimeter Only) */}
      {animatedBeam ? (
        <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 overflow-hidden p-[1px] z-10">
          <div 
            className="absolute -inset-[150%] animate-border-spin"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 60%, ${beamColor} 85%, transparent 100%)`,
              animationDuration: `${beamDuration}s`,
            }}
          />
          <div className="h-full w-full rounded-[11px] bg-background/80 backdrop-blur-xl" />
        </div>
      ) : null}

      <div className={cn("relative z-20 flex flex-col justify-between h-full w-full", className?.includes("flex-row") && "flex-row items-center")}>
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
