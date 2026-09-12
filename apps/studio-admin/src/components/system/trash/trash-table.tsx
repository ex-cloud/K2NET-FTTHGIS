import {
  Trash2,
  RotateCcw,
  Building2,
  FolderKanban,
  ClipboardList,
  Network,
  Search,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";
import type { TrashItem } from "@/hooks/useTrashCan";

interface TrashTableProps {
  items: TrashItem[];
  stats: {
    total: number;
    organizations: number;
    projects: number;
    tasks: number;
    networkAssets: number;
  };
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onRestoreClick: (item: TrashItem) => void;
  onDeleteClick: (item: TrashItem) => void;
}

function getItemIcon(type: TrashItem["type"]) {
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
}

function getTypeBadge(type: TrashItem["type"]) {
  switch (type) {
    case "ORGANIZATION":
      return (
        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
          Tenant Org
        </Badge>
      );
    case "PROJECT":
      return (
        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
          GIS Project
        </Badge>
      );
    case "TASK":
      return (
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
          Task / Issue
        </Badge>
      );
    case "NETWORK_NODE":
      return (
        <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
          Network Node
        </Badge>
      );
    case "NETWORK_EDGE":
      return (
        <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
          Fiber Cable
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-xs">Asset</Badge>;
  }
}

function getRetentionBadge(days: number) {
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
}

export function TrashTable({
  items,
  stats,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchQueryChange,
  onRestoreClick,
  onDeleteClick,
}: TrashTableProps) {
  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="p-4 border-b border-border/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Tabs
            value={selectedCategory}
            onValueChange={onSelectCategory}
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
              onChange={(e) => onSearchQueryChange(e.target.value)}
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
                  <th className="py-3 px-4 font-semibold">Entitas &amp; Nama</th>
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
                      <PermissionGuard
                        permission="system.trash.manage"
                        fallback={
                          <span className="text-[10px] text-muted-foreground italic">Read-only</span>
                        }
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRestoreClick(item)}
                            className="h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Pulihkan
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteClick(item)}
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </Button>
                        </div>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
