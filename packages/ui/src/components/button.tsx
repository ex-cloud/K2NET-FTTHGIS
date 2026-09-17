import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-primary/50 aria-invalid:ring-rose-500/20 aria-invalid:border-rose-500",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-medium",
        destructive:
          "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 dark:bg-rose-500/15 font-medium",
        outline:
          "bg-card text-foreground border border-border/80 hover:bg-muted/80 hover:text-foreground shadow-xs font-medium",
        secondary:
          "bg-muted text-foreground border border-border/60 hover:bg-muted/80 font-medium",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium",
        link: "text-primary underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-8 px-3 text-xs gap-1.5 rounded-md",
        xs: "h-6 px-2 text-[11px] gap-1 rounded-md [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
        lg: "h-9 px-3.5 text-sm gap-2 rounded-md [&_svg:not([class*='size-'])]:size-4",
        icon: "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 rounded-md [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
