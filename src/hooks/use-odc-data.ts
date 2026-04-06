"use client";

import { useState, useEffect, useCallback } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ODC, PageResponse } from "@/types/network";
import { useDebounce } from "./use-debounce";

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
    totalCount: 0,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Reset to page 0 when search changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch]);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!session?.accessToken) return;
      try {
        if (!silent) setLoading(true);
        const baseUrl = getBackendBaseUrl();
        const urlParams = new URLSearchParams({
          page: pagination.pageIndex.toString(),
          size: pagination.pageSize.toString(),
          search: debouncedSearch,
        });

        const headers: HeadersInit = {
          Authorization: `Bearer ${session.accessToken}`,
        };
        
        if (projectId) {
          headers["X-Project-ID"] = projectId;
        }

        const res = await fetch(`${baseUrl}/network/odcs?${urlParams}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch ODCs");
        const result: PageResponse<ODC> = await res.json();
        setData(result.content);
        setPagination((prev) => ({ 
          ...prev, 
          pageCount: result.totalPages,
          totalCount: result.totalElements 
        }));
      } catch (err) {
        console.error(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [session?.accessToken, pagination.pageIndex, pagination.pageSize, debouncedSearch, projectId],
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

  const exportToCsv = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const baseUrl = getBackendBaseUrl();
      const headers: HeadersInit = { Authorization: `Bearer ${session.accessToken}` };
      if (projectId) headers["X-Project-ID"] = projectId;

      const res = await fetch(`${baseUrl}/network/odcs?size=1000&search=${search}`, { headers });
      if (!res.ok) throw new Error("Export failed");
      const result: PageResponse<ODC> = await res.json();
      
      const rows = result.content.map(odc => ({
        Code: odc.code,
        Name: odc.name,
        Status: odc.status,
        "Parent OLT": odc.oltCode,
        Capacity: odc.capacity,
        "Used Capacity": odc.usedCapacity,
        Latitude: odc.lat,
        Longitude: odc.lng
      }));

      if (rows.length === 0) return;

      const csvContent = [
        Object.keys(rows[0]).join(","),
        ...rows.map(row => Object.values(row).map(v => `"${v}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `odc_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  }, [session?.accessToken, projectId, search]);

  return {
    data,
    loading,
    pagination,
    setPagination,
    setSearch,
    exportToCsv,
    refresh: () => fetchData(true),
  };
}
