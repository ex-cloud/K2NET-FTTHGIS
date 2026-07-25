import { redirect } from "next/navigation";

/**
 * @deprecated Route moved to /observability/compute
 * This redirect ensures backward compatibility for any existing bookmarks or internal links.
 */
export default function HealthPage() {
  redirect("/observability/compute");
}
