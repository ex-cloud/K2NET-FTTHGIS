import React from "react";
import { ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { flexRender, type HeaderGroup } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import type { AiDocumentItem } from "../types";

interface KnowledgeTableHeaderProps {
  headerGroups: HeaderGroup<AiDocumentItem>[];
}

export function KnowledgeTableHeader({ headerGroups }: KnowledgeTableHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md grid grid-cols-[minmax(320px,1.5fr)_200px_165px_105px_130px_140px_140px_90px] border-b border-border items-stretch divide-x divide-border/40 text-[11px] font-semibold text-foreground/75 dark:text-muted-foreground shadow-xs">
      {headerGroups[0]?.headers.map((header) => {
        if (header.isPlaceholder) return <div key={header.id} />;

        const canSort = header.column.getCanSort();
        const isSorted = header.column.getIsSorted();
        const isRightAligned = ["file_size_bytes", "chunk_count", "actions"].includes(
          header.column.id
        );

        return (
          <div
            key={header.id}
            className={`min-w-0 px-4 py-2.5 flex items-center ${
              isRightAligned ? "justify-end text-right" : "justify-start text-left"
            }`}
          >
            {canSort && header.column.id !== "actions" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors outline-hidden select-none py-1 px-1.5 -mx-1.5 rounded hover:bg-muted/40 font-medium cursor-pointer">
                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    <span className="flex items-center">
                      {isSorted === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-primary shrink-0" />
                      ) : isSorted === "desc" ? (
                        <ArrowDown className="h-3 w-3 text-primary shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 opacity-40 shrink-0 hover:opacity-100" />
                      )}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isRightAligned ? "end" : "start"}
                  className="bg-popover border border-border shadow-xl rounded-lg p-1 min-w-32 z-50"
                >
                  <DropdownMenuItem
                    onClick={() => header.column.toggleSorting(false)}
                    className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-foreground/75 dark:text-muted-foreground" />
                    <span>Urutkan Naik (Ascending)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => header.column.toggleSorting(true)}
                    className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground"
                  >
                    <ArrowDown className="h-3.5 w-3.5 text-foreground/75 dark:text-muted-foreground" />
                    <span>Urutkan Turun (Descending)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
