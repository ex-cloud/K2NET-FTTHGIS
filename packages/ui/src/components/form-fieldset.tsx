import * as React from "react";
import { cn } from "../utils";

/**
 * FormFieldset - Supabase Studio style 2-Column Key-Value Settings Section.
 * Left column: Title, subtitle/description, optional docs link.
 * Right column: Controls, inputs, switches, or custom action items.
 */
export interface FormFieldsetProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  docsUrl?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  isSubSection?: boolean;
}

export function FormFieldset({
  className,
  title,
  description,
  docsUrl,
  badge,
  children,
  footer,
  isSubSection = false,
  ...props
}: FormFieldsetProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-5",
        !isSubSection && "border-b border-border/60 last:border-b-0",
        className
      )}
      {...props}
    >
      {/* Left Column: Title & Description */}
      {(title || description) && (
        <div className="md:col-span-4 space-y-1">
          <div className="flex items-center gap-2">
            {typeof title === "string" ? (
              <h4 className="text-xs md:text-sm font-medium text-foreground tracking-tight">
                {title}
              </h4>
            ) : (
              title
            )}
            {badge}
          </div>
          {description && (
            <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[11px] text-primary hover:underline mt-1 font-medium"
            >
              Dokumentasi &rarr;
            </a>
          )}
        </div>
      )}

      {/* Right Column: Controls & Actions */}
      <div
        className={cn(
          title || description ? "md:col-span-8" : "md:col-span-12",
          "space-y-3"
        )}
      >
        {children}
        {footer && <div className="pt-2 border-t border-border/40">{footer}</div>}
      </div>
    </div>
  );
}

export interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export function FormSection({
  className,
  title,
  description,
  children,
  headerAction,
  ...props
}: FormSectionProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between bg-muted/10">
        <div className="space-y-0.5">
          {typeof title === "string" ? (
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          ) : (
            title
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="px-5 divide-y divide-border/40">{children}</div>
    </div>
  );
}
