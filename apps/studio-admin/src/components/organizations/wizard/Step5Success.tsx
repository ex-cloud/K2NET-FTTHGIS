import * as React from "react";
import { Check, ExternalLink, Copy } from "lucide-react";
import { Button } from "@k2net/ui";
import { getTenantUrl } from "@/lib/domain";

interface Step5SuccessProps {
  name: string;
  deployedData: {
    slug: string;
    adminPassword?: string;
    adminUsername?: string;
  };
  onCopyPassword: (text: string) => void;
  copied: boolean;
}

export function Step5Success({
  name,
  deployedData,
  onCopyPassword,
  copied,
}: Step5SuccessProps) {
  return (
    <div className="space-y-5 animate-in zoom-in-95 duration-500 py-2">
      <div className="flex flex-col items-center text-center space-y-1.5">
        <div className="size-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-1">
          <Check className="size-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Infrastructure Online</h3>
        <p className="text-xs text-muted-foreground max-w-md">
          Organisasi <strong className="text-foreground">{name}</strong> berhasil dideploy dengan Keycloak realm dan
          kuota hardware aktif.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
          <span className="text-muted-foreground font-mono">PORTAL URL</span>
          <a
            href={getTenantUrl(deployedData.slug)}
            target="_blank"
            rel="noreferrer"
            className="text-primary font-bold font-mono flex items-center gap-1 hover:underline"
          >
            <span>{getTenantUrl(deployedData.slug)}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
          <span className="text-muted-foreground font-mono">ADMIN USERNAME</span>
          <span className="font-mono font-bold text-foreground">{deployedData.adminUsername}</span>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono">INITIAL PASSWORD</span>
            <span className="text-[10px] text-amber-500 font-mono">Shown once</span>
          </div>
          <div className="flex items-center justify-between bg-background border border-border rounded-lg p-2.5">
            <code className="text-primary font-mono text-xs font-bold">{deployedData.adminPassword}</code>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
              onClick={() => onCopyPassword(deployedData.adminPassword || "")}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
