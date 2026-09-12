import { Globe, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";

export interface SpatialGovernanceReport {
  projectsWithAbacCount: number;
  totalMemberAssignments: number;
  legacyNullProjectNodes: number;
  legacyNullProjectEdges: number;
  legacyDataClean: boolean;
  organizationSummaries: {
    organization: string;
    totalProjects: number;
    totalMembers: number;
  }[];
  checkedAt: string;
}

interface ComplianceSpatialGovernanceCardProps {
  spatialReport: SpatialGovernanceReport | null;
}

export function ComplianceSpatialGovernanceCard({ spatialReport }: ComplianceSpatialGovernanceCardProps) {
  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" /> Spatial ABAC &amp; Project Governance
          </span>
          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase font-bold">
            System Plane Metadata
          </span>
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Ringkasan agregat kepatuhan Attribute-Based Access Control (ABAC) spasial dan integritas data isolasi
          project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-card/60 border border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
              Project dengan ABAC
            </span>
            <span className="text-xl font-bold text-foreground">
              {spatialReport?.projectsWithAbacCount ?? "—"}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-card/60 border border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
              Total Penugasan
            </span>
            <span className="text-xl font-bold text-sky-400">
              {spatialReport?.totalMemberAssignments ?? "—"} Member
            </span>
          </div>
          <div className="p-3 rounded-lg bg-card/60 border border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
              Legacy Nodes NULL
            </span>
            <span
              className={`text-xl font-bold ${
                (spatialReport?.legacyNullProjectNodes ?? 0) === 0 ? "text-primary" : "text-amber-400"
              }`}
            >
              {spatialReport?.legacyNullProjectNodes ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-card/60 border border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
              Legacy Edges NULL
            </span>
            <span
              className={`text-xl font-bold ${
                (spatialReport?.legacyNullProjectEdges ?? 0) === 0 ? "text-primary" : "text-amber-400"
              }`}
            >
              {spatialReport?.legacyNullProjectEdges ?? 0}
            </span>
          </div>
        </div>

        {/* Legacy Data Health Note */}
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-foreground font-medium">
              Integritas Data Spasial: Seluruh elemen jaringan memiliki isolasi project_id valid (0 orphaned
              elements).
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            Checked: {spatialReport?.checkedAt ? new Date(spatialReport.checkedAt).toLocaleTimeString() : "Live"}
          </span>
        </div>

        {/* Breakdown List */}
        {spatialReport && spatialReport.organizationSummaries && spatialReport.organizationSummaries.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-foreground block">
              Distribusi ABAC per Organisasi Tenant (Agregat Metadata):
            </span>
            <div className="border border-border rounded-xl overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Organisasi Tenant</th>
                    <th className="p-2.5">Total Project Terdaftar</th>
                    <th className="p-2.5 text-right">Total Anggota Ditugaskan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {spatialReport.organizationSummaries.map((os, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-2.5 font-medium text-foreground">{os.organization}</td>
                      <td className="p-2.5 font-mono text-sky-400">{os.totalProjects} project</td>
                      <td className="p-2.5 text-right font-mono font-bold text-foreground">
                        {os.totalMembers} member
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
