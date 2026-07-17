import { ShieldCheck } from "lucide-react";
import { SystemRolesPageWrapper } from "@/components/page-guards/system-roles-page-wrapper";

export default function GlobalRolesPage() {
  return (
    <SystemRolesPageWrapper>
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <ShieldCheck className="w-16 h-16 mb-4 text-zinc-800" />
      <h2 className="text-xl font-semibold text-zinc-300">Global Roles</h2>
      <p className="mt-2 text-sm text-center max-w-sm">
        This section is reserved for managing system-wide roles and permissions. The implementation will follow shortly.
      </p>
    </div>
    </SystemRolesPageWrapper>
  );
}
