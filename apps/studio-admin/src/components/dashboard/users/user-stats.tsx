

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Users, UserCheck, Clock } from "lucide-react";
import { useTranslation } from "@k2net/i18n";

interface UserStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    pendingRequests: number;
  } | null;
}

export function UserStats({ stats }: UserStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Total Users */}
      <Card glowingEffect>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span>{t("users.total_users")}</span>
            <Users className="w-3.5 h-3.5 text-primary group-hover:text-primary/80 transition-colors" />
          </CardDescription>
          <CardTitle className="mt-1 text-2xl font-bold text-foreground">
            {stats?.totalUsers.toLocaleString() || "0"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-[10px] text-muted-foreground">{t("users.total_users_desc")}</div>
        </CardContent>
      </Card>

      {/* Active Now */}
      <Card glowingEffect>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span>{t("users.active_now")}</span>
            <UserCheck className="w-3.5 h-3.5 text-primary group-hover:text-primary/80 transition-colors" />
          </CardDescription>
          <CardTitle className="mt-1 text-2xl font-bold text-primary">
            {stats?.activeUsers.toLocaleString() || "0"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-[10px] text-muted-foreground">{t("users.active_now_desc")}</div>
        </CardContent>
      </Card>

      {/* Open Requests */}
      <Card glowingEffect>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <span>{t("users.open_requests")}</span>
            <Clock className="w-3.5 h-3.5 text-primary group-hover:text-primary/80 transition-colors" />
          </CardDescription>
          <CardTitle className="mt-1 text-2xl font-bold text-foreground">
            {stats?.pendingRequests.toString() || "0"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-[10px] text-muted-foreground">{t("users.open_requests_desc")}</div>
        </CardContent>
      </Card>
    </div>
  );
}
