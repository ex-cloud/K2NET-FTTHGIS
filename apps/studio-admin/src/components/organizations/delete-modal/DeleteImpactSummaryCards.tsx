import * as React from "react";
import { FolderGit2, Network, Building2, Users, Loader2 } from "lucide-react";
import { Label } from "@k2net/ui";

interface ImpactSummary {
  organizationId: string;
  organizationName: string;
  slug: string;
  projectsCount: number;
  nodesCount: number;
  cablesCount: number;
  usersCount: number;
  keycloakRealm: string;
  status: string;
}

interface DeleteImpactSummaryCardsProps {
  slug?: string;
  impactSummary: ImpactSummary | null;
  loadingImpact: boolean;
}

export function DeleteImpactSummaryCards({
  slug,
  impactSummary,
  loadingImpact,
}: DeleteImpactSummaryCardsProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-foreground/80">Ringkasan Dampak Aset Organisasi</Label>
        <span className="text-[10px] text-muted-foreground font-mono">IAM Realm: {slug}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
          <FolderGit2 className="w-4 h-4 text-primary mb-1" />
          <span className="text-sm font-bold text-foreground">
            {loadingImpact ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : impactSummary?.projectsCount ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground">Proyek GIS</span>
        </div>
        <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
          <Network className="w-4 h-4 text-primary mb-1" />
          <span className="text-sm font-bold text-foreground">
            {loadingImpact ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : impactSummary?.nodesCount ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground">Node Aset</span>
        </div>
        <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
          <Building2 className="w-4 h-4 text-primary mb-1" />
          <span className="text-sm font-bold text-foreground">
            {loadingImpact ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : impactSummary?.cablesCount ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground">Kabel FO</span>
        </div>
        <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
          <Users className="w-4 h-4 text-primary mb-1" />
          <span className="text-sm font-bold text-foreground">
            {loadingImpact ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : impactSummary?.usersCount ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground">Akun User</span>
        </div>
      </div>
    </div>
  );
}
