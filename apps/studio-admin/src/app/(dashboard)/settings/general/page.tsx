"use client";

import { useState } from "react";
import { Badge, Button, Input, PageLayout, Switch } from "@k2net/ui";
import { Sliders, Save, RefreshCw, HardDrive } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { SettingsSection } from "../components/settings-section";
import { SettingsFormRow } from "../components/settings-form-row";
import { toast } from "sonner";

export default function SettingsGeneralPage() {
  const { settings, loading, updateSettings, isUpdating, refresh } = useSystemSettings();
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const getValue = (key: string, defaultValue: string = ""): string => {
    if (formValues[key] !== undefined) return formValues[key];
    const dbVal = settings.find((s) => s.key === key)?.value;
    return dbVal !== undefined ? dbVal : defaultValue;
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSwitchChange = (key: string, checked: boolean) => {
    setFormValues((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
  };

  const handleSave = async () => {
    const keysToSave: Record<string, string> = {
      app_name: getValue("app_name", "K2NET FTTH GIS Platform"),
      default_storage_quota: getValue("default_storage_quota", "10"),
      system_maintenance_mode: getValue("system_maintenance_mode", "false"),
      maintenance_message: getValue("maintenance_message", "Sistem sedang dalam pemeliharaan rutin."),
    };

    try {
      await updateSettings(keysToSave);
      toast.success("Pengaturan Umum berhasil diperbarui!");
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Gagal memperbarui pengaturan");
    }
  };

  return (
    <SystemSettingsWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Platform Config
              </Badge>
              <span className="text-xs text-muted-foreground">• System Identity & Limits</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-primary" /> General Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Konfigurasi identitas platform utama, alokasi kuota penyimpanan default, dan status pemeliharaan sistem.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => refresh()}
              disabled={loading}
              className="border-border hover:bg-muted text-muted-foreground text-xs h-9 px-3 gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating || loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 font-medium gap-2 shadow-sm"
            >
              {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8 pb-16">
          
          {/* Section 1: Platform Identity */}
          <SettingsSection
            title="Platform Identity & Instance"
            description="Informasi identitas dasar yang ditampilkan di seluruh portal admin & header sistem."
          >
            <SettingsFormRow
              label="Nama Platform Global"
              description="Nama resmi platform yang akan muncul pada title bar browser, email notifikasi, dan header aplikasi."
            >
              <Input
                type="text"
                value={getValue("app_name", "K2NET FTTH GIS Platform")}
                onChange={(e) => handleInputChange("app_name", e.target.value)}
                placeholder="e.g. K2NET FTTH GIS Platform"
                className="bg-background/80 border-border text-foreground text-xs max-w-xs focus:border-primary"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="Instance System ID"
              description="Kode identifikasi unik instance backend yang terdaftar pada klaster enterprise."
              divider={false}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground bg-muted/60 border border-border px-3 py-1.5 rounded-md">
                  k2net-prod-cluster-01
                </span>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
                  ACTIVE
                </Badge>
              </div>
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 2: Default Storage Quota */}
          <SettingsSection
            title="Global Storage Allocation"
            description="Batasan kuota penyimpanan default untuk tenant/organisasi baru yang terdaftar di platform."
          >
            <SettingsFormRow
              label="Default Storage Quota per Tenant (GB)"
              description="Batas kapasitas penyimpanan MinIO S3 yang diberikan secara otomatis saat tenant baru diaktifkan."
              divider={false}
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary shrink-0" />
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={getValue("default_storage_quota", "10")}
                  onChange={(e) => handleInputChange("default_storage_quota", e.target.value)}
                  className="bg-background/80 border-border text-foreground text-xs w-28 text-right focus:border-primary"
                />
                <span className="text-xs text-muted-foreground font-medium">GB</span>
              </div>
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 3: System Maintenance Mode */}
          <SettingsSection
            title="System Maintenance Lock"
            description="Kunci pemeliharaan darurat untuk menutup akses seluruh pengguna non-Super Admin."
          >
            <SettingsFormRow
              label="System-wide Maintenance Mode"
              description="Saat diaktifkan, seluruh portal tenant dan pengguna publik akan dikunci dengan layar pemeliharaan. Hanya Super Admin yang dapat mengakses sistem."
            >
              <Switch
                checked={getValue("system_maintenance_mode", "false") === "true"}
                onCheckedChange={(checked) => handleSwitchChange("system_maintenance_mode", checked)}
                className="data-[state=checked]:bg-rose-500"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="Pesan Banner Pemeliharaan"
              description="Pesan kustom yang akan ditampilkan kepada pengguna saat mode pemeliharaan aktif."
              divider={false}
            >
              <Input
                type="text"
                value={getValue("maintenance_message", "Sistem sedang dalam pemeliharaan rutin.")}
                onChange={(e) => handleInputChange("maintenance_message", e.target.value)}
                placeholder="e.g. Sistem sedang dalam peningkatan performa."
                className="bg-background/80 border-border text-foreground text-xs w-full max-w-sm focus:border-primary"
              />
            </SettingsFormRow>
          </SettingsSection>

        </div>
      </PageLayout>
    </SystemSettingsWrapper>
  );
}
