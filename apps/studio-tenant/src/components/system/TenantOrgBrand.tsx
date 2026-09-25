import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ActionTooltip, cn } from "@k2net/ui";
import { Boxes } from "lucide-react";
import { useTenantInfo } from "../../hooks/useTenantInfo";

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
  const { organizationName } = useTenantInfo();
  const resolvedName = name ?? organizationName;

  const content = (
    <span
      className={cn(
        "text-xs sm:text-sm font-bold tracking-tight text-foreground hover:opacity-85 transition-opacity truncate cursor-pointer select-none",
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
  maxTruncateWidthClass,
}: TenantOrgBrandProps) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0 shrink-0", className)}>
      {showLogo && <TenantLogo logoUrl={logoUrl} name={name} href={href} />}

      {showLogo && showSeparator && (
        <span
          className="text-muted-foreground/40 font-mono text-xs sm:text-sm select-none"
          aria-hidden="true"
        >
          /
        </span>
      )}

      <TenantOrgName
        name={name}
        href={href}
        maxTruncateWidthClass={maxTruncateWidthClass}
      />
    </div>
  );
}
