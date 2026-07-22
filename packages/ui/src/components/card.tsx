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
        "group relative flex flex-col gap-6 rounded-xl border border-border/80 bg-card/60 dark:bg-card/45 backdrop-blur-xl text-card-foreground py-6 shadow-sm transition-all duration-300 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/5",
        className
      )}
      {...props}
    >
      {/* Rotating Conic Gradient Laser Beam on Hover (CSS Masked 1px Border) */}
      {animatedBeam ? (
        <div 
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 overflow-hidden"
          style={{
            padding: "1px",
            maskImage: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskImage: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
          }}
        >
          <div 
            className="absolute -inset-[150%] animate-border-spin"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 70%, ${beamColor} 88%, transparent 100%)`,
              animationDuration: `${beamDuration}s`,
            }}
          />
        </div>
      ) : null}

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
