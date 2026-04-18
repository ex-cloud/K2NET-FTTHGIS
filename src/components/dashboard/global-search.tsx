"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, MapPin, Building2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  code: string;
  type: string;
  lng: number;
  lat: number;
  status: string;
  projectId: string;
  projectName: string;
}

export function GlobalSearch() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const orgId = params?.orgId as string;
  const currentProjectId = params?.projectId as string;

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // API Call with Debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const baseUrl = getBackendBaseUrl();
        // Add orgId to search query to enforce scoping
        const url = new URL(`${baseUrl}/network/assets/search`);
        url.searchParams.append("q", query);
        if (orgId) url.searchParams.append("orgId", orgId);

        const res = await httpClient(url.toString(), {
          token: session?.accessToken,
        });

        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShowResults(true);
        }
      } catch (err) {
        console.error("Global Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, orgId, session?.accessToken]);

  const handleSelect = useCallback((asset: SearchResult) => {
    setShowResults(false);
    setQuery("");

    const targetUrl = `/org/${orgId}/project/${asset.projectId}/infrastructure/topology?focus=${asset.code}`;
    
    // If we are already on the target project topology page, we just fly to the asset
    // Otherwise, we navigate
    if (pathname.includes(`/project/${asset.projectId}/infrastructure/topology`)) {
        // Dispatch custom event for intra-project navigation if needed, 
        // but router.push with query param usually triggers the effect in the topology page
        router.push(targetUrl);
    } else {
        router.push(targetUrl);
    }
  }, [orgId, pathname, router]);

  return (
    <div className="relative w-full max-w-md group" ref={containerRef}>
      <Search className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
        loading ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-500"
      )} />
      
      <Input
        placeholder="Cari ODP, ODC, atau Kode Alat..."
        className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-600 h-9 rounded-lg pl-10 pr-10 transition-all"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setShowResults(true)}
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-11 left-0 right-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors group"
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm",
                  result.type === "ODC" ? "bg-sky-500/10 text-sky-500 border border-sky-500/20" :
                  result.type === "ODP" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                  result.type === "OLT" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                  "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                )}>
                  {result.type}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-500 transition-colors">
                      {result.code}
                    </span>
                    <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                        result.status === "ACTIVE" || result.status === "UP" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                        {result.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-500">
                      <Package className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{result.projectName || "Default Project"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-600">
                      <MapPin className="w-3 h-3" />
                      <span>{result.lat.toFixed(4)}, {result.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-2 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center px-4">
             <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                {results.length} Results found
             </span>
             <Building2 className="w-3 h-3 text-zinc-300 dark:text-zinc-700" />
          </div>
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-11 left-0 right-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col items-center gap-2">
            <Search className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
            <p className="text-xs text-zinc-500 italic">
               Tidak menemukan aset dengan kode &quot;{query}&quot;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
