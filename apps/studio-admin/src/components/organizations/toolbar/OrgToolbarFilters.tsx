import * as React from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";

interface OrgToolbarFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  planFilter: string;
  setPlanFilter: (v: string) => void;
}

export function OrgToolbarFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
}: OrgToolbarFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilter = statusFilter !== "ALL" || planFilter !== "ALL" || searchQuery.trim() !== "";

  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
      {/* Search Input */}
      <div className="relative w-full sm:w-[260px]">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("organizations.filter_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-border/80 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all h-8"
        />
        <kbd className="absolute right-2.5 top-2 px-1 text-[9px] font-mono text-muted-foreground/60 rounded bg-muted border border-border/60 pointer-events-none">
          /
        </kbd>
      </div>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "font-normal border-border/80 gap-1.5 bg-card hover:bg-accent",
              statusFilter !== "ALL" && "border-primary/50 text-primary bg-primary/5"
            )}
          >
            <Filter className="size-3 text-muted-foreground" />
            <span>
              {t("organizations.status")}: <strong className="font-medium">{statusFilter === "ALL" ? t("common.all") : statusFilter}</strong>
            </span>
            <ChevronDown className="size-3 text-muted-foreground opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 text-xs bg-popover/95 backdrop-blur-xl border-border/80 rounded-md">
          <DropdownMenuItem onClick={() => setStatusFilter("ALL")} className="cursor-pointer">
            {t("organizations.all_statuses")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")} className="cursor-pointer">
            🟢 {t("organizations.active_only")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter("TRIAL")} className="cursor-pointer">
            🔵 {t("organizations.trial_only")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter("PROVISIONING")} className="cursor-pointer">
            🟡 {t("organizations.provisioning_only")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter("SUSPENDED")} className="cursor-pointer text-destructive">
            🔴 {t("organizations.suspended_only")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Plan Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "font-normal border-border/80 gap-1.5 bg-card hover:bg-accent",
              planFilter !== "ALL" && "border-primary/50 text-primary bg-primary/5"
            )}
          >
            <span>
              {t("organizations.plan_tier")}: <strong className="font-medium">{planFilter === "ALL" ? t("common.all") : planFilter}</strong>
            </span>
            <ChevronDown className="size-3 text-muted-foreground opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 text-xs bg-popover/95 backdrop-blur-xl border-border/80 rounded-md">
          <DropdownMenuItem onClick={() => setPlanFilter("ALL")} className="cursor-pointer">
            {t("organizations.all_plans")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPlanFilter("Free")} className="cursor-pointer">
            {t("billing.free_trial")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPlanFilter("Starter")} className="cursor-pointer">
            {t("billing.starter")} Tier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPlanFilter("Professional")} className="cursor-pointer">
            {t("billing.pro")} Tier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPlanFilter("Enterprise")} className="cursor-pointer">
            {t("billing.enterprise")} Tier
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
            setPlanFilter("ALL");
          }}
          className="text-muted-foreground hover:text-foreground px-2 cursor-pointer"
        >
          {t("common.reset")}
        </Button>
      )}
    </div>
  );
}
