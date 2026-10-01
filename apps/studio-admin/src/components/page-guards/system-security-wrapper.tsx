import { type ReactNode } from "react";
import { PermissionGuard } from "@/hooks/use-permissions";
import { Shield } from "lucide-react";
import { useTranslation } from "@k2net/i18n";

interface SystemSecurityWrapperProps {
  children: ReactNode;
}

export function SystemSecurityWrapper({ children }: SystemSecurityWrapperProps) {
  const { t } = useTranslation();

  return (
    <PermissionGuard
      permission="system.security.manage"
      fallback={
        <div className="flex-1 w-full bg-transparent overflow-auto custom-scrollbar flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">{t("security.access_denied")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("security.access_denied_security")}
            </p>
          </div>
        </div>
      }
    >
      {children}
    </PermissionGuard>
  );
}
