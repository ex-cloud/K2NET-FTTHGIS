import { type ReactNode } from "react";
import { PermissionGuard } from "@/hooks/use-permissions";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "@k2net/i18n";

interface AiPageWrapperProps {
  children: ReactNode;
}

export function AiPageWrapper({ children }: AiPageWrapperProps) {
  const { t } = useTranslation();

  return (
    <PermissionGuard
      permission="system.ai.manage"
      fallback={
        <div className="flex-1 w-full bg-transparent overflow-auto custom-scrollbar flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">{t("security.access_denied")}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {t("security.access_denied_ai")}
            </p>
          </div>
        </div>
      }
    >
      {children}
    </PermissionGuard>
  );
}
