import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Skeleton,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Boxes, Check, AlertTriangle, Power } from "lucide-react";
import type { PlatformModuleItem, ModuleStatus } from "@/hooks/usePlatformModules";
import { ModuleStatusBadge } from "./module-ui-helpers";

interface ModuleFeatureTogglesViewProps {
  modules: PlatformModuleItem[];
  isLoading: boolean;
  isMutating: boolean;
  onStatusChange: (mod: PlatformModuleItem, status: ModuleStatus) => void;
}

export function ModuleFeatureTogglesView({
  modules,
  isLoading,
  isMutating,
  onStatusChange,
}: ModuleFeatureTogglesViewProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 border-border animate-pulse">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-7 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Boxes className="size-8 mx-auto text-muted-foreground/50 mb-2" />
        <span className="font-semibold block text-foreground">
          {t("modules.empty_search_title")}
        </span>
        <p className="text-[11px]">{t("modules.empty_search_desc")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {modules.map((mod) => (
        <Card
          key={mod.code}
          className="border-border/80 bg-card/70 hover:bg-card/90 transition-colors flex flex-col justify-between"
        >
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-muted border border-border text-foreground font-bold">
                  {mod.code}
                </span>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold">
                  {mod.scope}
                </Badge>
              </div>
              <ModuleStatusBadge status={mod.status} />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              {mod.name}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground line-clamp-2">
              {mod.description || "No description provided."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              <span className="truncate">{mod.serviceTarget}</span>
              <span>{mod.permissions?.length ?? 0} perms</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <Button
                variant={mod.status === "ACTIVE" ? "default" : "outline"}
                size="xs"
                disabled={isMutating}
                onClick={() => onStatusChange(mod, "ACTIVE")}
                className="text-[10px] h-6 px-1.5 font-medium"
              >
                <Check className="size-3 mr-1" />
                {t("modules.status_active")}
              </Button>

              <Button
                variant={mod.status === "MAINTENANCE" ? "secondary" : "outline"}
                size="xs"
                disabled={isMutating}
                onClick={() => onStatusChange(mod, "MAINTENANCE")}
                className="text-[10px] h-6 px-1.5 font-medium"
              >
                <AlertTriangle className="size-3 mr-1" />
                {t("modules.status_maintenance")}
              </Button>

              <Button
                variant={mod.status === "DISABLED" ? "destructive" : "outline"}
                size="xs"
                disabled={isMutating}
                onClick={() => onStatusChange(mod, "DISABLED")}
                className="text-[10px] h-6 px-1.5 font-medium text-destructive hover:bg-destructive/10"
              >
                <Power className="size-3 mr-1" />
                {t("modules.status_disabled")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
