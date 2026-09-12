import * as React from "react";
import { Radio, Layers, Check, Server, Loader2, Zap } from "lucide-react";
import { Badge, Input, Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { WizardFormData } from "./types";

interface Step3NetworkProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  testingLdap: boolean;
  ldapTestPassed: boolean;
  onTestLdap: () => Promise<void>;
  updateLdapField: (field: string, value: string) => void;
  isLdapFormComplete: boolean;
  isLdapFormatValid: boolean;
}

export function Step3Network({
  formData,
  setFormData,
  testingLdap,
  ldapTestPassed,
  onTestLdap,
  updateLdapField,
  isLdapFormComplete,
  isLdapFormatValid,
}: Step3NetworkProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* WireGuard VPN Allocation */}
      <div className="rounded-xl border border-border/80 bg-card/80 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-primary" />
            <span className="text-xs font-bold text-foreground">WireGuard Mesh Virtual IP</span>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
            AUTO-ALLOCATED
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-mono">Assigned Overlay IP</span>
            <Input
              value={formData.wireguardIp}
              onChange={(e) => setFormData((prev) => ({ ...prev, wireguardIp: e.target.value }))}
              className="h-8 font-mono text-xs bg-background border-border"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-mono">Target BRAS / POP Hub</span>
            <select
              value={formData.popGateway}
              onChange={(e) => setFormData((prev) => ({ ...prev, popGateway: e.target.value }))}
              className="w-full h-8 px-2 rounded-md bg-background border border-border text-foreground text-xs font-mono outline-none"
            >
              <option value="POP-ID-CGK-01">POP-ID-CGK-01 (Gandaria DC - Primary)</option>
              <option value="POP-ID-BDO-02">POP-ID-BDO-02 (Dago Telco Hub)</option>
              <option value="POP-ID-SUB-03">POP-ID-SUB-03 (Surabaya Rungkut)</option>
            </select>
          </div>
        </div>
      </div>

      {/* LDAP / SSO Toggle */}
      <div
        onClick={() => setFormData((prev) => ({ ...prev, ldapEnabled: !prev.ldapEnabled }))}
        className={cn(
          "p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
          formData.ldapEnabled ? "bg-primary/10 border-primary" : "bg-card/60 border-border"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-8 rounded-lg flex items-center justify-center",
              formData.ldapEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            <Layers className="size-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Enterprise LDAP / Active Directory Sync</p>
            <p className="text-[10px] text-muted-foreground">Federasikan otentikasi staf ISP dengan direktori perusahaan.</p>
          </div>
        </div>
        <div
          className={cn(
            "size-4 rounded-full border flex items-center justify-center",
            formData.ldapEnabled ? "border-primary bg-primary text-primary-foreground" : "border-border"
          )}
        >
          {formData.ldapEnabled && <Check className="size-2.5" />}
        </div>
      </div>

      {/* LDAP Form Fields */}
      {formData.ldapEnabled && (
        <div className="space-y-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <Server className="size-3" /> LDAP Server URL <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.ldapUrl}
              onChange={(e) => updateLdapField("ldapUrl", e.target.value)}
              placeholder="ldap://ldap.nusantara.net:389"
              className="bg-background text-xs h-8 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Base DN <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ldapBaseDn}
                onChange={(e) => updateLdapField("ldapBaseDn", e.target.value)}
                placeholder="dc=nusantara,dc=net"
                className="bg-background text-xs h-8 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Bind DN <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ldapBindDn}
                onChange={(e) => updateLdapField("ldapBindDn", e.target.value)}
                placeholder="cn=admin,dc=nusantara,dc=net"
                className="bg-background text-xs h-8 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Bind Password <span className="text-destructive">*</span>
            </label>
            <Input
              type="password"
              value={formData.ldapBindPassword}
              onChange={(e) => updateLdapField("ldapBindPassword", e.target.value)}
              placeholder="••••••••"
              className="bg-background text-xs h-8"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onTestLdap}
            disabled={testingLdap || !isLdapFormComplete || !isLdapFormatValid}
            className="w-full h-8 text-xs font-semibold mt-1 border-primary/30 text-primary hover:bg-primary/10"
          >
            {testingLdap ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Zap className="size-3.5 mr-1.5" />}
            {testingLdap ? "Testing LDAP Connection..." : ldapTestPassed ? "Connection Verified ✓" : "Test LDAP Connection"}
          </Button>
        </div>
      )}
    </div>
  );
}
