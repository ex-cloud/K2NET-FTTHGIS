"use client";

import { redirect } from "next/navigation";
import { use } from "react";

export default function InventoryPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = use(params);
  redirect(`/org/${orgId}/project/${projectId}/inventory/odc`);
}
