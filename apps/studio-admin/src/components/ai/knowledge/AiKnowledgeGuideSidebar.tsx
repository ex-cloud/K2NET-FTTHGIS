import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@k2net/ui";
import { ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { CATEGORIES, KNOWLEDGE_SCOPES } from "../types";

export function AiKnowledgeGuideSidebar() {
  return (
    <div className="lg:col-span-4 xl:col-span-3 space-y-4 sticky top-6">
      {/* Card 1: Scope Visibilitas Multi-Tenant */}
      <Card glowingEffect className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <CardTitle className="text-xs font-bold text-foreground">
                Scope Visibilitas Multi-Tenant
              </CardTitle>
              <p className="text-[11px] text-foreground/75 dark:text-muted-foreground mt-0.5">
                Mencegah kebocoran data rahasia
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {KNOWLEDGE_SCOPES.map((sc) => {
            const Icon = sc.icon;
            return (
              <div key={sc.id} className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${sc.color}`} />
                  <p className="text-xs font-semibold text-foreground">{sc.label}</p>
                </div>
                <p className="text-[11px] text-foreground/75 dark:text-muted-foreground leading-relaxed pl-5">
                  {sc.description}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Card 2: Panduan Taksonomi Pengetahuan */}
      <Card glowingEffect className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <CardTitle className="text-xs font-bold text-foreground">
                Panduan Taksonomi Pengetahuan
              </CardTitle>
              <p className="text-[11px] text-foreground/75 dark:text-muted-foreground mt-0.5">
                Klasifikasi dokumen untuk akurasi retrieval RAG
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
            <div key={cat.id} className="flex items-start gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-foreground">{cat.label}: </span>
                <span className="text-[11px] text-foreground/75 dark:text-muted-foreground">
                  {cat.id === "TROUBLESHOOTING" && "Redaman drop, LOS/Dying Gasp, manual ONT ZTE/Huawei."}
                  {cat.id === "NETWORK_CONFIG" && "Topologi OLT, ODC, ODP, VLAN, dan konfigurasi IP uplink."}
                  {cat.id === "GIS_MANUAL" && "Pemetaan jalur kabel FO, survey tiang dan koordinat."}
                  {cat.id === "INFRASTRUCTURE" && "Arsitektur server, Docker, Kong, MinIO S3, dan database."}
                  {cat.id === "PLANS" && "Rencana ekspansi rute ODP, budget loss fiber, dan mitigasi risiko."}
                  {cat.id === "GENERAL" && "SOP administrasi, tiket bantuan, tata tertib, dan kontak darurat."}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Card 3: Pipeline Vektorisasi Otomatis */}
      <Card glowingEffect className="border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-1.5">
          <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            Pipeline Vektorisasi Otomatis (RAG)
          </p>
          <p className="text-[11px] text-foreground/75 dark:text-muted-foreground leading-relaxed">
            Dokumen dipotong otomatis menjadi chunk 500 token (50 token overlap) dan disimpan ke PostgreSQL{" "}
            <span className="font-mono text-primary font-semibold">pgvector</span> dengan index{" "}
            <span className="font-mono text-primary font-semibold">HNSW Cosine</span> (&lt;10ms latency).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
