"use client";

import { useState, useEffect, useCallback } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ODC, PageResponse } from "@/types/network";

export function useOdcData() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params?.projectId as string;
  const [data, setData] = useState<ODC[]>([]);
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
        const urlParams = new URLSearchParams({
          page: pagination.pageIndex.toString(),
          size: pagination.pageSize.toString(),
          search: search,
        });

        const headers: HeadersInit = {
          Authorization: `Bearer ${session.accessToken}`,
        };
        
        // Inject Tenant ID for backend filtering if available
        if (projectId) {
          headers["X-Project-ID"] = projectId;
        }

        const res = await fetch(`${baseUrl}/network/odcs?${urlParams}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch ODCs");
        const result: PageResponse<ODC> = await res.json();
        setData(result.content);
        setPagination((prev) => ({ ...prev, pageCount: result.totalPages }));
      } catch (err) {
        console.error(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [session?.accessToken, pagination.pageIndex, pagination.pageSize, search, projectId],
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

      // 1. Immediate local state patch (Batch process)
      setData((prevData) => {
        const newData = [...prevData];
        let hasChanges = false;

        events.forEach(({ assetCode, status }) => {
          const index = newData.findIndex((odc) => odc.code === assetCode);
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
    refresh: () => fetchData(true),
  };
}
