import { NotFoundError } from "@k2net/ui";

export default function NotFound() {
  return <NotFoundError backUrl="/organizations" />;
}
