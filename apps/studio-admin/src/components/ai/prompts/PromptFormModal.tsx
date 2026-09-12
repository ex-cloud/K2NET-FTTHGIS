import React from "react";
import { Sparkles, X, Loader2, Check } from "lucide-react";
import { Button, Input, Label } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { SuggestedPromptItem } from "@/lib/actions/gateways";
import { AVAILABLE_ICONS, PROMPT_CATEGORIES, PROMPT_ROLES } from "./types";

export interface PromptFormData {
  title: string;
  description: string;
  prompt: string;
  icon: string;
  category: string;
  target_role: string;
  is_pinned: boolean;
  is_active: boolean;
}

interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPrompt: SuggestedPromptItem | null;
  formData: PromptFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromptFormData>>;
  formSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function PromptFormModal({
  isOpen,
  onClose,
  editingPrompt,
  formData,
  setFormData,
  formSubmitting,
  onSubmit,
}: PromptFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {editingPrompt ? "Edit Kartu Prompt Rekomendasi" : "Tambah Prompt Rekomendasi Baru"}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="promptTitle" className="text-xs font-medium text-foreground">
              Judul Kartu (Ringkas & Informatif) *
            </Label>
            <Input
              id="promptTitle"
              type="text"
              required
              maxLength={120}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Diagnosa Port OLT ZTE C320"
              className="text-xs h-8 bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="promptDesc" className="text-xs font-medium text-foreground">
              Deskripsi Singkat (Muncul di bawah judul pada Drawer)
            </Label>
            <Input
              id="promptDesc"
              type="text"
              maxLength={200}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Standar redaman optik dBm dan troubleshooting LOS..."
              className="text-xs h-8 bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="promptText" className="text-xs font-medium text-foreground">
              Teks Prompt Lengkap (Akan disuntikkan ke kolom chat saat kartu diklik) *
            </Label>
            <textarea
              id="promptText"
              required
              rows={3}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Contoh: Bagaimana cara troubleshooting OLT ZTE C320 jika port PON statusnya LOS..."
              className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-sans outline-hidden focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="promptCategory" className="text-xs font-medium text-foreground">
                Kategori Sistem
              </Label>
              <select
                id="promptCategory"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
              >
                {PROMPT_CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="promptRole" className="text-xs font-medium text-foreground">
                Target Hak Akses / Role
              </Label>
              <select
                id="promptRole"
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
              >
                {PROMPT_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Pilih Ikon Visual Kartu</Label>
            <div className="grid grid-cols-6 gap-2 pt-1">
              {AVAILABLE_ICONS.map((item) => {
                const IconC = item.icon;
                const isSelected = formData.icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: item.id })}
                    className={cn(
                      "p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/15 border-primary text-primary shadow-xs"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                    title={item.label}
                  >
                    <IconC className="w-4 h-4" />
                    <span className="text-[9px] truncate max-w-full font-mono">{item.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="rounded border-border text-primary focus:ring-0 cursor-pointer"
              />
              <span className="font-medium">Pin Kartu ke Posisi Teratas</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-border text-primary focus:ring-0 cursor-pointer"
              />
              <span className="font-medium">Aktifkan di Ask AI Drawer</span>
            </label>
          </div>

          <div className="pt-3 border-t border-border/70 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={formSubmitting}
              className="text-xs font-bold gap-1.5 px-4 bg-primary text-primary-foreground cursor-pointer shadow-xs"
            >
              {formSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{editingPrompt ? "Simpan Perubahan" : "Buat Prompt"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
