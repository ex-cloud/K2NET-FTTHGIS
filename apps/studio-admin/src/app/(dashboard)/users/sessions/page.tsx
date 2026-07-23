import { History } from "lucide-react";
import { UserSessionPageWrapper } from "@/components/page-guards/user-session-page-wrapper";

export default function GlobalSessionsPage() {
  return (
    <UserSessionPageWrapper>
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <History className="w-16 h-16 mb-4 text-muted-foreground/30" />
      <h2 className="text-xl font-semibold text-foreground">User Sessions</h2>
      <p className="mt-2 text-sm text-center max-w-sm">
        This section is reserved for monitoring active user sessions globally. The implementation will follow shortly.
      </p>
    </div>
    </UserSessionPageWrapper>
  );
}
