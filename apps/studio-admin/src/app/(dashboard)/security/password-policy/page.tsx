

import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ScrollText,
  ShieldCheck,
  Lock,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button, Input, Label, Switch, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Skeleton, Separator, TracingBeam, ActionTooltip } from "@k2net/ui";

export default function PasswordPolicyPage() {
  const { settings, loading, updateSettings, isUpdating } = useSystemSettings();

  // Password Policy Local States
  const [minLength, setMinLength] = useState<number>(8);
  const [requireSymbols, setRequireSymbols] = useState<boolean>(true);
  const [requireNumbers, setRequireNumbers] = useState<boolean>(true);
  const [requireUppercase, setRequireUppercase] = useState<boolean>(true);
  const [historyLimit, setHistoryLimit] = useState<number>(3);
  const [expiryDays, setExpiryDays] = useState<number>(90);

  // Sync state from settings when loaded
   
  useEffect(() => {
    if (settings && settings.length > 0) {
      const minLenSetting = settings.find(s => s.key === "password_min_length");
      const symbolsSetting = settings.find(s => s.key === "password_require_symbols");
      const numbersSetting = settings.find(s => s.key === "password_require_numbers");
      const upperSetting = settings.find(s => s.key === "password_require_uppercase");
      const historySetting = settings.find(s => s.key === "password_history_limit");
      const expirySetting = settings.find(s => s.key === "password_expiry_days");

      if (minLenSetting) setMinLength(parseInt(minLenSetting.value) || 8);
      if (symbolsSetting) setRequireSymbols(symbolsSetting.value === "true");
      if (numbersSetting) setRequireNumbers(numbersSetting.value === "true");
      if (upperSetting) setRequireUppercase(upperSetting.value === "true");
      if (historySetting) setHistoryLimit(parseInt(historySetting.value) || 3);
      if (expirySetting) setExpiryDays(parseInt(expirySetting.value) || 90);
    }
  }, [settings]);
   

  const handleSavePolicies = async () => {
    try {
      await updateSettings({
        "password_min_length": minLength.toString(),
        "password_require_symbols": requireSymbols.toString(),
        "password_require_numbers": requireNumbers.toString(),
        "password_require_uppercase": requireUppercase.toString(),
        "password_history_limit": historyLimit.toString(),
        "password_expiry_days": expiryDays.toString()
      });
      toast.success("Password policies and complexity rules updated successfully!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update password policies");
    }
  };

  const isChanged = () => {
    if (!settings || settings.length === 0) return false;
    
    const minLenSetting = settings.find(s => s.key === "password_min_length");
    const symbolsSetting = settings.find(s => s.key === "password_require_symbols");
    const numbersSetting = settings.find(s => s.key === "password_require_numbers");
    const upperSetting = settings.find(s => s.key === "password_require_uppercase");
    const historySetting = settings.find(s => s.key === "password_history_limit");
    const expirySetting = settings.find(s => s.key === "password_expiry_days");

    return (
      minLength !== (minLenSetting ? parseInt(minLenSetting.value) : 8) ||
      requireSymbols !== (symbolsSetting ? symbolsSetting.value === "true" : true) ||
      requireNumbers !== (numbersSetting ? numbersSetting.value === "true" : true) ||
      requireUppercase !== (upperSetting ? upperSetting.value === "true" : true) ||
      historyLimit !== (historySetting ? parseInt(historySetting.value) : 3) ||
      expiryDays !== (expirySetting ? parseInt(expirySetting.value) : 90)
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background min-h-screen text-foreground overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64 bg-muted" />
            <Skeleton className="h-4 w-96 bg-muted" />
          </div>
          <Skeleton className="h-[400px] w-full bg-muted/50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-16 px-4 md:px-8 bg-background h-full overflow-y-auto custom-scrollbar select-none text-foreground">
      <div className="w-full max-w-4xl mx-auto space-y-10 pb-20">
        
        {/* Header section */}
        <div className="flex items-center justify-between border-b border-border/40 pb-6 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <ScrollText className="w-8 h-8 text-primary" /> Password Security Policies
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure corporate credential rules, complexity parameters, rotation timelines, and key history protections.
            </p>
          </div>
        </div>

        <TracingBeam className="pl-4 md:pl-10">
          <div className="grid grid-cols-1 gap-8">
          
          <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Complexity & Validation Constraints
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                These rules will be enforced across both local logins and tenant portal invites automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Minimum Length */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-foreground text-sm font-medium">Minimum Password Length</Label>
                    <p className="text-xs text-muted-foreground">Specify the minimum number of characters required for any new password.</p>
                  </div>
                  <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {minLength} characters
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={minLength}
                  onChange={(e) => setMinLength(parseInt(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <Separator className="bg-muted/60" />

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Require Symbols */}
                <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-background/20">
                  <div className="space-y-1 pr-2">
                    <Label className="text-foreground text-xs font-semibold">Special Characters</Label>
                    <p className="text-[10px] text-muted-foreground">Require at least 1 symbol (@, #, $, etc.)</p>
                  </div>
                  <Switch
                    checked={requireSymbols}
                    onCheckedChange={setRequireSymbols}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {/* Require Numbers */}
                <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-background/20">
                  <div className="space-y-1 pr-2">
                    <Label className="text-foreground text-xs font-semibold">Numeric Digits</Label>
                    <p className="text-[10px] text-muted-foreground">Require at least 1 number (0-9)</p>
                  </div>
                  <Switch
                    checked={requireNumbers}
                    onCheckedChange={setRequireNumbers}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {/* Require Uppercase */}
                <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-background/20">
                  <div className="space-y-1 pr-2">
                    <Label className="text-foreground text-xs font-semibold">Uppercase Letters</Label>
                    <p className="text-[10px] text-muted-foreground">Require at least 1 uppercase letter (A-Z)</p>
                  </div>
                  <Switch
                    checked={requireUppercase}
                    onCheckedChange={setRequireUppercase}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

              </div>

              <Separator className="bg-muted/60" />

              {/* Password History & Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* History Limit */}
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-semibold">Password History Limit</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">Prevent reuse of previous passwords. Set to 0 to disable.</p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      value={historyLimit}
                      onChange={(e) => setHistoryLimit(parseInt(e.target.value) || 0)}
                      className="bg-muted/60 border-border text-foreground text-xs h-9 w-24 font-mono text-center"
                    />
                    <span className="text-xs text-muted-foreground">historic password(s) remembered</span>
                  </div>
                </div>

                {/* Expiry Days */}
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-semibold">Password Expiration Interval</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">Force users to rotate credentials periodically. Set to 0 for lifetime access.</p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value) || 0)}
                      className="bg-muted/60 border-border text-foreground text-xs h-9 w-24 font-mono text-center"
                    />
                    <span className="text-xs text-muted-foreground">days until password expires</span>
                  </div>
                </div>

              </div>

            </CardContent>
            <CardFooter className="border-t border-border/40 pt-4 flex justify-end gap-3">
              <ActionTooltip label={isChanged() ? "Simpan Perubahan Kebijakan Password" : "Tidak Ada Perubahan"} shortcut="Ctrl+S">
                <Button
                  onClick={handleSavePolicies}
                  disabled={isUpdating || !isChanged()}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs h-9 px-4 font-medium transition-all shadow-md gap-2"
                >
                  {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Apply Password Policies
                </Button>
              </ActionTooltip>
            </CardFooter>
          </Card>

          {/* Policy Preview Visual Simulator Card */}
          <Card className="bg-muted/10 border-border/40">
            <CardContent className="p-6 flex items-start gap-4">
              <KeyRound className="w-8 h-8 text-primary/80 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Rule Evaluation Matrix</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Based on the rules selected above, any secure password in your database will need to fulfill the following evaluation mask:
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-primary" /> Length &gt;= {minLength}
                  </span>
                  {requireSymbols && (
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-primary" /> Char class [!@#$%^&amp;*]
                    </span>
                  )}
                  {requireNumbers && (
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-primary" /> Numeric [0-9]
                    </span>
                  )}
                  {requireUppercase && (
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-primary" /> Case [A-Z]
                    </span>
                  )}
                  {historyLimit > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-primary" /> History Limit [{historyLimit}]
                    </span>
                  )}
                  {expiryDays > 0 ? (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> Expiry Days [{expiryDays}]
                    </span>
                  ) : (
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-primary" /> Infinite Expiration
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          </div>
        </TracingBeam>
      </div>
    </div>
  );
}
