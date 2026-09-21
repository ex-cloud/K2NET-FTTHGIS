import { useState, useMemo, useRef, useEffect, useCallback } from "react";

export interface FilterPillOption {
  id: string;
  label: string;
  count?: number;
  badgeVariant?: "default" | "critical" | "warning" | "info" | "neutral" | "success";
  dotColor?: string;
}

export interface UseOverviewTableControlsOptions<T> {
  items: T[];
  filterPredicate?: (item: T, activeFilter: string) => boolean;
  searchPredicate?: (item: T, query: string) => boolean;
  sortComparator?: (a: T, b: T, sortField: string, sortDir: "asc" | "desc") => number;
  defaultSortField?: string | null;
  defaultSortDir?: "asc" | "desc";
  initialLimit?: number;
  batchSize?: number;
}

export function useOverviewTableControls<T>({
  items,
  filterPredicate,
  searchPredicate,
  sortComparator,
  defaultSortField = null,
  defaultSortDir = "desc",
  initialLimit = 10,
  batchSize = 10,
}: UseOverviewTableControlsOptions<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sortField, setSortField] = useState<string | null>(defaultSortField);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [visibleLimit, setVisibleLimit] = useState(initialLimit);

  // Reset limit when query or filter changes
  useEffect(() => {
    setVisibleLimit(initialLimit);
  }, [searchQuery, activeFilter, initialLimit]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // 1. Filter by category/status/severity
    if (activeFilter !== "ALL" && filterPredicate) {
      result = result.filter((item) => filterPredicate(item, activeFilter));
    }

    // 2. Filter by search query
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery && searchPredicate) {
      result = result.filter((item) => searchPredicate(item, trimmedQuery));
    }

    // 3. Sort
    if (sortField && sortComparator) {
      result.sort((a, b) => sortComparator(a, b, sortField, sortDir));
    }

    return result;
  }, [items, activeFilter, searchQuery, sortField, sortDir, filterPredicate, searchPredicate, sortComparator]);

  // Sliced items for infinite scroll display
  const visibleItems = useMemo(() => {
    return filteredAndSortedItems.slice(0, visibleLimit);
  }, [filteredAndSortedItems, visibleLimit]);

  const hasMore = visibleLimit < filteredAndSortedItems.length;

  // Infinite scroll trigger via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(() => {
    setVisibleLimit((prev) => Math.min(prev + batchSize, filteredAndSortedItems.length));
  }, [batchSize, filteredAndSortedItems.length]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const handleSort = useCallback((field: string, dir: "asc" | "desc") => {
    setSortField(field);
    setSortDir(dir);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setActiveFilter("ALL");
    setSortField(defaultSortField);
    setSortDir(defaultSortDir);
    setVisibleLimit(initialLimit);
  }, [defaultSortField, defaultSortDir, initialLimit]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    sortField,
    sortDir,
    handleSort,
    visibleItems,
    filteredAndSortedItems,
    totalFilteredCount: filteredAndSortedItems.length,
    totalCount: items.length,
    hasMore,
    sentinelRef,
    loadMore,
    resetFilters,
  };
}
