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

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [session?.accessToken, pagination.pageIndex, pagination.pageSize, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    pagination,
    setPagination,
    setSearch,
    refresh: fetchData,
  };
}
