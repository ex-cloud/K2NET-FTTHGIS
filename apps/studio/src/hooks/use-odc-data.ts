"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ODC } from "@/types/network";
import { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { useDebounce } from "./use-debounce";
import { networkApi } from "@/lib/api/network";

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const debouncedSearch = useDebounce(search, 400);
  const debouncedFilters = useDebounce(filters, 400);

  // Reset to page 0 when search or filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, debouncedFilters]);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!session?.accessToken) return;
      try {
        if (!silent) setLoading(true);

        const sortParams = sorting.map(sort => `${sort.id},${sort.desc ? "desc" : "asc"}`);
        const filterParams: Record<string, string> = {};
        debouncedFilters.forEach(f => {
          if (f.value !== undefined && f.value !== "") {
            filterParams[f.id] = f.value as string;
          }
        });

        const result = await networkApi.getOdcs({
          page: pagination.pageIndex,
          size: pagination.pageSize,
          search: debouncedSearch,
          sort: sortParams,
          ...filterParams
        }, session.accessToken as string, projectId as string);

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
    [session?.accessToken, pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting, debouncedFilters, projectId],
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

    const onRefetch = () => fetchData(true);
    
    window.addEventListener("network-batch-update", handleNetworkBatchUpdate);
    window.addEventListener("refetch-network-data", onRefetch);
    
    return () => {
      window.removeEventListener(
        "network-batch-update",
        handleNetworkBatchUpdate,
      );
      window.removeEventListener("refetch-network-data", onRefetch);
    };
  }, [fetchData]);

  const exportToCsv = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const result = await networkApi.getOdcs({ 
        size: 1000, 
        search 
      }, session.accessToken as string, projectId as string);
      
      const rows = result.content.map((odc: ODC) => ({
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
        ...rows.map((row: Record<string, unknown>) => Object.values(row).map(v => `"${v}"`).join(","))
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
    setSorting,
    setFilters,
    exportToCsv,
    refresh: () => fetchData(true),
  };
}
