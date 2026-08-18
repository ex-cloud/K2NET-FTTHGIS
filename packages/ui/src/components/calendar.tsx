"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils";

export type CalendarProps = DayPickerProps;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "relative flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full h-8",
        caption_label: "text-sm font-medium text-foreground",
        nav: "absolute top-1 inset-x-0 flex items-center justify-between w-full z-10 pointer-events-none px-1",
        button_previous: "pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
        button_next: "pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] pb-2 text-center",
        week: "flex w-full mt-1",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day_button: "h-9 w-9 rounded-md font-normal text-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        range_start: "day-range-start [&>button]:rounded-full [&>button]:!bg-primary [&>button]:text-primary-foreground",
        range_end: "day-range-end [&>button]:rounded-full [&>button]:!bg-primary [&>button]:text-primary-foreground",
        range_middle: "[&>button]:rounded-none [&>button]:!bg-primary/15 [&>button]:text-foreground",
        today: "[&>button]:border [&>button]:border-primary/50 [&>button]:font-bold",
        outside: "text-muted-foreground/30",
        disabled: "text-muted-foreground/30 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
