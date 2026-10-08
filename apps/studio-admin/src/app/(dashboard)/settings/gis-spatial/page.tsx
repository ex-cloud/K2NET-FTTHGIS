import { useState } from "react";
import { Badge, Button, Input, PageLayout, ActionTooltip } from "@k2net/ui";
import { MapPin, Save, RefreshCw, Map as MapIcon } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { SystemSettingsWrapper } from "@/components/page-guards/system-settings-wrapper";
import { SettingsSection, SettingsFormRow } from "@/components/settings";
import { MapCoordinatePicker } from "@/components/dashboard/map-coordinate-picker";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

export default function SettingsGisPage() {
  const { t } = useTranslation();
  const { settings, loading, updateSettings, isUpdating, refresh } = useSystemSettings();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const getValue = (key: string, defaultValue: string = ""): string => {
    if (formValues[key] !== undefined) return formValues[key];
    const dbVal = settings.find((s) => s.key === key)?.value;
    return dbVal !== undefined ? dbVal : defaultValue;
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const keysToSave: Record<string, string> = {
      default_map_lat: getValue("default_map_lat", "-6.9175"),
      default_map_lng: getValue("default_map_lng", "107.6191"),
      default_map_address: getValue("default_map_address", "Bandung, Jawa Barat, Indonesia"),
      default_map_zoom: getValue("default_map_zoom", "12"),
      default_epsg_code: getValue("default_epsg_code", "EPSG:4326"),
      vector_tile_source: getValue("vector_tile_source", "http://localhost:3001/tiles/{z}/{x}/{y}.pbf"),
    };

    try {
      await updateSettings(keysToSave);
      toast.success(t("settings.gis.updated_success"));
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || t("settings.gis.update_failed"));
    }
  };

  return (
    <SystemSettingsWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                {t("settings.general.platform_config_badge")}
              </Badge>
              <span className="text-xs text-muted-foreground">• {t("settings.gis.badge_subtitle")}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-primary" /> {t("settings.gis.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("settings.gis_spatial_subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ActionTooltip label={t("common.reload")} shortcut="R">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={loading}
                className="border-border hover:bg-muted text-muted-foreground text-xs h-7 px-2.5 gap-1.5 rounded-md shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> {t("common.reload")}
              </Button>
            </ActionTooltip>
            <ActionTooltip label={t("common.save_changes")} shortcut="Ctrl+S">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isUpdating || loading}
                className="text-xs h-7 px-2.5 font-medium gap-1.5 shadow-xs rounded-md cursor-pointer"
              >
                {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {t("common.save_changes")}
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8 pb-16">
          
          {/* Section 1: Projection & Coordinates */}
          <SettingsSection
            title={t("settings.gis.projection_title")}
            description={t("settings.gis.projection_desc")}
          >
            <SettingsFormRow
              label={t("settings.gis.crs_label")}
              description={t("settings.gis.crs_desc")}
            >
              <select
                value={getValue("default_epsg_code", "EPSG:4326")}
                onChange={(e) => handleInputChange("default_epsg_code", e.target.value)}
                className="bg-background border border-border text-foreground text-xs rounded-md px-3 py-1.5 focus:border-primary w-48"
              >
                <option value="EPSG:4326">EPSG:4326 (WGS 84 - Lat/Lng)</option>
                <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
              </select>
            </SettingsFormRow>

            <SettingsFormRow
              label={t("settings.gis.center_coords_label")}
              description={t("settings.gis.center_coords_desc")}
            >
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={getValue("default_map_lat", "-6.9175")}
                  onChange={(e) => handleInputChange("default_map_lat", e.target.value)}
                  placeholder="Latitude"
                  className="bg-background/80 border-border text-foreground text-xs w-28 text-right focus:border-primary"
                />
                <span className="text-xs text-muted-foreground font-mono">,</span>
                <Input
                  type="text"
                  value={getValue("default_map_lng", "107.6191")}
                  onChange={(e) => handleInputChange("default_map_lng", e.target.value)}
                  placeholder="Longitude"
                  className="bg-background/80 border-border text-foreground text-xs w-28 text-right focus:border-primary"
                />
              </div>
            </SettingsFormRow>

            <SettingsFormRow
              label={t("settings.gis.picker_label")}
              description={t("settings.gis.picker_desc")}
              divider={false}
            >
              <ActionTooltip label={t("settings.gis.picker_label")} shortcut="M">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMapPickerOpen(true)}
                  className="border-border hover:bg-muted text-muted-foreground text-xs h-7 px-2.5 gap-1.5 rounded-md shadow-xs cursor-pointer"
                >
                  <MapIcon className="w-3.5 h-3.5 text-primary" /> {t("settings.gis.pick_location_btn")}
                </Button>
              </ActionTooltip>
            </SettingsFormRow>
          </SettingsSection>

          {/* Section 2: Zoom & Tiles */}
          <SettingsSection
            title={t("settings.gis.tile_engine_title")}
            description={t("settings.gis.tile_engine_desc")}
            divider={false}
          >
            <SettingsFormRow
              label={t("settings.gis.zoom_level_label")}
              description={t("settings.gis.zoom_level_desc")}
            >
              <Input
                type="number"
                min={1}
                max={22}
                value={getValue("default_map_zoom", "12")}
                onChange={(e) => handleInputChange("default_map_zoom", e.target.value)}
                className="bg-background/80 border-border text-foreground text-xs w-24 text-right focus:border-primary"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label={t("settings.gis.tile_server_label")}
              description={t("settings.gis.tile_server_desc")}
              divider={false}
            >
              <Input
                type="text"
                value={getValue("vector_tile_source", "http://localhost:3001/tiles/{z}/{x}/{y}.pbf")}
                onChange={(e) => handleInputChange("vector_tile_source", e.target.value)}
                placeholder="http://localhost:3001/tiles/{z}/{x}/{y}.pbf"
                className="bg-background/80 border-border text-foreground text-xs w-full max-w-md focus:border-primary font-mono"
              />
            </SettingsFormRow>
          </SettingsSection>

        </div>

        {/* Map Picker Modal */}
        <MapCoordinatePicker
          open={mapPickerOpen}
          onOpenChange={setMapPickerOpen}
          initialLat={getValue("default_map_lat", "-6.9175")}
          initialLng={getValue("default_map_lng", "107.6191")}
          onConfirm={(lat, lng, address) => {
            handleInputChange("default_map_lat", lat);
            handleInputChange("default_map_lng", lng);
            if (address) handleInputChange("default_map_address", address);
            toast.success(t("settings.gis.picker_updated_toast"));
          }}
        />

      </PageLayout>
    </SystemSettingsWrapper>
  );
}
