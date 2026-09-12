import { Globe, MapPin, X } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import Map, { Marker } from "@k2net/map";
import type { SecurityEvent } from "@/hooks/useSecuritySettings";

export interface GeoMarker extends SecurityEvent {
  coords: {
    lat: number;
    lon: number;
  };
}

interface AlertsMapCardProps {
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  onViewStateChange: (viewState: { longitude: number; latitude: number; zoom: number }) => void;
  markers: GeoMarker[];
  selectedAlert: SecurityEvent | null;
  onSelectAlert: (alert: SecurityEvent) => void;
  onClearSelectedAlert: () => void;
}

export function AlertsMapCard({
  viewState,
  onViewStateChange,
  markers,
  selectedAlert,
  onSelectAlert,
  onClearSelectedAlert,
}: AlertsMapCardProps) {
  return (
    <Card glowingEffect className="bg-card/30 border-border shadow-xl backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-rose-500" /> Geographic Threat Map
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Interactive visualization of suspicious sign-ins.
        </CardDescription>
      </CardHeader>
      <div className="relative h-[250px] w-full bg-background">
        <Map
          {...viewState}
          onMove={(evt) => onViewStateChange(evt.viewState)}
          mapStyle="https://tiles.openfreemap.org/styles/dark"
          style={{ width: "100%", height: "100%" }}
        >
          {markers.map((marker) => {
            const isSelected = selectedAlert?.id === marker.id;
            return (
              <Marker key={marker.id} longitude={marker.coords.lon} latitude={marker.coords.lat} anchor="bottom">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAlert(marker);
                  }}
                  className="relative cursor-pointer group"
                >
                  <div
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping ${
                      marker.severity === "CRITICAL" ? "bg-rose-500/40" : "bg-amber-500/40"
                    } w-6 h-6`}
                  />
                  <MapPin
                    className={`w-5 h-5 -translate-x-1/2 -translate-y-full transition-all duration-300 ${
                      isSelected
                        ? "text-rose-400 scale-125 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                        : "text-rose-600 hover:text-rose-400 hover:scale-110"
                    }`}
                  />

                  {/* Mini Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-background border border-border px-2 py-1 rounded text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                    {marker.username} - {marker.eventType}
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>

        {selectedAlert && (
          <button
            onClick={onClearSelectedAlert}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-foreground z-10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
}
