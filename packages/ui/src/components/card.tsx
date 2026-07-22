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
  beamColor = "var(--primary, #3ecf8e)", 
  beamDuration = 4,
  children, 
  ...props 
}: CardProps) {
  if (animatedBeam) {
    return (
      <div 
        className="group relative h-full w-full overflow-hidden rounded-xl bg-border p-[1px] transition-all duration-300 hover:shadow-lg"
        style={{
          "--beam-duration": `${beamDuration}s`,
        } as React.CSSProperties}
      >
        {/* Rotating Conic Gradient Laser Beam on Hover */}
        <div 
          className="pointer-events-none absolute -inset-[150%] animate-border-spin opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 70%, ${beamColor} 88%, transparent 100%)`,
          }}
        />

        <div
          data-slot="card"
          className={cn(
            "relative h-full w-full bg-card/90 dark:bg-card/85 backdrop-blur-xl text-card-foreground flex flex-col gap-6 rounded-[11px] py-6 shadow-xs dark:shadow-none transition-all duration-300",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card/90 dark:bg-card/85 backdrop-blur-xl text-card-foreground flex flex-col gap-6 rounded-xl border border-border hover:border-primary/50 py-6 shadow-xs dark:shadow-none transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
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
