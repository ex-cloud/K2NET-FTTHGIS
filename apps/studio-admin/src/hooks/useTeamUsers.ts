

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";

export interface TeamUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export function useTeamUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;

    let mounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const baseUrl = getBackendBaseUrl();
        const res = await httpClient(`${baseUrl}/users?page=0&size=100`, {
          token: session.accessToken ?? undefined,
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.content || data.users || (Array.isArray(data) ? data : []);
          if (mounted) {
            setUsers(
              list.map((u: any) => ({
                id: u.id || u.username || u.email,
                email: u.email || u.username || u.id,
                name:
                  u.name || (u.firstName
                    ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                    : u.email?.split("@")[0] || u.username || u.id),
                role: u.role || (Array.isArray(u.roles) ? u.roles[0] : "Member"),
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load team users", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      mounted = false;
    };
  }, [session?.accessToken]);

  return { users, loading };
}
