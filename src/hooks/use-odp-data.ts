"use client";

import { useState, useEffect, useCallback } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ODP, PageResponse } from "@/types/network";
import { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { useDebounce } from "./use-debounce";

export function useOdpData() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params?.projectId as string;
  const [data, setData] = useState<ODP[]>([]);
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
        const baseUrl = getBackendBaseUrl();
        const urlParams = new URLSearchParams({
          page: pagination.pageIndex.toString(),
          size: pagination.pageSize.toString(),
          search: debouncedSearch,
          _t: Date.now().toString(), // Cache busting
        });

        // Add sorting params (Spring Data format: sort=field,direction)
        if (sorting.length > 0) {
          sorting.forEach((sort) => {
            urlParams.append("sort", `${sort.id},${sort.desc ? "desc" : "asc"}`);
          });
        }

        // Add column filters (e.g., status=ACTIVE)
        if (debouncedFilters.length > 0) {
          debouncedFilters.forEach((filter) => {
            if (filter.value !== undefined && filter.value !== "") {
              urlParams.append(filter.id, filter.value as string);
            }
          });
        }

        const headers: HeadersInit = {
          Authorization: `Bearer ${session.accessToken}`,
        };
        
        if (projectId) {
          headers["X-Project-ID"] = projectId;
        }

        const res = await fetch(`${baseUrl}/network/odps?${urlParams}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch ODPs");
        const result: PageResponse<ODP> = await res.json();
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
          const index = newData.findIndex((odp) => odp.code === assetCode);
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
      const baseUrl = getBackendBaseUrl();
      const headers: HeadersInit = {
        Authorization: `Bearer ${session.accessToken}`,
      };
      if (projectId) headers["X-Project-ID"] = projectId;

      // Fetch all for export (or large enough size)
      const res = await fetch(`${baseUrl}/network/odps?size=1000&search=${search}`, { headers });
      if (!res.ok) throw new Error("Export failed");
      const result: PageResponse<ODP> = await res.json();
      
      const rows = result.content.map(odp => ({
        Code: odp.code,
        Name: odp.name,
        Status: odp.status,
        "Parent ODC": odp.odcCode,
        "Used Ports": odp.usedPort,
        "Total Ports": odp.totalPort,
        Latitude: odp.lat,
        Longitude: odp.lng
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
      link.setAttribute("download", `odp_export_${new Date().toISOString().split('T')[0]}.csv`);
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
