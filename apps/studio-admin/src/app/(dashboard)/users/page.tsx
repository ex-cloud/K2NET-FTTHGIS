import { useSearchParams } from "@/lib/navigation-compat";
import { UserStats } from "@/components/dashboard/users/user-stats";
import { UserTable } from "@/components/dashboard/users/user-table";
import { UserFilters } from "@/components/dashboard/users/user-filters";
import { UsersPageWrapper } from "@/components/page-guards/users-page-wrapper";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@k2net/auth/client";
import { getUsers, getUserStats } from "@/lib/api/users";
import { PageLayout } from "@k2net/ui";

export default function GlobalUsersPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 0;
  const search = searchParams.get("q") || "";
  const role = searchParams.get("role") || undefined;
  const status = searchParams.get("status") || undefined;
  const org = searchParams.get("org") || undefined;
  const { token } = useAuth();

  const { data: usersData } = useQuery({
    queryKey: ["users", page, search, role, status, org],
    queryFn: () => getUsers(page, 10, search, role, status, org, token || ""),
    enabled: !!token,
  });

  const { data: statsData } = useQuery({
    queryKey: ["userStats"],
    queryFn: () => getUserStats(token || ""),
    enabled: !!token,
  });

  return (
    <UsersPageWrapper>
      <PageLayout
        variant="workspace"
        sidePanel={<UserFilters />}
      >
        <div className="shrink-0">
          <UserStats stats={statsData ?? null} />
        </div>
        <div className="flex-1 min-h-0">
          <UserTable data={usersData ?? null} currentPage={page} isGlobalView={true} token={token || undefined} />
        </div>
      </PageLayout>
    </UsersPageWrapper>
  );
}
