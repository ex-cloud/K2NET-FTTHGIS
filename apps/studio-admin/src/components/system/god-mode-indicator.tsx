"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { getCurrentOrgSlug, getSystemUrl } from "@/lib/domain";

export function GodModeIndicator() {
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const slug = getCurrentOrgSlug();
  const isSuperadmin = session?.user?.roles?.includes("super_admin");
  const isImpersonating = isSuperadmin && slug && slug !== "system";

  if (!isImpersonating) return null;

  return (
    <div 
      onClick={() => window.location.assign(getSystemUrl())}
      className="flex shrink-0 whitespace-nowrap items-center gap-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full cursor-pointer hover:bg-amber-500/20 transition-all group/imp mr-2"
    >
      <div className="relative shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
        <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-20" />
      </div>
      <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tighter whitespace-nowrap shrink-0">
        God Mode
      </span>
      <span className="text-[9px] text-amber-600/50 group-hover/imp:text-amber-600 transition-colors hidden sm:inline whitespace-nowrap shrink-0">
        • Exit
      </span>
    </div>
  );
}
