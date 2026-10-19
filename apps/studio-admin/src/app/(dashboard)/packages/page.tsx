import * as React from "react";
import { PageHero, Button, PageLayout, toast } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Boxes,
  Plus,
  RefreshCcw,
  FlaskConical,
  Network,
} from "lucide-react";
import { useSearchParams, useRouter } from "@/lib/navigation-compat";
import {
  usePlatformPackages,
  usePackageKpiOverview,
  useCreatePackage,
  useUpdatePackage,
  useTogglePublishPackage,
  useGrantPackage,
  type PlatformPackageItem,
  type CreatePackagePayload,
  type UpdatePackagePayload,
  type GrantPackagePayload,
} from "@/hooks/usePlatformPackages";
import { PackageKpiCards } from "@/components/packages/PackageKpiCards";
import { PackageCatalogGrid } from "@/components/packages/PackageCatalogGrid";
import { EditPackageModal } from "@/components/packages/EditPackageModal";
import { GrantPackageModal } from "@/components/packages/GrantPackageModal";
import { DependencyMatrixModal } from "@/components/packages/DependencyMatrixModal";

export default function PackagesPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCategory = searchParams.get("category") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlLifecycle = searchParams.get("lifecycle") || "";
  const urlAction = searchParams.get("action") || "";
  const urlView = searchParams.get("view") || "";

  // Modals state
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [packageToEdit, setPackageToEdit] = React.useState<PlatformPackageItem | null>(null);
  const [grantModalOpen, setGrantModalOpen] = React.useState(urlAction === "grant");
  const [matrixModalOpen, setMatrixModalOpen] = React.useState(urlView === "rules");
  const [selectedForGrant, setSelectedForGrant] = React.useState<PlatformPackageItem | null>(null);

  React.useEffect(() => {
    if (urlAction === "grant") {
      setGrantModalOpen(true);
    }
    if (urlView === "rules") {
      setMatrixModalOpen(true);
    }
  }, [urlAction, urlView]);

  // Queries
  const {
    data: packages = [],
    isLoading: isPackagesLoading,
    refetch: refetchPackages,
  } = usePlatformPackages();

  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = usePackageKpiOverview();

  // Mutations
  const createPackageMutation = useCreatePackage();
  const updatePackageMutation = useUpdatePackage();
  const togglePublishMutation = useTogglePublishPackage();
  const grantPackageMutation = useGrantPackage();

  const handleRefresh = () => {
    refetchPackages();
    refetchOverview();
  };

  const handleCreateNew = () => {
    setPackageToEdit(null);
    setEditModalOpen(true);
  };

  const handleEdit = (pkg: PlatformPackageItem) => {
    setPackageToEdit(pkg);
    setEditModalOpen(true);
  };

  const handleGrant = (pkg: PlatformPackageItem) => {
    setSelectedForGrant(pkg);
    setGrantModalOpen(true);
  };

  const handleTogglePublish = async (code: string, published: boolean) => {
    try {
      await togglePublishMutation.mutateAsync({ code, published });
      toast.success(
        published
          ? t("packages.toast_published", { code })
          : t("packages.toast_unpublished", { code })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("packages.toast_publish_failed");
      toast.error(msg);
    }
  };

  const handleSavePackage = async (payload: CreatePackagePayload) => {
    try {
      await createPackageMutation.mutateAsync(payload);
      toast.success(t("packages.toast_create_success", { code: payload.packageCode }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("packages.toast_create_failed");
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdatePackage = async (code: string, payload: UpdatePackagePayload) => {
    try {
      await updatePackageMutation.mutateAsync({ code, payload });
      toast.success(t("packages.toast_update_success", { code }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("packages.toast_update_failed");
      toast.error(msg);
      throw err;
    }
  };

  const handleGrantPackage = async (payload: GrantPackagePayload) => {
    try {
      await grantPackageMutation.mutateAsync(payload);
      toast.success(t("packages.grant_modal.success_toast"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("packages.toast_grant_failed");
      toast.error(msg);
      throw err;
    }
  };

  const setCategoryFilter = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    router.push(`/packages${qs}`);
  };

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    router.push(`/packages${qs}`);
  };

  const setLifecycleFilter = (lifecycle: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (lifecycle) {
      params.set("lifecycle", lifecycle);
    } else {
      params.delete("lifecycle");
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    router.push(`/packages${qs}`);
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Command Center Hero Header */}
      <PageHero
        bordered={false}
        className="pb-0"
          eyebrow={t("packages.hero_eyebrow")}
          title={t("packages.cmd_center_title")}
          icon={Boxes}
          subtitle={t("packages.cmd_center_desc")}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMatrixModalOpen(true)}
                className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md"
              >
                <Network className="h-3.5 w-3.5" />
                {t("packages.btn_matrix")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedForGrant(null);
                  setGrantModalOpen(true);
                }}
                className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {t("packages.btn_grant_package")}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-7 px-2 text-xs font-medium gap-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                {t("packages.btn_refresh")}
              </Button>

              <Button
                size="sm"
                onClick={handleCreateNew}
                className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md shadow-xs bg-foreground text-background"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("packages.btn_create_package")}
              </Button>
            </div>
          }
        />

      {/* KPI Cards Overview */}
      <PackageKpiCards
        overview={overview}
        packages={packages}
        loading={isPackagesLoading || isOverviewLoading}
      />

      {/* Catalog Grid with category, status, and lifecycle tabs */}
      <PackageCatalogGrid
        packages={packages}
        loading={isPackagesLoading}
        selectedCategory={urlCategory}
        selectedStatus={urlStatus}
        selectedLifecycle={urlLifecycle}
        onSelectCategory={setCategoryFilter}
        onSelectStatus={setStatusFilter}
        onSelectLifecycle={setLifecycleFilter}
        onEditPackage={handleEdit}
        onTogglePublish={handleTogglePublish}
        onGrantPackage={handleGrant}
      />

      {/* Create / Edit Modal */}
      <EditPackageModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        packageToEdit={packageToEdit}
        existingPackages={packages}
        onSave={handleSavePackage}
        onUpdate={handleUpdatePackage}
      />

      {/* Grant POC Modal */}
      <GrantPackageModal
        open={grantModalOpen}
        onOpenChange={(open) => {
          setGrantModalOpen(open);
          if (!open && urlAction === "grant") {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("action");
            const qs = params.toString() ? `?${params.toString()}` : "";
            router.push(`/packages${qs}`);
          }
        }}
        initialPackage={selectedForGrant}
        packages={packages}
        onGrant={handleGrantPackage}
      />

      {/* Dependency Rules Matrix Modal */}
      <DependencyMatrixModal
        open={matrixModalOpen}
        onOpenChange={(open) => {
          setMatrixModalOpen(open);
          if (!open && urlView === "rules") {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("view");
            const qs = params.toString() ? `?${params.toString()}` : "";
            router.push(`/packages${qs}`);
          }
        }}
        packages={packages}
      />
    </PageLayout>
  );
}
