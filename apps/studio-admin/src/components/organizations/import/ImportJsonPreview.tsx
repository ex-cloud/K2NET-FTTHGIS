import * as React from "react";
import { Terminal, Copy } from "lucide-react";
import { Button } from "@k2net/ui";
import type { ParsedBackupData } from "./types";

interface ImportJsonPreviewProps {
  parsedData: ParsedBackupData;
  onCopyJson: () => void;
}

export function ImportJsonPreview({ parsedData, onCopyJson }: ImportJsonPreviewProps) {
  return (
    <div className="relative rounded-xl border border-border bg-background/90 p-3">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border text-[11px] text-muted-foreground">
        <span className="font-mono flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          JSON Payload Inspector
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyJson}
          className="h-6 px-2 text-[10px] gap-1 hover:text-foreground text-muted-foreground"
        >
          <Copy className="w-3 h-3" />
          Salin
        </Button>
      </div>
      <pre className="font-mono text-[11px] text-muted-foreground max-h-[220px] overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
        {JSON.stringify(parsedData, null, 2)}
      </pre>
    </div>
  );
}
