import { Search, X, Filter } from "lucide-react";

interface RolesMatrixToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  diffOnly: boolean;
  setDiffOnly: (updater: (prev: boolean) => boolean) => void;
  totalFilteredPerms: number;
  totalPerms: number;
}

export function RolesMatrixToolbar({
  searchQuery,
  setSearchQuery,
  diffOnly,
  setDiffOnly,
  totalFilteredPerms,
  totalPerms,
}: RolesMatrixToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card/40 rounded-xl border border-border backdrop-blur-sm">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari permission, kode, atau modul..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setDiffOnly((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
            diffOnly
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Tampilkan Perbedaan Saja
        </button>

        <span className="text-[11px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted">
          {totalFilteredPerms} / {totalPerms} Hak Akses
        </span>
      </div>
    </div>
  );
}
