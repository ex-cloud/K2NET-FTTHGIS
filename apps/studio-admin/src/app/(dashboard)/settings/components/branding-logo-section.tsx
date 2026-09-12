import { useState } from "react";
import { Input } from "@k2net/ui";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { SettingsSection } from "./settings-section";
import { SettingsFormRow } from "./settings-form-row";

interface BrandingLogoSectionProps {
  logoUrl: string;
  onLogoUrlChange: (val: string) => void;
}

export function BrandingLogoSection({ logoUrl, onLogoUrlChange }: BrandingLogoSectionProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (PNG, JPG, SVG, WEBP).");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Ukuran logo maksimal 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onLogoUrlChange(e.target.result as string);
        toast.success("Logo berhasil diimpor! Lihat pratinjau di sebelah kanan.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <SettingsSection
      title="Logo & Brand Assets"
      description="Unggah logo resmi organisasi atau masukkan URL / string Base64 data logo."
    >
      <SettingsFormRow
        label="System Logo URL / Base64"
        description="URL gambar logo platform atau string Base64 yang akan ditampilkan di header dan login."
      >
        <Input
          type="text"
          value={logoUrl}
          onChange={(e) => onLogoUrlChange(e.target.value)}
          placeholder="e.g. /favicon.ico or data:image/png;base64,..."
          className="bg-background/80 border-border text-foreground text-xs max-w-sm focus:border-primary font-mono"
        />
      </SettingsFormRow>

      <SettingsFormRow
        label="Upload File Logo Image"
        description="Drag & drop atau pilih gambar logo dari komputer Anda (Format PNG, SVG, WEBP; Maks 1MB)."
        divider={false}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) handleLogoFile(e.dataTransfer.files[0]);
          }}
          onClick={() => document.getElementById("branding-logo-input")?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer w-full max-w-xs ${
            dragActive
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background/40 text-muted-foreground hover:border-border/80"
          }`}
        >
          <input
            id="branding-logo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleLogoFile(e.target.files[0]);
            }}
          />
          <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">Klik atau drag file logo ke sini</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">PNG, SVG, WEBP (Max 1MB)</p>
        </div>
      </SettingsFormRow>
    </SettingsSection>
  );
}
