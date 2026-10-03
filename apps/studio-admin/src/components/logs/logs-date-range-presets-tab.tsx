import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { PRESET_VALUES } from "./logs-date-range-types";

export interface PresetsTabContentProps {
  stagedPreset: string | null;
  setStagedPreset: (p: string) => void;
  customRelativeInput: string;
  setCustomRelativeInput: (v: string) => void;
  onRelativeSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function PresetsTabContent({
  stagedPreset,
  setStagedPreset,
  customRelativeInput,
  setCustomRelativeInput,
  onRelativeSubmit,
}: PresetsTabContentProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col p-3 gap-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>{t("observability.rolling_desc") || "Rolling window from now (Live)"}</span>
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/70">e.g. 45m, 2h, 30d</span>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Custom relative duration (e.g. 2h, 45m, 60d) — press Enter"
          value={customRelativeInput}
          onChange={(e) => {
            const val = e.target.value;
            setCustomRelativeInput(val);
            const trimmed = val.trim();
            const match = trimmed.match(/^(\d+)([mhd])$/i);
            if (match) {
              setStagedPreset(trimmed.toLowerCase());
            }
          }}
          onKeyDown={onRelativeSubmit}
          className="w-full h-7.5 border border-border/70 bg-card placeholder:text-muted-foreground/50 px-2.5 py-1 text-xs rounded-md focus:outline-none focus:border-primary transition-colors font-mono shadow-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-0.5">
        {PRESET_VALUES.map((p) => {
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
              onClick={() => {
                setStagedPreset(p.value);
                setCustomRelativeInput(p.value);
              }}
              className={cn(
                "flex items-center justify-between h-8 px-2.5 rounded-md border text-xs text-left transition-all cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:border-border"
              )}
            >
              <div className="flex items-center gap-1.5 truncate">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                    isSelected ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
                <span className="truncate text-xs">{label}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-1.5">
                {p.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
