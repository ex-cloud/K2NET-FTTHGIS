import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
} from "@k2net/ui";

export function DispatcherPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const activeTechnicians = [
    {
      name: "Dedi Supriadi",
      currentTask: "Perbaikan ODP-DGO-04 (Sinyal Loss)",
      location: "Radius 250m dari ODP-DGO-04",
      battery: "84%",
      status: "ON_SITE",
    },
    {
      name: "Rizky Ramadhan",
      currentTask: "Instalasi Baru Pelanggan Cafe Kopi Kembara",
      location: "Jl. Ir. H. Juanda No. 182",
      battery: "92%",
      status: "DISPATCHED",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Issues", href: `/project/${projectId}/issues/tickets` },
          { label: "Dispatcher Tugas" },
        ]}
        title="Dispatcher Teknisi Lapangan (JIT Geo-fenced)"
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTechnicians.map((t, idx) => (
            <Card key={idx} className="p-4 border-border/60 bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {t.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{t.name}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Baterai GPS: {t.battery}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {t.status}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 space-y-1 text-xs">
                <span className="text-muted-foreground block text-[10px]">Tugas Aktif:</span>
                <span className="font-semibold text-foreground">{t.currentTask}</span>
                <span className="text-[11px] text-primary flex items-center gap-1 mt-1 font-mono">
                  <MapPin className="h-3 w-3" />
                  {t.location}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </PageContentShell>
    </div>
  );
}
