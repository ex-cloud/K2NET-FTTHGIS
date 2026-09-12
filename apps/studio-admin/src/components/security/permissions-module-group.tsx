import { useState } from "react";
import { Code2, Sparkles, Copy, Tag, Trash2, Layers, ChevronDown, ExternalLink } from "lucide-react";
import { ActionTooltip, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import { type Permission, scopeBadge } from "./permissions-types";

interface ModuleGroupProps {
  module: string;
  permissions: Permission[];
  onDelete: (p: Permission) => void;
  onViewUsages: (code: string) => void;
}

export function ModuleGroup({ module, permissions, onDelete, onViewUsages }: ModuleGroupProps) {
  const [open, setOpen] = useState(true);

  const getPermissionContextMenuGroups = (p: Permission): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Lihat Traceability Endpoint",
          icon: Code2,
          onClick: () => onViewUsages(p.code),
        },
        {
          label: "Tanya AI tentang Permission Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Jelaskan fungsi permission "${p.code}" (${p.name}), modul ${p.module}, dan scope ${p.scope} dalam arsitektur RBAC sistem FTTH GIS.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Salin Kode Permission",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(p.code);
            toast.success(`Kode permission "${p.code}" disalin!`);
          },
        },
        {
          label: "Salin Nama Permission",
          icon: Tag,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(p.name);
            toast.success(`Nama permission "${p.name}" disalin!`);
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Hapus Permission",
          icon: Trash2,
          shortcut: "Del",
          onClick: () => onDelete(p),
        },
      ],
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      {/* Module header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
      >
        <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground capitalize flex-1">{module}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border">
          {permissions.length}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Permission rows */}
      {open && (
        <div className="border-t border-border divide-y divide-border/40">
          {permissions.map((p) => (
            <UniversalContextMenu key={p.id} groups={getPermissionContextMenuGroups(p)}>
              <div className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors group">
                <Code2 className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onViewUsages(p.code)}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-500/20 transition-all text-left group/btn"
                      title="Klik untuk melihat endpoint yang menggunakan permission ini"
                    >
                      <span>{p.code}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/btn:opacity-100" />
                    </button>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${scopeBadge(p.scope)}`}>
                      {p.scope}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{p.name}</p>
                  {p.description && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{p.description}</p>
                  )}
                </div>
                <ActionTooltip label="Hapus Permission" shortcut="Del">
                  <button
                    id={`btn-delete-perm-${p.id}`}
                    onClick={() => onDelete(p)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </ActionTooltip>
              </div>
            </UniversalContextMenu>
          ))}
        </div>
      )}
    </div>
  );
}
