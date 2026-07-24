import type { ReactNode } from "react";

interface OverviewShellProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function OverviewShell({ title, description, action, children }: OverviewShellProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
          {description ? <p className="text-[10px] text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
