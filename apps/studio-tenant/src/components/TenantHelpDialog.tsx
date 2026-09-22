import * as React from "react";
import {
  HelpCircle,
  BookOpen,
  FileText,
  Activity,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@k2net/ui";

interface TenantHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantHelpDialog({ open, onOpenChange }: TenantHelpDialogProps) {
  const docs = [
    {
      title: "Standar Redaman Optik (ITU-T G.652D)",
      desc: "Panduan batas toleransi loss serat optik, splicing loss (<0.05dB), dan connector insertion loss (<0.3dB).",
      icon: Activity,
      tag: "Standards",
    },
    {
      title: "SOP Penarikan Kabel & Pemasangan FAT",
      desc: "Prosedur baku instalasi drop core, manajemen bending radius, dan tagging kode ODP.",
      icon: FileText,
      tag: "SOP",
    },
    {
      title: "Panduan Peta Spasial Web-QGIS",
      desc: "Cara simulasi penarikan kabel baru, identifikasi rute tercepat, dan manajemen layer MVT.",
      icon: BookOpen,
      tag: "GIS Guide",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <HelpCircle className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-foreground">
              Pusat Panduan & Dukungan Teknis Tenant
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Akses dokumentasi operasional FTTH, standar telekomunikasi baku, dan saluran bantuan teknisi NOC K2NET.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Dokumentasi & Standar Operasional:
          </span>

          <div className="space-y-2">
            {docs.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.title}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="p-2 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                        {doc.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-border bg-card text-muted-foreground shrink-0">
                        {doc.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {doc.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-primary text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Bantuan NOC Escalation 24/7</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Jika mengalami kendala routing gateway, anomali poller OLT, atau sinkronisasi database, hubungi tim NOC K2NET via WhatsApp atau email support.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://wa.me/6281234567890", "_blank")}
                className="h-7 px-2.5 text-xs border-primary/40 bg-card hover:bg-primary/10 text-primary gap-1 font-medium cursor-pointer"
              >
                <PhoneCall className="h-3 w-3" />
                <span>WhatsApp NOC</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open("mailto:support@kdua.net", "_blank")}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
              >
                <span>support@kdua.net</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
