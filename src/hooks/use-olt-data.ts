"use client";

import { useState, useEffect, useCallback } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { OLT, PageResponse } from "@/types/network";

export function useOltData() {
  const { data: session } = useSession();
  const [data, setData] = useState<OLT[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
  });
  const [search, setSearch] = useState("");

  const fetchData = useCallback(
    async (silent = false) => {
      if (!session?.accessToken) return;
      try {
        if (!silent) setLoading(true);
        const baseUrl = getBackendBaseUrl();
        const params = new URLSearchParams({
          page: pagination.pageIndex.toString(),
          size: pagination.pageSize.toString(),
          search: search,
        });

        const res = await fetch(`${baseUrl}/network/olts?${params}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch OLTs");
        const result: PageResponse<OLT> = await res.json();
        setData(result.content);
        setPagination((prev) => ({ ...prev, pageCount: result.totalPages }));
      } catch (err) {
        console.error(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [session?.accessToken, pagination.pageIndex, pagination.pageSize, search],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Real-time Updates synchronization (Batched)
  useEffect(() => {
    const handleNetworkBatchUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        events: Array<{ assetCode: string; status: string }>;
      }>;
      const events = customEvent.detail.events;

      console.log(
        `[OLT Table Sync] Received batch update: ${events.length} events`,
      );

      // 1. Immediate local state patch (Batch process)
      setData((prevData) => {
        const newData = [...prevData];
        let hasChanges = false;

        events.forEach(({ assetCode, status }) => {
          const index = newData.findIndex((olt) => olt.code === assetCode);
          if (index !== -1) {
            newData[index] = { ...newData[index], status };
            hasChanges = true;
          }
        });

        return hasChanges ? newData : prevData;
      });

      // 2. Silent background refresh after a short delay
      setTimeout(() => {
        fetchData(true);
      }, 1000);
    };

    window.addEventListener("network-batch-update", handleNetworkBatchUpdate);
    return () =>
      window.removeEventListener(
        "network-batch-update",
        handleNetworkBatchUpdate,
      );
  }, [fetchData]);

  return {
    data,
    loading,
    pagination,
    setPagination,
    setSearch,
    refresh: () => fetchData(false), // Manual refresh is always non-silent
  };
}
