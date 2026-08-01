"use client";

import { LogsContainer } from "@/components/logs/logs-container";
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";

export default function GlobalLogsPage() {
  return (
    <SystemHealthWrapper>
      <LogsContainer />
    </SystemHealthWrapper>
  );
}
