import React from "react";
import { Pin, Edit2, Trash2, Zap } from "lucide-react";
import { Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { SuggestedPromptItem } from "@/lib/actions/gateways";
import { AVAILABLE_ICONS } from "./types";

interface PromptRowItemProps {
  item: SuggestedPromptItem;
  onTogglePin: (item: SuggestedPromptItem) => void;
  onToggleActive: (item: SuggestedPromptItem) => void;
  onOpenEditModal: (item: SuggestedPromptItem) => void;
  onDeletePromptId: (id: string) => void;
}

export function PromptRowItem({
  item,
  onTogglePin,
  onToggleActive,
  onOpenEditModal,
  onDeletePromptId,
}: PromptRowItemProps) {
  const IconComp = AVAILABLE_ICONS.find((ic) => ic.id === item.icon)?.icon || Zap;

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 text-center">
        <div className="w-7 h-7 mx-auto rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-xs">
          <IconComp className="w-3.5 h-3.5" />
        </div>
      </td>

      <td className="py-3 px-4 max-w-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-foreground">{item.title}</span>
          {item.is_pinned && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1 py-0 text-amber-500 border-amber-500/30 bg-amber-500/10"
            >
              Pinned
            </Badge>
          )}
          {item.is_trending && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1 py-0 text-primary border-primary/30 bg-primary/10"
            >
              Trending
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
          {item.description || item.prompt}
        </p>
      </td>

      <td className="py-3 px-4">
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-border text-foreground/75 dark:text-muted-foreground"
        >
          {item.category}
        </Badge>
      </td>

      <td className="py-3 px-4">
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-border text-foreground/75 dark:text-muted-foreground"
        >
          {item.target_role}
        </Badge>
      </td>

      <td className="py-3 px-4 text-center">
        <button
          type="button"
          onClick={() => onTogglePin(item)}
          className={cn(
            "p-1.5 rounded-lg border transition-colors cursor-pointer",
            item.is_pinned
              ? "bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25"
              : "bg-background border-border text-muted-foreground hover:text-foreground"
          )}
          title={item.is_pinned ? "Lepas Pin" : "Pin ke Urutan Teratas"}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
      </td>

      <td className="py-3 px-4 text-center font-mono text-[11px]">
        <span className="px-2 py-0.5 rounded-full bg-muted/60 text-foreground font-semibold">
          {item.usage_count}x
        </span>
      </td>

      <td className="py-3 px-4 text-center">
        <button
          type="button"
          onClick={() => onToggleActive(item)}
          className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors border",
            item.is_active
              ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
              : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
          )}
        >
          {item.is_active ? "Aktif" : "Nonaktif"}
        </button>
      </td>

      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onOpenEditModal(item)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Edit Prompt"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeletePromptId(item.id)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title="Hapus Prompt"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
