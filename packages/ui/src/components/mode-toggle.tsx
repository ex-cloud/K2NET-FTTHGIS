import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface ModeToggleProps {
  align?: "start" | "center" | "end";
  className?: string;
}

export function ModeToggle({ align = "end", className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[8.5rem]">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between gap-2 text-xs cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Light</span>
          </span>
          {theme === "light" && (
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between gap-2 text-xs cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Dark</span>
          </span>
          {theme === "dark" && (
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between gap-2 text-xs cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
            <span>System</span>
          </span>
          {theme === "system" && (
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
