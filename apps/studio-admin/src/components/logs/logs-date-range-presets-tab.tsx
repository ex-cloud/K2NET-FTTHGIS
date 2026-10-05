import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { PRESETS_RECENT, PRESETS_OLDER, type PresetItem } from "./logs-date-range-types";

export interface PresetsTabContentProps {
  stagedPreset: string | null;
  onSelectPreset: (p: string) => void;
  customRelativeInput: string;
  setCustomRelativeInput: (v: string) => void;
  onRelativeSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function PresetsTabContent({
  stagedPreset,
  onSelectPreset,
  customRelativeInput,
  setCustomRelativeInput,
  onRelativeSubmit,
}: PresetsTabContentProps) {
  const { t } = useTranslation();

  const renderPresetGrid = (presets: PresetItem[]) => {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {presets.map((p) => {
          const isSelected =
            stagedPreset === p.value ||
            (stagedPreset === "60m" && (p.value === "1h" || p.value === "60m")) ||
            (stagedPreset === "1h" && (p.value === "60m" || p.value === "1h"));
          const transKey = `observability.${p.key}`;
          const trans = t(transKey);
          const label = !trans || trans === transKey || trans.startsWith("observability.preset_") ? p.fallback : trans;

          return (
            <button
              type="button"
              key={p.value}
              onClick={() => onSelectPreset(p.value)}
              className={cn(
                "flex items-center justify-center h-8 px-2 rounded-md border text-xs text-center transition-colors cursor-pointer truncate font-sans",
                isSelected
                  ? "border-border bg-muted/80 text-foreground font-semibold shadow-2xs"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:border-border"
              )}
            >
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col p-3 gap-3">
      {/* Search Duration Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          placeholder={t("observability.type_duration_placeholder") || "Type duration (e.g. 45m, 2h, 7d)..."}
          value={customRelativeInput}
          onChange={(e) => setCustomRelativeInput(e.target.value)}
          onKeyDown={onRelativeSubmit}
          className="w-full h-8 pl-8 pr-2.5 py-1 border border-border/70 bg-card text-foreground placeholder:text-muted-foreground/50 text-xs rounded-md focus:outline-none focus:border-border transition-colors font-mono shadow-xs"
        />
      </div>

      {/* Section 1: Last 24 Hours */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5 block select-none">
          {t("observability.last_24_hours") || "Last 24 Hours"}
        </span>
        {renderPresetGrid(PRESETS_RECENT)}
      </div>

      {/* Section 2: Older */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5 block select-none">
          {t("observability.older") || "Older"}
        </span>
        {renderPresetGrid(PRESETS_OLDER)}
      </div>
    </div>
  );
}
