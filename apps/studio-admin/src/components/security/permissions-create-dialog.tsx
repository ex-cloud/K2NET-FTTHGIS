import { Plus, Loader2 } from "lucide-react";
import { Button } from "@k2net/ui";
import { type NewPermissionForm, SCOPE_OPTIONS, MODULE_SUGGESTIONS } from "./permissions-types";

interface CreatePermissionDialogProps {
  form: NewPermissionForm;
  setForm: (f: NewPermissionForm) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function CreatePermissionDialog({
  form,
  setForm,
  onClose,
  onSubmit,
  isSubmitting,
}: CreatePermissionDialogProps) {
  const handleField = (field: keyof NewPermissionForm, value: string) =>
    setForm({ ...form, [field]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/15 border border-primary/25">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Tambah Permission Baru</h2>
            <p className="text-xs text-muted-foreground">Isi detail permission yang ingin ditambahkan</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Module */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Module <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="input-perm-module"
                type="text"
                list="module-suggestions"
                value={form.module}
                onChange={(e) => handleField("module", e.target.value)}
                placeholder="contoh: nodes, customers, billing"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
              />
              <datalist id="module-suggestions">
                {MODULE_SUGGESTIONS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-perm-name"
              type="text"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="contoh: View Network Nodes"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Code <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-perm-code"
              type="text"
              value={form.code}
              onChange={(e) => handleField("code", e.target.value)}
              placeholder="contoh: nodes.view atau system.nodes.manage"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary font-mono transition-all"
            />
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {SCOPE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleField("scope", s)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.scope === s
                      ? "bg-primary/15 border-primary text-primary font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Deskripsi (Opsional)
            </label>
            <textarea
              id="input-perm-desc"
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat fungsi permission ini..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border-border text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            id="btn-submit-create-perm"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tambah Permission"}
          </Button>
        </div>
      </div>
    </div>
  );
}
