"use client";

import { useSystemSettings } from "@/hooks/useSystemSettings";
import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Settings,
  Mail,
  Lock,
  Map,
  Sparkles,
  Save,
  RefreshCw,
  ServerCrash,
  Play,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Upload,
  X,
  MapPin,
  ShieldCheck,
  Blocks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MapCoordinatePicker } from "@/components/dashboard/map-coordinate-picker";
import { GithubIntegrationCard } from "@/components/system-settings/GithubIntegrationCard";

export default function SystemSettingsPage() {
  const {
    settings,
    loading,
    error,
    updateSettings,
    isUpdating,
    testEmail,
    isTestingEmail,
    refresh
  } = useSystemSettings();

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "general";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const githubIntegrationValue = settings.find((s) => s.key === "github_integration")?.value;
  
  // Interactive UI States
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Helper to read current value (either local edit or DB setting)
  const getValue = (key: string, defaultValue: string = ""): string => {
    if (formValues[key] !== undefined) {
      return formValues[key];
    }
    const dbVal = settings.find((s) => s.key === key)?.value;
    return dbVal !== undefined ? dbVal : defaultValue;
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSwitchChange = (key: string, checked: boolean) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: checked ? "true" : "false",
    }));
  };

  const handleSave = async (category: string) => {
    const keysToSave: Record<string, string> = {};
    settings
      .filter((s) => s.category === category)
      .forEach((s) => {
        keysToSave[s.key] = getValue(s.key, s.value);
      });

    try {
      await updateSettings(keysToSave);
      toast.success(`${category} settings saved successfully!`);
    } catch (e: unknown) {
      const error = e as Error;
      toast.error(error.message || "Failed to save settings");
    }
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, SVG, WEBP).");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Logo file size must be less than 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleInputChange("logo_url", e.target.result as string);
        toast.success("Logo imported successfully! Preview below.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTestSmtp = async () => {
    const host = getValue("smtp_host");
    const port = parseInt(getValue("smtp_port", "2525"), 10);
    const username = getValue("smtp_username");
    const password = getValue("smtp_password");

    if (!host || !port) {
      toast.error("SMTP Host and Port are required for testing.");
      return;
    }

    setSmtpTestResult(null);
    try {
      const res = await testEmail({ host, port, username, password });
      setSmtpTestResult({ success: true, message: res.message });
      toast.success("SMTP Connection test successful!");
    } catch (e: unknown) {
      const error = e as Error;
      setSmtpTestResult({ success: false, message: error.message || "SMTP Connection test failed" });
      toast.error("SMTP Connection test failed");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col pt-16 px-8 bg-[#0c0c0c] min-h-screen text-zinc-100 overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48 bg-zinc-800" />
            <Skeleton className="h-4 w-96 bg-zinc-800" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24 bg-zinc-800" />
            <Skeleton className="h-10 w-24 bg-zinc-800" />
            <Skeleton className="h-10 w-24 bg-zinc-800" />
          </div>
          <Skeleton className="h-[400px] w-full bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0c0c0c] text-zinc-200">
        <ServerCrash className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to Load Settings</h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-md text-center">{error}</p>
        <Button onClick={() => refresh()} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
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
              <Settings className="w-8 h-8 text-emerald-500 animate-[spin_8s_linear_infinite]" /> Global Settings
            </h1>
            <p className="text-xs text-zinc-400">
              System-wide configurations, default quotas, SMTP mail server routing, branding, and GIS policies.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refresh()}
            className="border-zinc-800 hover:bg-zinc-800/60 hover:text-white text-zinc-300 gap-2 h-9 px-3 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload Settings
          </Button>
        </div>

        {/* Settings Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg gap-1">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 text-zinc-400 text-xs px-4 py-2 gap-2 transition-all rounded-md"
            >
              <Settings className="w-3.5 h-3.5" /> General
            </TabsTrigger>
            <TabsTrigger
              value="smtp"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 text-zinc-400 text-xs px-4 py-2 gap-2 transition-all rounded-md"
            >
              <Mail className="w-3.5 h-3.5" /> SMTP Mail
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 text-zinc-400 text-xs px-4 py-2 gap-2 transition-all rounded-md"
            >
              <Lock className="w-3.5 h-3.5" /> Security Policies
            </TabsTrigger>
            <TabsTrigger
              value="gis"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 text-zinc-400 text-xs px-4 py-2 gap-2 transition-all rounded-md"
            >
              <Map className="w-3.5 h-3.5" /> GIS Map
            </TabsTrigger>
            <TabsTrigger
              value="branding"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 text-zinc-400 text-xs px-4 py-2 gap-2 transition-all rounded-md"
            >
              <Sparkles className="w-3.5 h-3.5" /> Branding & Whitelabel
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 text-zinc-400 text-xs px-4 py-2 gap-2 transition-all rounded-md"
            >
              <Blocks className="w-3.5 h-3.5" /> Integrations
            </TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general">
            <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-zinc-800/40">
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  General Platform Settings
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Configure primary platform default variables and maintenance modes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* Default Storage Quota */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="default_storage_quota" className="text-zinc-200 text-sm">
                      Default Storage Quota (GB)
                    </Label>
                    <span className="text-[10px] text-zinc-500">Key: default_storage_quota</span>
                  </div>
                  <Input
                    id="default_storage_quota"
                    type="number"
                    value={getValue("default_storage_quota", "10")}
                    onChange={(e) => handleInputChange("default_storage_quota", e.target.value)}
                    placeholder="e.g. 10"
                    className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs max-w-md focus:border-emerald-500/50 focus:ring-emerald-500/50"
                  />
                  <p className="text-[11px] text-zinc-400 italic">
                    The default file storage limit automatically allocated for newly registered organizations/tenants.
                  </p>
                </div>

                <div className="border-t border-zinc-800/40 my-6" />

                {/* System Maintenance Mode */}
                <div className="flex items-start justify-between max-w-2xl gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="system_maintenance_mode" className="text-zinc-200 text-sm font-medium">
                        System-wide Maintenance Mode
                      </Label>
                      <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">
                        system_maintenance_mode
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      When enabled, all global and tenant user portals will be locked with an elegant maintenance screen. Only Super Admins can bypass this lock.
                    </p>
                  </div>
                  <Switch
                    id="system_maintenance_mode"
                    checked={getValue("system_maintenance_mode", "false") === "true"}
                    onCheckedChange={(checked) => handleSwitchChange("system_maintenance_mode", checked)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

              </CardContent>
              <CardFooter className="border-t border-zinc-800/40 pt-4 flex justify-end">
                <Button
                  onClick={() => handleSave("GENERAL")}
                  disabled={isUpdating}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
                >
                  {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save General Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* SMTP TAB */}
          <TabsContent value="smtp">
            <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-zinc-800/40">
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  SMTP Mail Server Configuration
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Routing and security settings for the platform&apos;s central outgoing email server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* SMTP Host */}
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host" className="text-zinc-200 text-xs">
                      SMTP Host
                    </Label>
                    <Input
                      id="smtp_host"
                      type="text"
                      value={getValue("smtp_host", "")}
                      onChange={(e) => handleInputChange("smtp_host", e.target.value)}
                      placeholder="e.g. smtp.mailtrap.io"
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* SMTP Port */}
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port" className="text-zinc-200 text-xs">
                      SMTP Port
                    </Label>
                    <Input
                      id="smtp_port"
                      type="text"
                      value={getValue("smtp_port", "")}
                      onChange={(e) => handleInputChange("smtp_port", e.target.value)}
                      placeholder="e.g. 2525, 465, or 587"
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* SMTP Username */}
                  <div className="space-y-2">
                    <Label htmlFor="smtp_username" className="text-zinc-200 text-xs">
                      SMTP Username
                    </Label>
                    <Input
                      id="smtp_username"
                      type="text"
                      value={getValue("smtp_username", "")}
                      onChange={(e) => handleInputChange("smtp_username", e.target.value)}
                      placeholder="e.g. smtp_user"
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* SMTP Password */}
                  <div className="space-y-2">
                    <Label htmlFor="smtp_password" className="text-zinc-200 text-xs">
                      SMTP Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="smtp_password"
                        type={showPassword ? "text" : "password"}
                        value={getValue("smtp_password", "")}
                        onChange={(e) => handleInputChange("smtp_password", e.target.value)}
                        placeholder="********"
                        className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs pr-10 focus:border-emerald-500/50 focus:ring-emerald-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* SMTP From (Sender) */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="smtp_from" className="text-zinc-200 text-xs">
                      Default Sender Email (&quot;From&quot; Address)
                    </Label>
                    <Input
                      id="smtp_from"
                      type="email"
                      value={getValue("smtp_from", "")}
                      onChange={(e) => handleInputChange("smtp_from", e.target.value)}
                      placeholder="e.g. noreply@ftthgis.com"
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                  </div>

                </div>

                <div className="border-t border-zinc-800/40 my-6" />

                {/* SMTP Connection Testing area */}
                <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-950/40 space-y-4 max-w-3xl">
                  <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-emerald-500" /> Interactive Connection Test
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Test your current input settings instantly by connecting directly to the SMTP host. Sockets will test connection times and verify security.
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestSmtp}
                      disabled={isTestingEmail}
                      className="border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-300 text-xs h-9 px-3 gap-2"
                    >
                      {isTestingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Run Connection Test
                    </Button>

                    {smtpTestResult && (
                      <div className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded border ${
                        smtpTestResult.success 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {smtpTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {smtpTestResult.message}
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
              <CardFooter className="border-t border-zinc-800/40 pt-4 flex justify-end">
                <Button
                  onClick={() => handleSave("SMTP")}
                  disabled={isUpdating}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
                >
                  {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save SMTP Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security">
            <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-zinc-800/40">
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  Central Security Policies
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Enforce authentication guidelines and self-registration rights across the multi-tenant system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* Allow Global Self-Registration */}
                <div className="flex items-start justify-between max-w-2xl gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="allow_self_registration" className="text-zinc-200 text-sm font-medium">
                        Allow Global Self-Registration
                      </Label>
                      <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">
                        allow_self_registration
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      When enabled, the general user registration page is unlocked. Users can register their own organization/account directly. When disabled, users can only be invited by an Administrator.
                    </p>
                  </div>
                  <Switch
                    id="allow_self_registration"
                    checked={getValue("allow_self_registration", "false") === "true"}
                    onCheckedChange={(checked) => handleSwitchChange("allow_self_registration", checked)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="border-t border-zinc-800/40 my-6" />

                {/* Enforce MFA/2FA */}
                <div className="flex items-start justify-between max-w-2xl gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="enforce_mfa" className="text-zinc-200 text-sm font-medium">
                        Force Multi-Factor Authentication (MFA / 2FA)
                      </Label>
                      <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">
                        enforce_mfa
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Enforce active 2FA using TOTP (Authenticator App) for all Super Administrators and tenant administrative personnel upon next login.
                    </p>
                  </div>
                  <Switch
                    id="enforce_mfa"
                    checked={getValue("enforce_mfa", "false") === "true"}
                    onCheckedChange={(checked) => handleSwitchChange("enforce_mfa", checked)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

              </CardContent>
              <CardFooter className="border-t border-zinc-800/40 pt-4 flex justify-end">
                <Button
                  onClick={() => handleSave("SECURITY")}
                  disabled={isUpdating}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
                >
                  {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Security Policies
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* GIS MAP CONFIGURATION TAB */}
          <TabsContent value="gis">
            <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-zinc-800/40">
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  GIS Map Engine Configuration
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Customize coordinates, zoom levels, and Martin vector tile URLs globally.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Default Latitude */}
                  <div className="space-y-2">
                    <Label htmlFor="default_map_lat" className="text-zinc-200 text-xs">
                      Default Latitude
                    </Label>
                    <Input
                      id="default_map_lat"
                      type="text"
                      value={getValue("default_map_lat", "")}
                      onChange={(e) => handleInputChange("default_map_lat", e.target.value)}
                      placeholder="e.g. -6.9175"
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* Default Longitude */}
                  <div className="space-y-2">
                    <Label htmlFor="default_map_lng" className="text-zinc-200 text-xs">
                      Default Longitude
                    </Label>
                    <Input
                      id="default_map_lng"
                      type="text"
                      value={getValue("default_map_lng", "")}
                      onChange={(e) => handleInputChange("default_map_lng", e.target.value)}
                      placeholder="e.g. 107.6191"
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* Default Map Address */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="default_map_address" className="text-zinc-200 text-xs">
                      Default Map Center Address
                    </Label>
                    <Input
                      id="default_map_address"
                      type="text"
                      value={getValue("default_map_address", "")}
                      onChange={(e) => handleInputChange("default_map_address", e.target.value)}
                      placeholder="Resolved address will be filled here automatically"
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                    <p className="text-[10px] text-zinc-400 italic">
                      The resolved textual address matching the default center coordinate. Automatically geocoded via OSM when using the Map Picker.
                    </p>
                  </div>

                  {/* Default Zoom Level */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="default_map_zoom" className="text-zinc-200 text-xs">
                      Default Zoom Level
                    </Label>
                    <Input
                      id="default_map_zoom"
                      type="number"
                      value={getValue("default_map_zoom", "12")}
                      onChange={(e) => handleInputChange("default_map_zoom", e.target.value)}
                      placeholder="e.g. 12"
                      min={0}
                      max={24}
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs max-w-md focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* Interactive Map Picker Trigger */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-zinc-200 text-xs">
                      Visual Coordinates Settings
                    </Label>
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 space-y-3">
                      <p className="text-[11px] text-zinc-400">
                        Prefer selecting coordinates on an interactive map? Click the button below to pick your default center coordinate and automatically geocode the location.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMapPickerOpen(true)}
                        className="border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-300 text-xs h-9 px-4 gap-2 transition-all"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        Open Interactive Map Picker
                      </Button>
                    </div>
                  </div>

                  {/* Vector Tile Source */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vector_tile_source" className="text-zinc-200 text-xs">
                      Martin Vector Tile Server Source Template
                    </Label>
                    <Input
                      id="vector_tile_source"
                      type="text"
                      value={getValue("vector_tile_source", "")}
                      onChange={(e) => handleInputChange("vector_tile_source", e.target.value)}
                      placeholder="http://localhost:3001/tiles/{z}/{x}/{y}.pbf"
                      className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                    />
                    <p className="text-[10px] text-zinc-400 italic">
                      The dynamic URL endpoint structure used by Mapbox/Maplibre to load PostGIS vectorized network node clusters.
                    </p>
                  </div>

                </div>

              </CardContent>
              <CardFooter className="border-t border-zinc-800/40 pt-4 flex justify-end">
                <Button
                  onClick={() => handleSave("GIS")}
                  disabled={isUpdating}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
                >
                  {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save GIS Configuration
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* BRANDING TAB */}
          <TabsContent value="branding">
            <Card className="bg-zinc-900/40 border-zinc-800/80 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-zinc-800/40">
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  Branding & Whitelabel Platform Settings
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Personalize and custom-brand the title and primary logo globally across the entire platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Form input fields */}
                  <div className="space-y-5">
                    {/* Application Name */}
                    <div className="space-y-2">
                      <Label htmlFor="app_name" className="text-zinc-200 text-xs">
                        Application Name
                      </Label>
                      <Input
                        id="app_name"
                        type="text"
                        value={getValue("app_name", "")}
                        onChange={(e) => handleInputChange("app_name", e.target.value)}
                        placeholder="e.g. FTTH GIS Platform"
                        className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                      />
                    </div>

                    {/* Logo URL */}
                    <div className="space-y-2">
                      <Label htmlFor="logo_url" className="text-zinc-200 text-xs">
                        System Logo URL / Base64 Data String
                      </Label>
                      <Input
                        id="logo_url"
                        type="text"
                        value={getValue("logo_url", "")}
                        onChange={(e) => handleInputChange("logo_url", e.target.value)}
                        placeholder="e.g. /next.svg or data:image/png;base64,..."
                        className="bg-zinc-950/60 border-zinc-800/85 text-zinc-200 text-xs focus:border-emerald-500/50 focus:ring-emerald-500/50"
                      />
                    </div>

                    {/* Drag & Drop File Upload Area */}
                    <div className="space-y-2">
                      <Label className="text-zinc-200 text-xs">
                        Upload or Import Logo Image
                      </Label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleLogoFile(e.dataTransfer.files[0]); }}
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                          dragActive 
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
                            : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700/80"
                        }`}
                        onClick={() => document.getElementById("logo-file-input")?.click()}
                      >
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleLogoFile(e.target.files[0]); }}
                        />
                        <Upload className="w-5 h-5 mx-auto mb-2 text-zinc-500" />
                        <p className="text-xs font-medium text-zinc-300">Drag & drop logo here, or <span className="text-emerald-500 underline">browse</span></p>
                        <p className="text-[10px] text-zinc-500 mt-1">Supports PNG, JPG, SVG, or WEBP (Max 1MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Brand Live Preview and Review Panel */}
                  <div className="space-y-4">
                    <Label className="text-zinc-200 text-xs">
                      Live Branding Review & Preview
                    </Label>
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-center gap-6 h-[278px]">
                      
                      {/* Real-time Sidebar/Header Simulation */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Simulated Portal Header</span>
                        <div className="flex h-12 w-full items-center justify-between border border-zinc-800 bg-[#0c0c0c] px-4 py-2 rounded-xl shadow-md">
                          <div className="flex items-center gap-x-2">
                            <div className={getValue("logo_url") ? "flex h-5 w-5 items-center justify-center rounded overflow-hidden" : "flex h-5 w-5 items-center justify-center rounded bg-emerald-600/20 border border-emerald-500/30 group overflow-hidden"}>
                              {getValue("logo_url") ? (
                                <Image
                                  src={getValue("logo_url")}
                                  width={20}
                                  height={20}
                                  className="h-5 w-5 object-contain"
                                  alt="Preview Logo"
                                  unoptimized
                                />
                              ) : (
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              )}
                            </div>
                            <Separator orientation="vertical" className="mx-0.5 h-4 bg-zinc-800" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 truncate max-w-[150px]">
                              {getValue("app_name") || "System Admin"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-4 h-4 rounded-full bg-zinc-800/80" />
                            <div className="w-4 h-4 rounded-full bg-zinc-800/80" />
                          </div>
                        </div>
                      </div>

                      {/* Large Brand Icon / Status area */}
                      <div className="flex items-center gap-4 border border-zinc-800/40 p-4 rounded-xl bg-zinc-900/20">
                        <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                          {getValue("logo_url") ? (
                            <Image
                              src={getValue("logo_url")}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-contain"
                              alt="Large Preview"
                              unoptimized
                            />
                          ) : (
                            <div className="text-zinc-600 text-[10px] font-light">No Logo</div>
                          )}
                        </div>
                        <div className="space-y-1 overflow-hidden flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-zinc-200">Application Identity</h4>
                            {getValue("logo_url") !== (settings.find(s => s.key === "logo_url")?.value || "") && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-medium shrink-0">Unsaved changes</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono truncate w-full">
                            {getValue("logo_url") ? (getValue("logo_url").startsWith("data:") ? "Base64 Data String" : getValue("logo_url")) : "Default system icon active"}
                          </p>
                          {getValue("logo_url") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInputChange("logo_url", "")}
                              className="h-5 px-2 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 text-[10px] gap-1 p-0"
                            >
                              <X className="w-3 h-3" /> Reset to default
                            </Button>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </CardContent>
              <CardFooter className="border-t border-zinc-800/40 pt-4 flex justify-end">
                <Button
                  onClick={() => handleSave("BRANDING")}
                  disabled={isUpdating}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
                >
                  {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Branding Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* INTEGRATIONS TAB */}
          <TabsContent value="integrations">
            <GithubIntegrationCard
              githubIntegrationValue={githubIntegrationValue}
              updateSettings={updateSettings}
            />
          </TabsContent>

        </Tabs>

      </div>

      {/* Embedded Map Picker Modal */}
      <MapCoordinatePicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        initialLat={getValue("default_map_lat", "-6.9175")}
        initialLng={getValue("default_map_lng", "107.6191")}
        onConfirm={(lat, lng, address) => {
          handleInputChange("default_map_lat", lat);
          handleInputChange("default_map_lng", lng);
          if (address) {
            handleInputChange("default_map_address", address);
            toast.info(`Coordinate picked: ${address.split(',').slice(0, 2).join(',')}`);
          }
        }}
        title="Select Default Platform Coordinates"
      />

    </div>
  );
}
