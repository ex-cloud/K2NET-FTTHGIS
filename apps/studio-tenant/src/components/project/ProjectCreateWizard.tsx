import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { Boxes, MapPin, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "../../hooks/useProjects";

interface ProjectCreateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectCreateWizard({ open, onOpenChange }: ProjectCreateWizardProps) {
  const navigate = useNavigate();
  const { createProject, isCreating } = useProjects();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    description: "",
    status: "PLANNING",
    centerLng: "107.6191",
    centerLat: "-6.9175",
    targetSubscribers: "1000",
  });

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: "",
      code: "",
      description: "",
      status: "PLANNING",
      centerLng: "107.6191",
      centerLat: "-6.9175",
      targetSubscribers: "1000",
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error("Nama proyek wajib diisi");
        return;
      }
      if (!formData.code.trim()) {
        toast.error("Kode proyek wajib diisi");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        status: formData.status,
      };

      const result = await createProject(payload);
      toast.success("Proyek FTTH berhasil dibuat!");
      handleClose();

      if (result && result.id) {
        navigate({ to: `/project/${result.id}/overview` });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat proyek";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 border border-border/80 text-foreground/80">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Buat Proyek FTTH Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Langkah {step} dari 3: {step === 1 ? "Informasi Dasar" : step === 2 ? "Konfigurasi GIS" : "Konfirmasi"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-2 py-1">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
        </div>

        {/* Step 1: Informasi Dasar */}
        {step === 1 && (
          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Nama Proyek <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="misal: FTTH Cluster Dago Atas"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-8.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Kode Proyek (Singkatan) <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="misal: BDG-DGO"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status Awal</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-8.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">PLANNING (Perencanaan)</SelectItem>
                    <SelectItem value="PRODUCTION">PRODUCTION (Live)</SelectItem>
                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Deskripsi Cakupan / Lokasi</Label>
              <Textarea
                placeholder="Rincian area perumahan, RW/RT, atau target coverage..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-xs min-h-[70px] resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Konfigurasi GIS & Koordinat */}
        {step === 2 && (
          <div className="space-y-3.5 py-2">
            <div className="rounded-lg bg-muted/40 p-3 border border-border/60 flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tentukan titik pusat peta default untuk memudahkan navigasi teknisi dan surveyor saat membuka modul Map Studio.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pusat Longitude (Lng)</Label>
                <Input
                  placeholder="107.6191"
                  value={formData.centerLng}
                  onChange={(e) => setFormData({ ...formData, centerLng: e.target.value })}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pusat Latitude (Lat)</Label>
                <Input
                  placeholder="-6.9175"
                  value={formData.centerLat}
                  onChange={(e) => setFormData({ ...formData, centerLat: e.target.value })}
                  className="h-8.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target Kapasitas Pelanggan (Homepass)</Label>
              <Input
                type="number"
                placeholder="1000"
                value={formData.targetSubscribers}
                onChange={(e) => setFormData({ ...formData, targetSubscribers: e.target.value })}
                className="h-8.5 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Step 3: Konfirmasi Ringkasan */}
        {step === 3 && (
          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">Nama Proyek:</span>
                <span className="text-xs font-bold text-foreground">{formData.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">Kode Proyek:</span>
                <span className="text-xs font-mono font-semibold text-primary">{formData.code}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">Status:</span>
                <span className="text-xs font-semibold text-foreground">{formData.status}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">Koordinat Pusat:</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {formData.centerLng}, {formData.centerLat}
                </span>
              </div>
              {formData.description && (
                <div className="pt-1">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Deskripsi:</span>
                  <p className="text-xs text-foreground bg-muted/30 p-2 rounded-md">
                    {formData.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2 pt-2 sm:justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={isCreating}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isCreating}
              className="text-xs"
            >
              Batal
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleNext}
                className="text-xs gap-1.5 font-semibold"
              >
                Lanjut
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSubmit}
                disabled={isCreating}
                className="text-xs gap-1.5 font-semibold"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Buat Proyek
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
