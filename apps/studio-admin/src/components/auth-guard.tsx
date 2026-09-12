import { useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-compat";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as { error?: string } | null | undefined)?.error === "RefreshAccessTokenError") {
      signOut();
    }
  }, [session]);

  return <>{children}</>;
}
