import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  PenTool,
  Network,
  Save,
  Undo,
  Redo,
} from "lucide-react";
import { Button, Badge, PageHeader } from "@k2net/ui";
import { toast } from "sonner";

export function CanvasBuilderPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const [selectedTool, setSelectedTool] = React.useState<"select" | "feeder" | "distribution" | "drop" | "odc" | "odp">("feeder");
  const totalLength = 1240; // meters

  const handleSaveDesign = () => {
    toast.success("Rancangan canvas jalur kabel berhasil disimpan ke database GIS");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden select-none">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "GIS Infrastructure", href: `/project/${projectId}/infrastructure/topology` },
          { label: "Canvas Builder" },
        ]}
        title="Desain Canvas Jalur Kabel & CAD Editor"
        badge={
          <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[10px] font-medium">
            CAD DESIGNER
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveDesign}
              className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              Simpan Jalur
            </Button>
          </div>
        }
      />

      <div className="relative flex-1 w-full overflow-hidden bg-muted/30 flex flex-col justify-between p-4">
        {/* Top Floating CAD Toolbar */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border/80 bg-card/90 shadow-md backdrop-blur-xl w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={selectedTool === "select" ? "default" : "outline"}
              onClick={() => setSelectedTool("select")}
              className="h-7.5 px-2.5 text-xs gap-1.5"
            >
              <PenTool className="h-3.5 w-3.5" />
              Pilih / Geser
            </Button>
            <Button
              size="sm"
              variant={selectedTool === "feeder" ? "default" : "outline"}
              onClick={() => setSelectedTool("feeder")}
              className="h-7.5 px-2.5 text-xs gap-1.5"
            >
              <Network className="h-3.5 w-3.5 text-sky-500" />
              Kabel Feeder (48c)
            </Button>
            <Button
              size="sm"
              variant={selectedTool === "distribution" ? "default" : "outline"}
              onClick={() => setSelectedTool("distribution")}
              className="h-7.5 px-2.5 text-xs gap-1.5"
            >
              <Network className="h-3.5 w-3.5 text-amber-500" />
              Distribusi (24c)
            </Button>
            <Button
              size="sm"
              variant={selectedTool === "drop" ? "default" : "outline"}
              onClick={() => setSelectedTool("drop")}
              className="h-7.5 px-2.5 text-xs gap-1.5"
            >
              <Network className="h-3.5 w-3.5 text-primary" />
              Drop Core (2c)
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7.5 w-7.5 text-muted-foreground hover:text-foreground">
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7.5 w-7.5 text-muted-foreground hover:text-foreground">
              <Redo className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* CAD Canvas Simulated Grid */}
        <div className="flex-1 flex items-center justify-center border border-dashed border-border/60 rounded-xl my-3 bg-card/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="z-10 text-center space-y-2 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto">
              <PenTool className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Canvas Editor Aktif</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Klik pada area kerja untuk mulai menarik span kabel, menghubungkan ODC ke ODP, dan mengukur jarak bentang secara presisi.
            </p>
          </div>
        </div>

        {/* Bottom Estimation Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card/90 shadow-md backdrop-blur-xl text-xs">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Total Estimasi Bentang: <strong className="text-foreground font-mono">{(totalLength / 1000).toFixed(2)} Km</strong> ({totalLength} m)
            </span>
            <span className="text-muted-foreground">
              Mode Snap: <strong className="text-primary">Tiang / Pole Otomatis</strong>
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            Estimasi Biaya Material: Rp 18.600.000
          </span>
        </div>
      </div>
    </div>
  );
}
