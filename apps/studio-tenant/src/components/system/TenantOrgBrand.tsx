import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ActionTooltip, cn } from "@k2net/ui";
import { Boxes, ShieldAlert } from "lucide-react";
import { useTenantInfo } from "../../hooks/useTenantInfo";
import { useImpersonationSession } from "../../lib/useImpersonationSession";

export interface TenantLogoProps {
  logoUrl?: string;
  name?: string;
  href?: string;
  className?: string;
}

export function TenantLogo({
  logoUrl,
  name,
  href = "/projects",
  className,
}: TenantLogoProps) {
  const { logoUrl: resolvedLogoUrl, organizationName } = useTenantInfo();
  const effectiveLogoUrl = logoUrl ?? resolvedLogoUrl;
  const effectiveName = name ?? organizationName;

  const content = (
    <div
      className={cn(
        "flex size-6 sm:size-7 items-center justify-center rounded-lg bg-muted/50 border border-border/80 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors shrink-0 overflow-hidden cursor-pointer",
        className
      )}
    >
      {effectiveLogoUrl ? (
        <img
          src={effectiveLogoUrl}
          alt={effectiveName}
          className="size-full object-contain p-0.5"
        />
      ) : (
        <Boxes className="size-3.5 sm:size-4 text-foreground/80" />
      )}
    </div>
  );

  return (
    <ActionTooltip label="Back to Organization Home" side="bottom">
      {href ? (
        <Link
          to={href}
          className="inline-flex focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </ActionTooltip>
  );
}

export interface TenantOrgNameProps {
  name?: string;
  href?: string;
  className?: string;
  maxTruncateWidthClass?: string;
}

export function TenantOrgName({
  name,
  href = "/projects",
  className,
  maxTruncateWidthClass = "max-w-[140px] xs:max-w-[180px] sm:max-w-[240px] md:max-w-[320px]",
}: TenantOrgNameProps) {
  const { organizationName, isLoading } = useTenantInfo();
  const resolvedName = name ?? organizationName;

  if (isLoading && !name) {
    return (
      <div
        className={cn(
          "h-4 w-20 sm:w-28 bg-muted/60 animate-pulse rounded select-none shrink-0",
          className
        )}
      />
    );
  }

  const content = (
    <span
      className={cn(
        "text-sm font-semibold tracking-tight text-foreground hover:opacity-85 transition-opacity truncate cursor-pointer select-none",
        maxTruncateWidthClass,
        className
      )}
    >
      {resolvedName}
    </span>
  );

  return (
    <ActionTooltip label={`Organization: ${resolvedName}`} side="bottom">
      {href ? (
        <Link
          to={href}
          className="inline-flex focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </ActionTooltip>
  );
}

export interface TenantOrgBrandProps {
  name?: string;
  logoUrl?: string;
  href?: string;
  showLogo?: boolean;
  showSeparator?: boolean;
  hideNameOnMobile?: boolean;
  className?: string;
  maxTruncateWidthClass?: string;
}

export function TenantOrgBrand({
  name,
  logoUrl,
  href = "/projects",
  showLogo = true,
  showSeparator = true,
  hideNameOnMobile = false,
  className,
  maxTruncateWidthClass,
}: TenantOrgBrandProps) {
  const { isImpersonating } = useImpersonationSession();

  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0", className)}>
      {showLogo && <TenantLogo logoUrl={logoUrl} name={name} href={href} />}

      {showLogo && showSeparator && (
        <span
          className="hidden sm:inline-flex items-center justify-center text-muted-foreground/30 font-mono text-xs sm:text-sm select-none shrink-0 w-3"
          aria-hidden="true"
        >
          /
        </span>
      )}

      <TenantOrgName
        name={name}
        href={href}
        className={cn(hideNameOnMobile && "hidden sm:inline-block")}
        maxTruncateWidthClass={maxTruncateWidthClass}
      />

      {isImpersonating && (
        <ActionTooltip
          label="Sesi Bantuan Darurat Aktif: Super Admin sedang mengimpersonasi workspace ini untuk troubleshooting"
          side="bottom"
        >
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse select-none shrink-0 shadow-xs cursor-help">
            <ShieldAlert className="size-2.5 shrink-0" />
            <span className="hidden xs:inline">MODE BANTUAN</span>
            <span className="xs:hidden">ASSIST</span>
          </span>
        </ActionTooltip>
      )}
    </div>
  );
}
