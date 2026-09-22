import * as React from "react";
import { cn } from "../../utils";

export interface PageBreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
  onClick?: () => void;
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  breadcrumbs?: PageBreadcrumbItem[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ElementType;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      breadcrumbs = [],
      badge,
      actions,
      icon: Icon,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between bg-background/95 backdrop-blur-sm select-none",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 text-xs min-w-0 pr-4">
          {breadcrumbs.length > 0 ? (
            <nav aria-label="Breadcrumbs" className="flex items-center gap-2 flex-wrap min-w-0">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const ItemIcon = item.icon;

                return (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="text-muted-foreground/60 select-none">›</span>}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 min-w-0 truncate",
                        isLast
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
                      )}
                      onClick={item.onClick}
                    >
                      {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0 text-primary" />}
                      {item.href && !isLast ? (
                        <a href={item.href} className="hover:underline truncate">
                          {item.label}
                        </a>
                      ) : (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </nav>
          ) : (
            title && (
              <div className="flex items-center gap-2 min-w-0">
                {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
                <h1 className="text-sm font-semibold text-foreground tracking-tight truncate">
                  {title}
                </h1>
              </div>
            )
          )}
          {badge}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {children}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";
