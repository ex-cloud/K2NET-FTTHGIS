export interface OltDevice {
  id: string;
  code: string;
  name: string;
  vendorModel: string;
  ipAddress: string;
  popLocation: string;
  ponPortsUsed: number;
  ponPortsTotal: number;
  ontCount: number;
  meanPowerDbm: string;
  status: "UP" | "DEGRADED" | "OFFLINE";
  lastPolled: string;
}

export interface RawDevice {
  id?: string;
  code?: string;
  name?: string;
  type?: string;
  projectName?: string;
  status?: string;
  [key: string]: unknown;
}
