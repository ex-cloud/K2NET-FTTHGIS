import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ActionTooltip, cn } from "@k2net/ui";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@k2net/auth/client";
import { useImpersonationSession } from "../../lib/useImpersonationSession";

export interface TenantOrgBrandProps {
  name?: string;
  logoUrl?: string;
  href?: string;
  showLogo?: boolean;
  showSeparator?: boolean;
  className?: string;
  maxTruncateWidthClass?: string;
}

export function TenantOrgBrand({
  name,
  logoUrl,
  href = "/projects",
  showLogo = true,
  showSeparator = true,
  className,
  maxTruncateWidthClass = "max-w-[120px] xs:max-w-[160px] sm:max-w-[220px] md:max-w-[280px]",
}: TenantOrgBrandProps) {
  const { user } = useAuth();
  const { isImpersonating, tenantName: impersonatedTenantName } = useImpersonationSession();

  // Resolve official organization name with graceful fallbacks
  const resolvedName = React.useMemo(() => {
    if (name) return name;
    if (isImpersonating && impersonatedTenantName) return impersonatedTenantName;
    if (user?.tenantSlug) {
      if (user.tenantSlug.toLowerCase() === "kircon") {
        return "PT Kircon Mandiri Telekom";
      }
      return `PT ${user.tenantSlug.toUpperCase()} Networks`;
    }
    return "PT Kircon Mandiri Telekom";
  }, [name, isImpersonating, impersonatedTenantName, user?.tenantSlug]);

  const brandContent = (
    <div className={cn("flex items-center gap-2 group cursor-pointer select-none", className)}>
      {showLogo && (
        <div className="flex size-6 sm:size-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 group-hover:border-primary/60 transition-colors shrink-0 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={resolvedName} className="size-full object-contain p-0.5" />
          ) : (
            <ShieldCheck className="size-3.5 sm:size-4 text-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          )}
        </div>
      )}

      <span
        className={cn(
          "text-xs sm:text-sm font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors truncate",
          maxTruncateWidthClass
        )}
      >
        {resolvedName}
      </span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 min-w-0 shrink-0">
      <ActionTooltip label={`Organisasi: ${resolvedName} • Klik untuk daftar proyek`} side="bottom">
        {href ? (
          <Link to={href} className="inline-flex focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg">
            {brandContent}
          </Link>
        ) : (
          brandContent
        )}
      </ActionTooltip>

      {showSeparator && (
        <span className="text-muted-foreground/40 font-mono text-xs sm:text-sm select-none" aria-hidden="true">
          /
        </span>
      )}
    </div>
  );
}
