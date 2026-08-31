

import { ReactNode } from "react";
import { PermissionGuard } from "@/hooks/use-permissions";
import { Sparkles, ShieldAlert } from "lucide-react";

interface AiPageWrapperProps {
  children: ReactNode;
}

export function AiPageWrapper({ children }: AiPageWrapperProps) {
  return (
    <PermissionGuard
      permission="orgs.manage"
      fallback={
        <div className="flex-1 w-full bg-transparent overflow-auto custom-scrollbar flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">Akses Ditolak</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Anda tidak memiliki hak akses yang cukup untuk mengelola modul AI Assistant & Copilot Knowledge Base.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </PermissionGuard>
  );
}
