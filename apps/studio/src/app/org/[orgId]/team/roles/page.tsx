import { RolesMatrixUI } from "@/components/roles-matrix-ui";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roles & Permissions | FTTH GIS",
  description: "Manage roles and permissions for your organization.",
};

export default function OrgRolesPage() {
  return (
    <div className="flex-1 w-full min-w-0 p-4 md:p-8 overflow-hidden">
      <div className="max-w-[1600px] mx-auto w-full pb-8">
        <RolesMatrixUI context="tenant" />
      </div>
    </div>
  );
}
