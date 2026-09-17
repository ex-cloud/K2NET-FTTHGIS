import * as React from "react"

import { cn } from "../utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-8 w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1 text-xs shadow-xs transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary",
        "aria-invalid:ring-rose-500/20 aria-invalid:border-rose-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
