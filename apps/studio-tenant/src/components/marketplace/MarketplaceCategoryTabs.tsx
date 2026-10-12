import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@k2net/ui";
import type { PackageCategory } from "../../hooks/useTenantPackagesMarketplace";

export interface MarketplaceCategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

const CATEGORIES: PackageCategory[] = [
  "CAPACITY_BOOSTER",
  "TELEMETRY",
  "FIELD_OPS",
  "AI_COPILOT",
  "GIS_ANALYTICS",
  "SECURITY_GOV",
  "DISASTER_RECOVERY",
  "BILLING_FINANCE",
  "INTEGRATION",
  "CIVIL_INFRA",
  "WORKFORCE_SAFETY",
  "COLLABORATION",
];

export function MarketplaceCategoryTabs({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}: MarketplaceCategoryTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
      <button
        type="button"
        onClick={() => onSelectCategory("")}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer border",
          selectedCategory === ""
            ? "bg-primary text-primary-foreground border-primary shadow-2xs"
            : "bg-muted/40 hover:bg-muted text-foreground/80 border-border/80"
        )}
      >
        <span>{t("packages.filter_all_categories")}</span>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
            selectedCategory === ""
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-background/80 text-foreground/70"
          )}
        >
          {totalCount}
        </span>
      </button>

      {CATEGORIES.map((cat) => {
        const count = categoryCounts[cat] || 0;
        const isSelected = selectedCategory === cat;
        // Hanya render kategori yang memiliki setidaknya 1 paket atau jika sedang dipilih
        if (count === 0 && !isSelected) return null;

        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer border",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                : "bg-muted/40 hover:bg-muted text-foreground/80 border-border/80"
            )}
          >
            <span>{t(`packages.category.${cat}`)}</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                isSelected
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background/80 text-foreground/70"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
