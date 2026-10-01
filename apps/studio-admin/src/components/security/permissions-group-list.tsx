import { Loader2 } from "lucide-react";
import type { Permission } from "./permissions-types";
import { ModuleGroup } from "./permissions-module-group";
import { useTranslation } from "@k2net/i18n";

interface PermissionsGroupListProps {
  isLoading: boolean;
  moduleKeys: string[];
  grouped: Record<string, Permission[]>;
  onDelete: (p: Permission) => void;
  onViewUsages: (code: string) => void;
}

export function PermissionsGroupList({
  isLoading,
  moduleKeys,
  grouped,
  onDelete,
  onViewUsages,
}: PermissionsGroupListProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 bg-card/20 rounded-xl border border-border">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (moduleKeys.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-border rounded-xl bg-card/20">
        {t("security.no_permission_match")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {moduleKeys.map((mod) => (
        <ModuleGroup
          key={mod}
          module={mod}
          permissions={grouped[mod]}
          onDelete={onDelete}
          onViewUsages={onViewUsages}
        />
      ))}
    </div>
  );
}
