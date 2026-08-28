"use client";

import { useState } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Building2,
  FolderKanban,
  ClipboardList,
  Network,
  Search,
  RefreshCw,
  Clock,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import { useTrashCan, TrashItem } from "@/hooks/useTrashCan";
import { cn } from "@/lib/utils";

export default function TrashCanPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeItemToDelete, setActiveItemToDelete] = useState<TrashItem | null>(null);
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

  const getItemIcon = (type: TrashItem["type"]) => {
    switch (type) {
      case "ORGANIZATION":
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case "PROJECT":
        return <FolderKanban className="h-4 w-4 text-primary" />;
      case "TASK":
        return <ClipboardList className="h-4 w-4 text-amber-500" />;
      case "NETWORK_NODE":
      case "NETWORK_EDGE":
        return <Network className="h-4 w-4 text-purple-500" />;
      default:
        return <Trash2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: TrashItem["type"]) => {
    switch (type) {
      case "ORGANIZATION":
        return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">Tenant Org</Badge>;
      case "PROJECT":
        return <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">GIS Project</Badge>;
      case "TASK":
        return <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">Task / Issue</Badge>;
      case "NETWORK_NODE":
        return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">Network Node</Badge>;
      case "NETWORK_EDGE":
        return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">Fiber Cable</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Asset</Badge>;
    }
  };

  const getRetentionBadge = (days: number) => {
    if (days <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
          <Clock className="h-3 w-3" />
          Purge in {days}d
        </span>
      );
    }
    if (days <= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="h-3 w-3" />
          Purge in {days}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-muted-foreground border border-border/50">
        <Clock className="h-3 w-3" />
        {days} hari tersisa
      </span>
    );
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
                Recycle Bin & Data Recovery
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
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmptyConfirm(true)}
              className="h-9 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Kosongkan Recycle Bin
            </Button>
          )}
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total di Trash</div>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Organizations</div>
            <div className="text-2xl font-bold font-mono text-blue-500 mt-1">
              {stats.organizations}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">GIS Projects</div>
            <div className="text-2xl font-bold font-mono text-primary mt-1">
              {stats.projects}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Tasks & Tickets</div>
            <div className="text-2xl font-bold font-mono text-amber-500 mt-1">
              {stats.tasks}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Network Assets</div>
            <div className="text-2xl font-bold font-mono text-purple-500 mt-1">
              {stats.networkAssets}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="p-4 border-b border-border/40 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-3 sm:grid-cols-5 h-9 bg-muted/60">
                <TabsTrigger value="all" className="text-xs">
                  Semua ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="organizations" className="text-xs">
                  Tenant ({stats.organizations})
                </TabsTrigger>
                <TabsTrigger value="projects" className="text-xs">
                  Proyek ({stats.projects})
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">
                  Tasks ({stats.tasks})
                </TabsTrigger>
                <TabsTrigger value="assets" className="text-xs">
                  Aset ({stats.networkAssets})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari data terhapus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-full bg-muted/50 text-muted-foreground">
                <Trash2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Recycle Bin Kosong
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Tidak ada entitas yang sedang berada di Recycle Bin. Data yang dihapus akan otomatis disimpan di sini selama 30 hari.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-muted-foreground uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-3 px-4 font-semibold">Entitas & Nama</th>
                    <th className="py-3 px-4 font-semibold">Tipe</th>
                    <th className="py-3 px-4 font-semibold">Asal Tenant</th>
                    <th className="py-3 px-4 font-semibold">Waktu Dihapus</th>
                    <th className="py-3 px-4 font-semibold">Retensi</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {items.map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-muted/60 shrink-0">
                            {getItemIcon(item.type)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {item.name}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              ID: {item.identifier || item.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getTypeBadge(item.type)}
                      </td>

                      <td className="py-3 px-4 text-foreground/80 font-medium">
                        {item.originName}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        <div>
                          {item.deletedAt !== "—"
                            ? new Date(item.deletedAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground/70">
                          oleh: {item.deletedBy}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getRetentionBadge(item.daysRemaining)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreItem(item.type, item.id, item.name)}
                            className="h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Pulihkan
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveItemToDelete(item)}
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog: Permanent Delete Single Item */}
      <Dialog
        open={!!activeItemToDelete}
        onOpenChange={(open) => !open && setActiveItemToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Hapus Permanen Data?</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              Tindakan ini bersifat <strong>permanen dan tidak dapat dibatalkan</strong>. Data{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{activeItemToDelete?.name}&rdquo;
              </span>{" "}
              akan dihapus secara fisik dari database PostgreSQL.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveItemToDelete(null)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmPermanentDelete}
              disabled={isProcessing}
            >
              {isProcessing ? "Menghapus..." : "Ya, Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Empty Whole Trash */}
      <Dialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle>Kosongkan Seluruh Recycle Bin?</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              Anda akan menghapus fisik <strong>seluruh {stats.total} item</strong> yang ada di Recycle Bin. Pastikan tidak ada data penting yang masih perlu dipulihkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmptyConfirm(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmEmptyTrash}
              disabled={isProcessing}
            >
              {isProcessing ? "Mengosongkan..." : "Ya, Kosongkan Semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
