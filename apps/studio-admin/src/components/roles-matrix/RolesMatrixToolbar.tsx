import React from "react";
import { Search, X, Filter } from "lucide-react";
import { Input, Button, Badge, ActionTooltip } from "@k2net/ui";
import { cn } from "@/lib/utils";

interface RolesMatrixToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  diffOnly: boolean;
  setDiffOnly: (updater: (prev: boolean) => boolean) => void;
  totalFilteredPerms: number;
  totalPerms: number;
}

export function RolesMatrixToolbar({
  searchQuery,
  setSearchQuery,
  diffOnly,
  setDiffOnly,
  totalFilteredPerms,
  totalPerms,
}: RolesMatrixToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-card/60 backdrop-blur-xl rounded-lg border border-border/80 shadow-xs">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter permissions, code, atau modul..."
          className="h-8 pl-8 pr-8 text-xs bg-background/60 border-border/80 text-foreground placeholder:text-muted-foreground rounded-md focus-visible:ring-1 focus-visible:ring-primary/50"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
            title="Hapus pencarian"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ActionTooltip label={diffOnly ? "Tampilkan semua permission" : "Hanya tampilkan permission dengan perbedaan antar role"}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDiffOnly((prev) => !prev)}
            className={cn(
              "border transition-colors cursor-pointer gap-1.5",
              diffOnly
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-background/40 text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Filter className="size-3.5 text-muted-foreground" />
            <span>Tampilkan Perbedaan Saja</span>
          </Button>
        </ActionTooltip>

        <Badge
          variant="outline"
          className="h-7 px-2.5 text-[11px] font-mono font-medium rounded-md border-border/80 bg-muted/40 text-muted-foreground flex items-center justify-center"
        >
          {totalFilteredPerms} / {totalPerms} Hak Akses
        </Badge>
      </div>
    </div>
  );
}
