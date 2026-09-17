import { useMemo } from "react";
import { useRouter } from "@/lib/navigation-compat";
import {
  CommandPaletteRoot,
  CommandPaletteInput,
  CommandPaletteGroup,
  CommandPaletteItem,
} from "@k2net/ui";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useSession } from "@/lib/auth-compat";
import { LayoutDashboard, Users, RefreshCw } from "lucide-react";
import {
  type NavActionItem,
  buildStaticNavItems,
  buildActionItems,
} from "./command-palette-items";

export function CommandPaletteContent({
  query,
  onQueryChange,
  onSelectItem,
  className,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSelectItem: (item: NavActionItem) => void;
  className?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { organizations = [] } = useOrganizations();

  const staticNavItems = useMemo(() => buildStaticNavItems(), []);

  const tenantItems = useMemo(() => {
    return organizations.slice(0, 10).map((org) => ({
      id: `tenant-${org.id}`,
      title: `${org.name} (${org.slug})`,
      category: "Tenants" as const,
      url: `/organizations/${org.id}`,
      icon: Users,
      badgeText: org.status || "Tenant",
    }));
  }, [organizations]);

  const actionItems = useMemo(
    () => buildActionItems(session?.accessToken ?? undefined, (path) => router.push(path)),
    [session?.accessToken, router]
  );

  const filteredNav = useMemo(() => {
    if (!query.trim()) return staticNavItems.slice(0, 5);
    const q = query.toLowerCase();
    return staticNavItems.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 8);
  }, [query, staticNavItems]);

  const filteredTenants = useMemo(() => {
    if (!query.trim()) return tenantItems.slice(0, 3);
    const q = query.toLowerCase();
    return tenantItems.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 5);
  }, [query, tenantItems]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actionItems;
    const q = query.toLowerCase();
    return actionItems.filter((i) => i.title.toLowerCase().includes(q));
  }, [query, actionItems]);

  const hasNoResults =
    filteredNav.length === 0 && filteredTenants.length === 0 && filteredActions.length === 0;

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${className || ""}`}>
      <CommandPaletteInput
        value={query}
        onValueChange={onQueryChange}
        placeholder="Search tenants, routes, or system actions..."
      />

      <div className="flex-1 overflow-y-auto p-1 divide-y divide-border/40">
        {filteredNav.length > 0 && (
          <CommandPaletteGroup heading="Quick Navigation">
            {filteredNav.map((item) => (
              <CommandPaletteItem
                key={item.id}
                onSelect={() => onSelectItem(item)}
                icon={item.icon || LayoutDashboard}
                badgeText={item.badgeText}
              >
                {item.title}
              </CommandPaletteItem>
            ))}
          </CommandPaletteGroup>
        )}

        {filteredTenants.length > 0 && (
          <CommandPaletteGroup heading="Tenant & Partner Lookup">
            {filteredTenants.map((item) => (
              <CommandPaletteItem
                key={item.id}
                onSelect={() => onSelectItem(item)}
                icon={item.icon || Users}
                badgeText={item.badgeText}
              >
                {item.title}
              </CommandPaletteItem>
            ))}
          </CommandPaletteGroup>
        )}

        {filteredActions.length > 0 && (
          <CommandPaletteGroup heading="Quick System Actions">
            {filteredActions.map((item) => (
              <CommandPaletteItem
                key={item.id}
                onSelect={() => onSelectItem(item)}
                icon={item.icon || RefreshCw}
                badgeText={item.badgeText}
              >
                {item.title}
              </CommandPaletteItem>
            ))}
          </CommandPaletteGroup>
        )}

        {hasNoResults && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Tidak ada hasil untuk &quot;<span className="font-semibold text-foreground">{query}</span>&quot;
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/80 px-4 py-2 bg-muted/20 text-[10px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border">↑↓</kbd> Select
          </span>
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border">↵</kbd> Open
          </span>
        </div>
        <span>K2NET Enterprise System</span>
      </div>
    </div>
  );
}

export function CommandPaletteModal({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();

  const handleSelectItem = async (item: NavActionItem) => {
    onClose();
    onQueryChange("");
    if (item.action) {
      await item.action();
    } else if (item.url) {
      router.push(item.url);
    }
  };

  return (
    <CommandPaletteRoot open={open} onOpenChange={onOpenChange}>
      <CommandPaletteContent
        query={query}
        onQueryChange={onQueryChange}
        onSelectItem={handleSelectItem}
      />
    </CommandPaletteRoot>
  );
}
