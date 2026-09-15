import { Input } from "@k2net/ui";
import { FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentsTableToolbarProps {
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

const CATEGORIES = ["ALL", "LEGAL", "TECHNICAL", "COMPLIANCE", "BILLING"] as const;
const STATUS_FILTERS = [
  { key: "ALL", label: "Semua Status" },
  { key: "PENDING", label: "Menunggu Review" },
  { key: "VERIFIED", label: "Terverifikasi" },
  { key: "REVISION", label: "Perlu Revisi" },
] as const;

export function DocumentsTableToolbar({
  totalCount,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  statusFilter,
  setStatusFilter,
}: DocumentsTableToolbarProps) {
  return (
    <div className="p-3.5 border-b border-border/80 bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
          Tenant Documents Vault ({totalCount})
        </h4>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60 text-[10px]">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={cn(
                "px-2 py-1 rounded-md font-medium transition-colors cursor-pointer",
                statusFilter === st.key
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60 text-[10px]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-2 py-1 rounded-md font-medium transition-colors cursor-pointer",
                selectedCategory === cat
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berkas..."
            className="h-7 text-xs pl-7 w-36 sm:w-40 bg-card border-border"
          />
        </div>
      </div>
    </div>
  );
}
