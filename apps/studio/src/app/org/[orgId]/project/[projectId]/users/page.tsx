import { UserStats } from "@/components/dashboard/users/user-stats";
import { UserTable } from "@/components/dashboard/users/user-table";
import { UserFilters } from "@/components/dashboard/users/user-filters";
import { UserSearch } from "@/components/dashboard/users/user-search";
import {
  UserPlus,
  Bell,
  ChevronRight,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { getTenantUsers, getTenantUserStats } from "@/lib/api/users";

export default async function UserManagementPage(props: {
  params: Promise<{ orgId: string; projectId: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    role?: string;
    status?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const page = Number(searchParams.page) || 0;
  const search = searchParams.q || "";

  const session = await auth();
  const token = session?.accessToken as string | undefined;

  let usersData = null;
  let statsData = null;

  if (token) {
    try {
      const [users, stats] = await Promise.all([
        getTenantUsers(
          params.orgId,
          page,
          10,
          search,
          searchParams.role,
          searchParams.status,
          token,
        ),
        getTenantUserStats(params.orgId, token),
      ]);
      usersData = users;
      statsData = stats;
    } catch (e) {
      // Log error but render page
      console.error("Fetch users/stats error", e);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background relative">
      {/* Grid Background Effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Main Content (Left + Center) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Custom Header for User Module */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-border/40 bg-background/50 backdrop-blur shrink-0">
          {/* Module Breadcrumb */}
          <nav className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <span className="flex items-center gap-2">
              <LayoutDashboard className="w-3 h-3" />
              System
            </span>
            <ChevronRight className="w-3 h-3" />
            <span>Access Control</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground flex items-center gap-2">
              <Shield className="w-3 h-3 text-primary" />
              User Management
            </span>
          </nav>

          {/* Search Bar */}
          <div className="flex-1 max-w-md px-4 lg:px-12">
            <UserSearch placeholder="Search user ID, name, or terminal..." />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold text-xs uppercase tracking-tight h-9">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
            <div className="h-6 w-px bg-border/40 mx-2 hidden sm:block"></div>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground hidden sm:flex"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <UserStats stats={statsData} />
          <UserTable data={usersData} currentPage={page} token={token} />
        </div>
      </div>

      {/* Right Sidebar Filters */}
      <UserFilters />
    </div>
  );
}
