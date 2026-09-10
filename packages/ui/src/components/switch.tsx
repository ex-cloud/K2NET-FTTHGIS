"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "../utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        "data-[size=default]:h-[1.25rem] data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/80 data-[state=unchecked]:border-border/80 dark:data-[state=unchecked]:bg-secondary dark:data-[state=unchecked]:border-border",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full shadow-md ring-0 transition-transform",
          "group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3",
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-[2px]",
          "data-[state=checked]:bg-white",
          "data-[state=unchecked]:bg-muted-foreground/60 dark:data-[state=unchecked]:bg-muted-foreground/50"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
