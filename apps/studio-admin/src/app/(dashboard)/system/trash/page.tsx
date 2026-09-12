import { useState } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTrashCan, type TrashItem } from "@/hooks/useTrashCan";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/hooks/use-permissions";
import { TrashKpiCards } from "@/components/system/trash/trash-kpi-cards";
import { TrashTable } from "@/components/system/trash/trash-table";
import { TrashDialogs } from "@/components/system/trash/trash-dialogs";

export default function TrashCanPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeItemToDelete, setActiveItemToDelete] = useState<TrashItem | null>(null);
  const [activeItemToRestore, setActiveItemToRestore] = useState<TrashItem | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const {
    items,
    stats,
    loading,
    refresh,
    restoreItem,
    permanentDelete,
    emptyTrash,
  } = useTrashCan(selectedCategory, searchQuery);

  const handleConfirmRestore = async () => {
    if (!activeItemToRestore) return;
    setIsProcessing(true);
    await restoreItem(
      activeItemToRestore.type,
      activeItemToRestore.id,
      activeItemToRestore.name
    );
    setIsProcessing(false);
    setActiveItemToRestore(null);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!activeItemToDelete) return;
    setIsProcessing(true);
    await permanentDelete(
      activeItemToDelete.type,
      activeItemToDelete.id,
      activeItemToDelete.name
    );
    setIsProcessing(false);
    setActiveItemToDelete(null);
  };

  const handleConfirmEmptyTrash = async () => {
    setIsProcessing(true);
    await emptyTrash(selectedCategory);
    setIsProcessing(false);
    setShowEmptyConfirm(false);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Recycle Bin &amp; Data Recovery
              </h1>
              <p className="text-xs text-muted-foreground">
                Manajemen pemulihan data dan kebijakan retensi otomatis 30 hari
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>

          {stats.total > 0 && (
            <PermissionGuard permission="system.trash.manage">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowEmptyConfirm(true)}
                className="h-9 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Kosongkan Recycle Bin
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Overview KPI Cards */}
      <TrashKpiCards stats={stats} />

      {/* Main Table Card */}
      <TrashTable
        items={items}
        stats={stats}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onRestoreClick={(item) => setActiveItemToRestore(item)}
        onDeleteClick={(item) => setActiveItemToDelete(item)}
      />

      {/* Dialogs */}
      <TrashDialogs
        activeItemToRestore={activeItemToRestore}
        onCloseRestore={() => setActiveItemToRestore(null)}
        onConfirmRestore={handleConfirmRestore}
        activeItemToDelete={activeItemToDelete}
        onCloseDelete={() => setActiveItemToDelete(null)}
        onConfirmDelete={handleConfirmPermanentDelete}
        showEmptyConfirm={showEmptyConfirm}
        onCloseEmptyConfirm={() => setShowEmptyConfirm(false)}
        onConfirmEmptyTrash={handleConfirmEmptyTrash}
        isProcessing={isProcessing}
        totalStats={stats.total}
      />
    </div>
  );
}
