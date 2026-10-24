import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation-compat";
import { PageHeaderTabs, type PageTabItem } from "@k2net/ui";

export interface QuickFilterTabOption<T extends string = string> {
  id: T;
  label: string;
  count?: number | string;
  icon?: React.ElementType;
  disabled?: boolean;
}

export interface QuickFilterTabsProps<T extends string = string> {
  paramName?: string;
  defaultTab?: T;
  tabs: QuickFilterTabOption<T>[];
  actions?: React.ReactNode;
  className?: string;
  onTabChange?: (tabId: T) => void;
}

export function QuickFilterTabs<T extends string = string>({
  paramName = "view",
  defaultTab,
  tabs,
  actions,
  className,
  onTabChange,
}: QuickFilterTabsProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get(paramName) as T) || defaultTab || (tabs[0]?.id as T);

  const handleTabChange = React.useCallback(
    (tabId: T) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      if (tabId === defaultTab || tabId === "all") {
        currentParams.delete(paramName);
      } else {
        currentParams.set(paramName, tabId);
      }
      const query = currentParams.toString();
      const targetUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(targetUrl);
      onTabChange?.(tabId);
    },
    [router, pathname, searchParams, paramName, defaultTab, onTabChange]
  );

  const headerTabs: PageTabItem<T>[] = React.useMemo(() => {
    return tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      count: tab.count,
      icon: tab.icon,
      disabled: tab.disabled,
    }));
  }, [tabs]);

  return (
    <PageHeaderTabs
      tabs={headerTabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      actions={actions}
      className={className}
    />
  );
}
