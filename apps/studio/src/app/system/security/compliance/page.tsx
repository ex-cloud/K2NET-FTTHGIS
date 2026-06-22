"use client";

import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  ShieldCheck,
  RefreshCw,
  Clock,
  MessageSquare,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function SecurityCompliancePage() {
  const { settings, loading, updateSettings, isUpdating } = useSystemSettings();

  // Compliance Settings States
  const [sessionTimeout, setSessionTimeout] = useState<number>(30); // 30 mins
  const [mapLockDuration, setMapLockDuration] = useState<number>(10); // 10 mins
  const [mfaEnforced, setMfaEnforced] = useState<boolean>(false);
  const [waOtpEnabled, setWaOtpEnabled] = useState<boolean>(false);

  // WhatsApp Gateway States
  const [waEnabled, setWaEnabled] = useState<boolean>(false);
  const [waUrl, setWaUrl] = useState<string>("https://api.whatsapp-gateway.com/send");
  const [waToken, setWaToken] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);

  // Sync state from settings when loaded
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (settings && settings.length > 0) {
      const timeoutSetting = settings.find(s => s.key === "session_idle_timeout");
      const lockSetting = settings.find(s => s.key === "map_auto_lock_duration");
      const mfaSetting = settings.find(s => s.key === "enforce_mfa");
      const otpSetting = settings.find(s => s.key === "wa_otp_enabled");
      
      const waEnabledSetting = settings.find(s => s.key === "wa_gateway_enabled");
      const waUrlSetting = settings.find(s => s.key === "wa_gateway_api_url");
      const waTokenSetting = settings.find(s => s.key === "wa_gateway_token");

      if (timeoutSetting) setSessionTimeout(parseInt(timeoutSetting.value) || 30);
      if (lockSetting) setMapLockDuration(parseInt(lockSetting.value) || 10);
      if (mfaSetting) setMfaEnforced(mfaSetting.value === "true");
      if (otpSetting) setWaOtpEnabled(otpSetting.value === "true");

      if (waEnabledSetting) setWaEnabled(waEnabledSetting.value === "true");
      if (waUrlSetting) setWaUrl(waUrlSetting.value || "https://api.whatsapp-gateway.com/send");
      if (waTokenSetting) setWaToken(waTokenSetting.value || "");
    }
  }, [settings]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSaveCompliance = async () => {
    try {
      await updateSettings({
        "session_idle_timeout": sessionTimeout.toString(),
        "map_auto_lock_duration": mapLockDuration.toString(),
        "enforce_mfa": mfaEnforced.toString(),
        "wa_otp_enabled": waOtpEnabled.toString(),
        "wa_gateway_enabled": waEnabled.toString(),
        "wa_gateway_api_url": waUrl,
        "wa_gateway_token": waToken
      });
      toast.success("Security compliance rules and gateway parameters updated successfully!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update compliance settings");
    }
  };

  const isChanged = () => {
    if (!settings || settings.length === 0) return false;
    
    const timeoutSetting = settings.find(s => s.key === "session_idle_timeout");
    const lockSetting = settings.find(s => s.key === "map_auto_lock_duration");
    const mfaSetting = settings.find(s => s.key === "enforce_mfa");
    const otpSetting = settings.find(s => s.key === "wa_otp_enabled");
    
    const waEnabledSetting = settings.find(s => s.key === "wa_gateway_enabled");
    const waUrlSetting = settings.find(s => s.key === "wa_gateway_api_url");
    const waTokenSetting = settings.find(s => s.key === "wa_gateway_token");

    return (
      sessionTimeout !== (timeoutSetting ? parseInt(timeoutSetting.value) : 30) ||
      mapLockDuration !== (lockSetting ? parseInt(lockSetting.value) : 10) ||
      mfaEnforced !== (mfaSetting ? mfaSetting.value === "true" : false) ||
      waOtpEnabled !== (otpSetting ? otpSetting.value === "true" : false) ||
      waEnabled !== (waEnabledSetting ? waEnabledSetting.value === "true" : false) ||
      waUrl !== (waUrlSetting ? waUrlSetting.value : "https://api.whatsapp-gateway.com/send") ||
      waToken !== (waTokenSetting ? waTokenSetting.value : "")
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col pt-16 px-8 bg-[#0c0c0c] min-h-screen text-zinc-100 overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64 bg-zinc-800" />
            <Skeleton className="h-4 w-96 bg-zinc-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full bg-zinc-800/50 rounded-lg" />
            <Skeleton className="h-[300px] w-full bg-zinc-800/50 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#0c0c0c] h-full overflow-y-auto custom-scrollbar select-none text-zinc-100">
      <div className="w-full max-w-5xl mx-auto space-y-10 pb-20">
        
        {/* Header section */}
        <div className="flex items-center justify-between border-b border-zinc-800/40 pb-6 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-emerald-500" /> Security & Compliance Policies
            </h1>
            <p className="text-xs text-zinc-400">
              Manage automatic session timeouts, dynamic map locks, WhatsApp OTP compliance gateway parameters, and MFA enforcement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Session & Lock Durations */}
          <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-zinc-800/40">
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" /> Timeout & Inactivity Rules
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Prevent unauthorized access from left-behind or inactive developer/editor workstations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Session Inactivity Timeout */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-zinc-200 text-sm font-medium">Session Idle Logout</Label>
                    <p className="text-xs text-zinc-400 font-normal">Terminate inactive SSO sessions and force user re-auth.</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {sessionTimeout} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <Separator className="bg-zinc-800/60" />

              {/* Map Auto-Lock Timeout */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-zinc-200 text-sm font-medium">Map Canvas Lock</Label>
                    <p className="text-xs text-zinc-400 font-normal">Automatically blur and lock active FTTH GIS map screens.</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {mapLockDuration} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="2"
                  value={mapLockDuration}
                  onChange={(e) => setMapLockDuration(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <Separator className="bg-zinc-800/60" />

              {/* Multi Factor Authentication Switches */}
              <div className="space-y-4">
                
                {/* Enforce MFA Globally */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-zinc-800 bg-zinc-950/20">
                  <div className="space-y-1">
                    <Label className="text-zinc-200 text-xs font-semibold">Enforce Device Verification</Label>
                    <p className="text-[10px] text-zinc-400">Require OTP step-up authentication when login from a new device is detected.</p>
                  </div>
                  <Switch
                    checked={mfaEnforced}
                    onCheckedChange={setMfaEnforced}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                {/* WhatsApp OTP Mode */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-zinc-800 bg-zinc-950/20">
                  <div className="space-y-1">
                    <Label className="text-zinc-200 text-xs font-semibold">WhatsApp Gateway OTP</Label>
                    <p className="text-[10px] text-zinc-400">Use WhatsApp API as primary Multi-Factor auth provider instead of Email.</p>
                  </div>
                  <Switch
                    checked={waOtpEnabled}
                    onCheckedChange={setWaOtpEnabled}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

              </div>

            </CardContent>
          </Card>

          {/* Card 2: WhatsApp Notification & OTP Gateway Settings */}
          <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-zinc-800/40">
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp API Gateway Config
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Integrate external messaging APIs (e.g. Fonnte, RuangWA) to broadcast alarms and verify OTPs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              
              {/* WA Enabled switch */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/20">
                <div className="space-y-0.5">
                  <Label className="text-zinc-200 text-xs font-semibold">Enable WhatsApp Notifications</Label>
                  <p className="text-[10px] text-zinc-400 font-normal">Switch to active or developer mock simulation mode.</p>
                </div>
                <Switch
                  checked={waEnabled}
                  onCheckedChange={setWaEnabled}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {/* API Endpoints and token inputs */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="wa_api_url" className="text-zinc-300 text-xs">Gateway API URL Endpoint</Label>
                  <Input
                    id="wa_api_url"
                    value={waUrl}
                    disabled={!waEnabled}
                    onChange={(e) => setWaUrl(e.target.value)}
                    placeholder="https://api.fonnte.com/send"
                    className="bg-zinc-900/60 border-zinc-800 text-zinc-200 text-xs h-9 disabled:opacity-40"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="wa_secret_token" className="text-zinc-300 text-xs">Authorization Secret Token</Label>
                  <div className="relative">
                    <Input
                      id="wa_secret_token"
                      type={showToken ? "text" : "password"}
                      value={waToken}
                      disabled={!waEnabled}
                      onChange={(e) => setWaToken(e.target.value)}
                      placeholder="Enter API token secret..."
                      className="bg-zinc-900/60 border-zinc-800 text-zinc-200 text-xs h-9 pr-10 disabled:opacity-40"
                    />
                    <button
                      type="button"
                      disabled={!waEnabled}
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Compliance Precaution banner */}
              {!waEnabled && (
                <div className="p-3 rounded-lg border border-yellow-500/10 bg-yellow-500/5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    <strong>Developer Sandbox Fallback:</strong> WhatsApp API gateway is disabled. All OTP authentication and service messages will be routed straight to the backend debug console/logs.
                  </p>
                </div>
              )}

            </CardContent>
            <CardFooter className="border-t border-zinc-800/40 pt-4 flex justify-end">
              <Button
                onClick={handleSaveCompliance}
                disabled={isUpdating || !isChanged()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
              >
                {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Apply Configuration Settings
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>
    </div>
  );
}
