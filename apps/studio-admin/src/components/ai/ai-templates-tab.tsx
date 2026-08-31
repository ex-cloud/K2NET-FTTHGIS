

import React, { useState } from "react";
import { 
  FileCode, 
  Copy, 
  Check, 
  ArrowRight 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  Button, 
  Badge 
} from "@k2net/ui";
import { toast } from "sonner";
import { KNOWLEDGE_TEMPLATES, KnowledgeTemplateItem } from "./types";

interface AiTemplatesTabProps {
  onUseTemplate: (template: KnowledgeTemplateItem) => void;
}

export function AiTemplatesTab({ onUseTemplate }: AiTemplatesTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyMarkdown = (template: KnowledgeTemplateItem) => {
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    toast.success(`Template '${template.title}' berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                Pustaka Contoh & Template Standar SOP
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">
                  4 Templates
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Gunakan template dokumen teknis siap pakai untuk langsung diindeks ke dalam memori RAG pgvector sistem.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {KNOWLEDGE_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl border border-border bg-background hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <tmpl.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-tight">{tmpl.title}</h4>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Kategori: {tmpl.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMarkdown(tmpl)}
                    className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === tmpl.id ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedId === tmpl.id ? "Tersalin!" : "Salin MD"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => onUseTemplate(tmpl)}
                    className="text-xs h-8 gap-1.5"
                  >
                    <span>Gunakan Template Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
