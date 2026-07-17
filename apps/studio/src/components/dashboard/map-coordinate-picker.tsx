"use client";

import * as React from "react";
import Map, { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Crosshair, MapPin, Check, X, Plus, Minus, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MapLayerMouseEvent, StyleSpecification } from "maplibre-gl";

const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

// ESRI Satellite Style (High Quality, Tokenless)
const SATELLITE_STYLE = {
  version: 8,
  sources: {
    'satellite': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

interface MapCoordinatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: string;
  initialLng?: string;
  onConfirm: (lat: string, lng: string, address?: string) => void;
  title?: string;
}

export function MapCoordinatePicker({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  onConfirm,
  title = "Select Location from Map"
}: MapCoordinatePickerProps) {
  const mapRef = React.useRef<MapRef>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isSatellite, setIsSatellite] = React.useState(false);
  
  const [viewState, setViewState] = React.useState({
    longitude: 107.6191, // Default Bandung
    latitude: -6.9175,
    zoom: 15
  });

  const [address, setAddress] = React.useState<string | null>(null);
  const [isFetchingAddress, setIsFetchingAddress] = React.useState(false);
  const addressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync initial position when opening
  React.useEffect(() => {
    if (open) {
      const lat = parseFloat(initialLat || "-6.9175");
      const lng = parseFloat(initialLng || "107.6191");
      
      setViewState(prev => ({
        ...prev,
        latitude: isNaN(lat) ? -6.9175 : lat,
        longitude: isNaN(lng) ? 107.6191 : lng,
        zoom: initialLat && initialLng ? 18 : 15
      }));
    }
  }, [open, initialLat, initialLng]);

  // Fix hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    setIsFetchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "User-Agent": "FTTH-GIS-Dashboard/1.0"
          }
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress("Address not found");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress("Error fetching address");
    } finally {
      setIsFetchingAddress(false);
    }
  };

  // Debounced address fetch on viewState change
  React.useEffect(() => {
    if (!open) return;

    if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);

    addressTimeoutRef.current = setTimeout(() => {
      fetchAddress(viewState.latitude, viewState.longitude);
    }, 800); // Wait for map to settle

    return () => {
      if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
    };
  }, [viewState.latitude, viewState.longitude, open]);

  const handleConfirm = () => {
    onConfirm(
      viewState.latitude.toFixed(15),
      viewState.longitude.toFixed(15),
      address || undefined
    );
    onOpenChange(false);
  };

  const handleMapClick = (evt: MapLayerMouseEvent) => {
    const { lng, lat } = evt.lngLat;
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        duration: 800,
        essential: true
      });
    }
  };

  const currentMapStyle = isSatellite 
    ? SATELLITE_STYLE 
    : (theme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light);

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-zinc-950 border-border rounded-3xl gap-0 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        <DialogHeader className="p-6 bg-zinc-900/80 backdrop-blur-xl border-b border-border z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold uppercase tracking-widest">{title}</DialogTitle>
                <DialogDescription className="text-zinc-500 text-[10px] uppercase font-black tracking-tight mt-1">
                  Click on the map or drag to center the target location
                </DialogDescription>
              </div>
            </div>

            {/* Map Style Toggle */}
            <div className="flex items-center bg-zinc-800/50 p-1 rounded-xl border border-border">
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsSatellite(false)}
                    className={cn(
                        "h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        !isSatellite ? "bg-blue-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
                    )}
                >
                    Standard
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsSatellite(true)}
                    className={cn(
                        "h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        isSatellite ? "bg-blue-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
                    )}
                >
                    Satellite
                </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative h-[550px] w-full">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapStyle={currentMapStyle as StyleSpecification}
            style={{ width: '100%', height: '100%' }}
            ref={mapRef}
            cursor="crosshair"
          >
            {/* Center Crosshair Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative">
                {/* Visual Circle Pulse */}
                <div className="absolute inset-0 w-16 h-16 -translate-x-8 -translate-y-8 rounded-full border-2 border-blue-500/40 animate-ping" />
                <div className="absolute inset-0 w-12 h-12 -translate-x-6 -translate-y-6 rounded-full bg-blue-500/10 border border-blue-500/30" />
                
                {/* Crosshair Lines */}
                <div className="absolute h-10 w-[2px] bg-blue-500 -left-px top-[-20px]" />
                <div className="absolute w-10 h-[2px] bg-blue-500 -top-px left-[-20px]" />
                
                <Crosshair className="relative w-8 h-8 text-white drop-shadow-[0_0_12px_rgba(59,130,246,1)]" />
              </div>
            </div>

            {/* Address Indicator Overlay */}
            <div className="absolute top-4 left-4 right-16 z-10 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="bg-zinc-950/80 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                  isFetchingAddress ? "bg-blue-500/10" : "bg-blue-500/20 shadow-lg shadow-blue-500/10"
                )}>
                  {isFetchingAddress ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Target Area Identity</span>
                  <p className={cn(
                    "text-xs font-bold text-white truncate w-full transition-opacity duration-300",
                    isFetchingAddress ? "opacity-50" : "opacity-100"
                  )}>
                    {address || "Locating coordinates..."}
                  </p>
                  <div className="flex items-center gap-3 mt-1 opacity-50">
                    <span className="text-[9px] font-mono text-zinc-400">Precision Resolve Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinate Badge Overlay */}
            <div className="absolute bottom-6 left-6 p-4 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl space-y-2">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest w-8">Lat</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{viewState.latitude.toFixed(10)}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest w-8">Lng</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{viewState.longitude.toFixed(10)}</span>
                </div>
            </div>

            {/* Quick Zoom Controls */}
            <div className="absolute right-6 bottom-6 flex flex-col gap-2">
                <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => mapRef.current?.zoomIn()}
                    className="w-10 h-10 rounded-xl bg-zinc-900/90 backdrop-blur-xl border-white/10 text-white hover:bg-zinc-800"
                >
                    <Plus className="w-5 h-5" />
                </Button>
                <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => mapRef.current?.zoomOut()}
                    className="w-10 h-10 rounded-xl bg-zinc-900/90 backdrop-blur-xl border-white/10 text-white hover:bg-zinc-800"
                >
                    <Minus className="w-5 h-5" />
                </Button>
            </div>
          </Map>
        </div>

        <DialogFooter className="p-6 bg-zinc-900/80 backdrop-blur-xl border-t border-border flex sm:justify-between items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="h-12 px-6 rounded-2xl border border-border hover:bg-white/5 text-zinc-400 font-bold uppercase tracking-widest text-[10px] transition-all"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <Button 
            onClick={handleConfirm}
            className="h-12 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/25 transition-all active:scale-95"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
