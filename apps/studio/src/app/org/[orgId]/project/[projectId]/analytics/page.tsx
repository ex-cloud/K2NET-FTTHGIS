"use client";

import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { AnalyticsPageWrapper } from "@/components/page-guards/analytics-page-wrapper";

export default function AnalyticsPage() {
  return (
    <AnalyticsPageWrapper>
      <div className="flex-1 w-full bg-transparent overflow-auto">
        <ExecutiveDashboard />
      </div>
    </AnalyticsPageWrapper>
  );
}
