"use client";

import { redirect } from "next/navigation";
import { use } from "react";
import { InventoryPageWrapper } from "@/components/page-guards/inventory-page-wrapper";

export default function InventoryPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = use(params);

  return (
    <InventoryPageWrapper>
      <div className="hidden">
        {redirect(`/org/${orgId}/project/${projectId}/inventory/odc`)}
      </div>
    </InventoryPageWrapper>
  );
}
