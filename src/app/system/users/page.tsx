import { UserStats } from "@/components/dashboard/users/user-stats";
import { UserTable } from "@/components/dashboard/users/user-table";
import { UserFilters } from "@/components/dashboard/users/user-filters";
import { auth } from "@/auth";
import { getUsers, getUserStats } from "@/lib/api/users";

export default async function GlobalUsersPage(props: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    role?: string;
    status?: string;
    org?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 0;
  const search = searchParams.q || "";

  const session = await auth();
  const token = session?.accessToken as string | undefined;

  let usersData = null;
  let statsData = null;

  if (token) {
    try {
      const [users, stats] = await Promise.all([
        getUsers(page, 10, search, searchParams.role, searchParams.status, searchParams.org, token),
        getUserStats(token),
      ]);
      usersData = users;
      statsData = stats;
    } catch (e) {
      console.error("Fetch global users error", e);
    }
  }

  return (
    <div className="flex-1 flex w-full min-h-0 overflow-hidden bg-[#0c0c0c] relative">

      <div className="flex-1 w-full min-w-0 p-4 md:p-8 overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full pb-8 h-full flex flex-col space-y-6">
          <div className="shrink-0">
            <UserStats stats={statsData} />
          </div>
          <div className="flex-1 min-h-0">
            <UserTable data={usersData} currentPage={page} isGlobalView={true} />
          </div>
        </div>
      </div>
      
      <UserFilters />
    </div>
  );
}
