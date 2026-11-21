import * as React from "react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Search } from "lucide-react";

interface ModuleToolbarProps {
  urlTab: string;
  scopeFilter: string;
  onScopeChange: (scope: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ModuleToolbar({
  urlTab,
  scopeFilter,
  onScopeChange,
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
}: ModuleToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/80">
        {(["ALL", "SYSTEM", "TENANT"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onScopeChange(s)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              scopeFilter === s
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "ALL"
              ? t("modules.scope_all")
              : s === "SYSTEM"
              ? t("modules.scope_system")
              : t("modules.scope_tenant")}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(urlTab === "directory" || urlTab === "toggles") && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-7 text-xs w-[140px] bg-background border-border">
              <SelectValue placeholder={t("modules.status_all")} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-foreground text-xs">
              <SelectItem value="ALL">{t("modules.status_all")}</SelectItem>
              <SelectItem value="ACTIVE">{t("modules.status_active")}</SelectItem>
              <SelectItem value="MAINTENANCE">{t("modules.status_maintenance")}</SelectItem>
              <SelectItem value="DISABLED">{t("modules.status_disabled")}</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="relative w-full sm:w-[240px]">
          <Search className="absolute left-2.5 top-1.5 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("modules.search_placeholder")}
            className="h-7 pl-8 text-xs bg-background border-border"
          />
        </div>
      </div>
    </div>
  );
}
