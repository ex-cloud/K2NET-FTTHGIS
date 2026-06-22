"use client";

import dynamic from "next/dynamic";

const SearchPanel = dynamic(
  () =>
    import("@/components/dashboard/search-panel").then(
      (mod) => mod.SearchPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-[300px] bg-background/50 backdrop-blur-md animate-pulse rounded-lg border border-border/40 pointer-events-auto" />
    ),
  },
);

const StatsPanel = dynamic(
  () =>
    import("@/components/dashboard/stats-panel").then((mod) => mod.StatsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 w-full max-w-4xl bg-background/50 backdrop-blur-md animate-pulse rounded-full border border-border/40 pointer-events-auto" />
    ),
  },
);

export function FloatingWidgets() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Floating Top-Right Search */}
      <div className="absolute top-4 right-4 pt-1 pr-1 z-30">
        <SearchPanel placeholder="Search areas or coordinates..." />
      </div>

      {/* Floating Canvas for Stats (Left and Right Columns) */}
      <div className="absolute inset-0 pointer-events-none">
        <StatsPanel />
      </div>
    </div>
  );
}
