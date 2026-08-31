

import { ReactNode } from "react";
import { PermissionGuard } from "@/hooks/use-permissions";
import { Shield } from "lucide-react";

interface UsersPageWrapperProps {
  children: ReactNode;
}

export function UsersPageWrapper({ children }: UsersPageWrapperProps) {
  return (
    <PermissionGuard
      permission="users.view"
      fallback={
        <div className="flex-1 w-full bg-transparent overflow-auto custom-scrollbar flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              You do not have permission to view users management.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </PermissionGuard>
  );
}
