import { History } from "lucide-react";

export default function GlobalSessionsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <History className="w-16 h-16 mb-4 text-zinc-800" />
      <h2 className="text-xl font-semibold text-zinc-300">User Sessions</h2>
      <p className="mt-2 text-sm text-center max-w-sm">
        This section is reserved for monitoring active user sessions globally. The implementation will follow shortly.
      </p>
    </div>
  );
}
