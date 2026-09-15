import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/actions/gateways/common";
import type { ScopedToken } from "./types";

export function useOrgScopedTokens(orgIdentifier: string) {
  const [scopedTokens, setScopedTokens] = useState<ScopedToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [newGeneratedToken, setNewGeneratedToken] = useState<string | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const fetchScopedTokens = useCallback(async () => {
    try {
      setLoadingTokens(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-tokens`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setScopedTokens(data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch scoped tokens:", err);
    } finally {
      setLoadingTokens(false);
    }
  }, [orgIdentifier]);

  useEffect(() => {
    fetchScopedTokens();
  }, [fetchScopedTokens]);

  const handleCreateScopedToken = useCallback(
    async (data: { name: string; scopes: string[]; expiresInDays: number | null }) => {
      try {
        const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-tokens`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal membuat Scoped Token.");
        }

        const created = await res.json();
        setNewGeneratedToken(created.token);
        setIsTokenModalOpen(true);
        fetchScopedTokens();

        toast.success("Scoped API Token berhasil diterbitkan.", {
          description: "Salin token sekarang sebelum modal ditutup.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal membuat token.";
        toast.error(msg);
        throw err;
      }
    },
    [orgIdentifier, fetchScopedTokens]
  );

  const handleRevokeScopedToken = useCallback(
    async (tokenId: string) => {
      try {
        const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-tokens/${tokenId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error("Gagal mencabut token.");
        }

        toast.success("Scoped Token berhasil dicabut (revoked).");
        fetchScopedTokens();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mencabut token.";
        toast.error(msg);
        throw err;
      }
    },
    [orgIdentifier, fetchScopedTokens]
  );

  return {
    scopedTokens,
    loadingTokens,
    newGeneratedToken,
    isTokenModalOpen,
    setIsTokenModalOpen,
    handleCreateScopedToken,
    handleRevokeScopedToken,
    fetchScopedTokens,
  };
}
