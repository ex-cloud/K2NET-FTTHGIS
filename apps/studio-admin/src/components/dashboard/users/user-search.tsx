"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@k2net/ui";
import { useEffect, useState } from "react";

export function UserSearch({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }
      // Only trigger navigation if query actually changed from URL
      if (searchTerm !== (searchParams.get("q") || "")) {
        params.set("page", "0");
        replace(`${pathname}?${params.toString()}`);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, pathname, replace, searchParams]);

  return (
    <div className="relative w-full group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
      <Input
        className="w-full bg-muted/40 border-border/40 rounded-lg pl-10 pr-4 h-9 text-sm focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-primary"
        placeholder={placeholder}
        onChange={(e) => setSearchTerm(e.target.value)}
        value={searchTerm}
      />
    </div>
  );
}
