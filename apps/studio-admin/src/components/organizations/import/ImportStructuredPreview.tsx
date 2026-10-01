import * as React from "react";
import { Building2, FolderGit2, ShieldCheck } from "lucide-react";
import { Badge, Label } from "@k2net/ui";
import type { ParsedBackupData } from "./types";
import { useTranslation } from "@k2net/i18n";

interface ImportStructuredPreviewProps {
  parsedData: ParsedBackupData;
}

export function ImportStructuredPreview({ parsedData }: ImportStructuredPreviewProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {parsedData.organization.name}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
            Plan: {parsedData.organization.plan || "FREE"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-[10px] text-muted-foreground block font-medium">{t("organizations.org_slug")}</span>
            <span className="font-mono font-semibold text-foreground text-xs">
              {parsedData.organization.slug}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-[10px] text-muted-foreground block font-medium">{t("organizations.keycloak_iam_realm")}</span>
            <span className="font-mono font-semibold text-foreground text-xs">
              {parsedData.organization.slug}
            </span>
          </div>
        </div>

        {parsedData.projects && parsedData.projects.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-primary" />
              {t("organizations.import_included_projects", { count: parsedData.projects.length })}
            </Label>
            <div className="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
              {parsedData.projects.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-xs"
                >
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {p.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Provisioning Notice */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          {t("organizations.import_provisioning_notice")}{" "}
          <strong>Keycloak Realm ({parsedData.organization.slug})</strong>
        </span>
      </div>
    </div>
  );
}
