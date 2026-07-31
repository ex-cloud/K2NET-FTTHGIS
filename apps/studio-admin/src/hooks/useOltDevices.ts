"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

// ─── Local type (shape matches oltDevicesMock in observability-mock.ts) ───────
export interface OltDevice {
  hostname: string;
  ip: string;
  vendor: string;
  snmpStatus: "OK" | "SLOW" | "DOWN";
  odpCount: number;
  opticalAttn: string;
  location: string;
}



export function useOltDevices() {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<OltDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchDevices = useCallback(async () => {
    if (!session?.accessToken) { setLoading(false); return; }
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const res = await fetch("/api/v1/network/olts?size=100", {
        headers,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`olts list returned ${res.status}`);
      const payload = await res.json();
      
      const content = payload?.content || [];
      const mapped: OltDevice[] = content.map((o: any) => {
        let snmp: "OK" | "SLOW" | "DOWN" = "OK";
        if (o.healthStatus === "CRITICAL" || o.healthStatus === "DOWN" || o.status === "DOWN") {
          snmp = "DOWN";
        } else if (o.healthStatus === "WARNING" || o.status === "SLOW") {
          snmp = "SLOW";
        }
        
        return {
          hostname: o.name || o.code || "Unnamed OLT",
          ip: o.ipAddress || "—",
          vendor: o.code?.toLowerCase().includes("zte") ? "ZTE" 
                : o.code?.toLowerCase().includes("huawei") ? "Huawei" 
                : o.code?.toLowerCase().includes("fiberhome") ? "Fiberhome"
                : "Generic",
          snmpStatus: snmp,
          odpCount: 0,
          opticalAttn: "—",
          location: o.address || (o.lat && o.lng ? `${o.lat}, ${o.lng}` : "—"),
        };
      });

      if (mounted.current) {
        setDevices(mapped);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError("OLT telemetry unavailable");
        setDevices([]);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    mounted.current = true;
    fetchDevices();
    const interval = setInterval(fetchDevices, 60_000);
    return () => { mounted.current = false; clearInterval(interval); };
  }, [fetchDevices]);

  return { devices, loading, error, refresh: fetchDevices };
}
