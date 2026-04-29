"use client";
import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { networkApi } from "@/lib/api/network";
import { useParams } from "next/navigation";


interface ParentAsset {
  id: string;
  code: string;
  name?: string;
  type: string;
}

interface ParentSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: ParentAsset) => void;
  parentType: "OLT" | "ODC" | "ODP";
}

export function ParentSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  parentType
}: ParentSelectorDialogProps) {
  const { data: session } = useSession();
  const params = useParams();

  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState<ParentAsset[]>([]);
  const [loading, setLoading] = React.useState(false);

  const searchParents = React.useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await networkApi.searchAssets(query, params?.orgId as string, session?.accessToken as string);
      // Filter by requested parent type
      const filtered = data.filter((item: ParentAsset) => item.type.toUpperCase() === parentType.toUpperCase());
      setResults(filtered);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [parentType, session?.accessToken, params?.orgId]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchParents(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchParents]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[500px] p-0 overflow-hidden rounded-3xl gap-0 shadow-2xl">
        <DialogHeader className="p-6 bg-zinc-900/50 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-bold uppercase tracking-widest">Select New {parentType}</DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] uppercase font-black tracking-tight mt-1">
                Search and select the target parent node
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder={`Search ${parentType} code or name...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-zinc-900/50 border-white/10 h-12 rounded-2xl text-sm placeholder:text-zinc-600 focus:ring-blue-500"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
          </div>

          <div className="max-h-[300px] overflow-auto space-y-2 pr-2 custom-scrollbar">
            {results.length > 0 ? (
              results.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    onSelect(asset);
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group text-left"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{asset.code}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{asset.name || "Unnamed Asset"}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500/0 group-hover:bg-blue-500/10 flex items-center justify-center border border-white/0 group-hover:border-blue-500/20 transition-all">
                    <Check className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </button>
              ))
            ) : searchQuery.length >= 2 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                  <Search className="w-5 h-5 text-zinc-700" />
                </div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest italic">No matching {parentType} found</p>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Start typing to search...</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border-t border-white/5 flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-zinc-500 hover:text-white font-bold uppercase text-[10px] tracking-widest"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
