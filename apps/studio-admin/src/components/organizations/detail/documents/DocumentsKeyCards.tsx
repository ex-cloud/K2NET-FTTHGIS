import { Badge, Button, Card } from "@k2net/ui";
import { FileCheck, CheckCircle2, Sparkles, Eye } from "lucide-react";
import type { EnrichedOrganization } from "../../types";
import type { TenantDocument } from "./types";
import { useTranslation } from "@k2net/i18n";

interface DocumentsKeyCardsProps {
  org: EnrichedOrganization;
  documents: TenantDocument[];
  onPreview: (doc: TenantDocument) => void;
}

export function DocumentsKeyCards({
  org,
  documents,
  onPreview,
}: DocumentsKeyCardsProps) {
  const { t } = useTranslation();
  const doc0 = documents[0];
  const doc1 = documents[1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: MoU & SaaS Contract */}
      <Card className="p-4 space-y-3 bg-card border-border shadow-xs hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="h-8 w-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <FileCheck className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-mono text-[9px]">
            CONTRACT ACTIVE
          </Badge>
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Partnership Agreement (MoU)</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            K2NET FTTH GIS Master SaaS Contract
          </p>
        </div>
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
          <span className="font-mono text-muted-foreground">Exp: 01 Aug 2027</span>
          {doc0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(doc0)}
              className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1 cursor-pointer"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Card 2: BAST Handover Certificate */}
      <Card className="p-4 space-y-3 bg-card border-border shadow-xs hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
            PASSED NOC TEST
          </Badge>
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Handover Certificate (BAST)</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {t("organizations.onboarding_network_done")}
          </p>
        </div>
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
          <span className="font-mono text-muted-foreground">Verified 02 Aug 2026</span>
          {doc1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(doc1)}
              className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1 cursor-pointer"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Card 3: SLA Commitment */}
      <Card className="p-4 space-y-3 bg-card border-border shadow-xs hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="h-8 w-8 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono text-[9px]">
            {org.slaTier}
          </Badge>
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">SLA &amp; Uptime Guarantee</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            Core Server Downtime Compensation Guarantee
          </p>
        </div>
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
          <span className="font-mono text-muted-foreground">Commitment: 99.5%</span>
          <span className="text-[10px] font-mono text-purple-500 font-semibold">Tier Covered</span>
        </div>
      </Card>
    </div>
  );
}
