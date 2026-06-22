"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { 
  Blocks, 
  Search, 
  Settings2, 
  ShieldCheck, 
  MessageSquare, 
  Zap, 
  Info, 
  Loader2,
  AlertCircle,
  Check
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SecurityChallengeModal } from "@/components/auth/security-challenge-modal";
import { getCurrentOrgSlug } from "@/lib/domain";

interface Config {
  id: string;
  configKey: string;
  configValue: string;
  isActive: boolean;
  description: string;
}

interface IntegrationField {
  key: string;
  label: string;
  placeholder?: string;
  type: string;
  required?: boolean;
}

export default function IntegrationsPage() {
  const params = useParams();
  const orgId = (params.orgId as string) || (typeof window !== "undefined" ? getCurrentOrgSlug() : "") || "";
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [testingLdap, setTestingLdap] = React.useState(false);
  const [ldapTestPassed, setLdapTestPassed] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState<Record<string, boolean>>({});
  const [isSecurityModalOpen, setIsSecurityModalOpen] = React.useState(false);
  const [pendingChange, setPendingChange] = React.useState<{
    configKey: string;
    configValue: string;
    description: string;
  } | null>(null);

  const markTouched = (field: string) => setTouchedFields(prev => ({ ...prev, [field]: true }));

  // Format validators
  const isValidLdapUrl = (url: string) => !url.trim() || /^ldaps?:\/\/.+/i.test(url.trim());
  const isValidDn = (dn: string) => !dn.trim() || dn.includes('=');

  const hasFieldError = (field: string, value: string, validator?: (v: string) => boolean) => {
    if (!touchedFields[field]) return false;
    if (!value.trim()) return true;
    if (validator && !validator(value)) return true;
    return false;
  };

  // Get the validator for a specific LDAP field
  const getFieldValidator = (key: string) => {
    if (key === 'ldap_url') return isValidLdapUrl;
    if (key.endsWith('_dn')) return isValidDn;
    return undefined;
  };

  // Get format error message for a specific field
  const getFormatError = (key: string, value: string) => {
    if (key === 'ldap_url' && value.trim() && !isValidLdapUrl(value)) return 'URL must start with ldap:// or ldaps://';
    if (key.endsWith('_dn') && value.trim() && !isValidDn(value)) return 'Invalid DN format (must contain \'=\')';
    return null;
  };

  // Helper: check if all required LDAP fields are filled & valid (reads from DOM)
  const isLdapRequiredFieldsValid = () => {
    const requiredKeys = ['ldap_url', 'ldap_bind_dn', 'ldap_bind_password', 'ldap_user_dn'];
    for (const key of requiredKeys) {
      const el = document.querySelector<HTMLInputElement>(`input[name="${key}"]`);
      const val = el?.value || getConfigValue(key);
      if (!val.trim()) return false;
      const validator = getFieldValidator(key);
      if (validator && !validator(val)) return false;
    }
    return true;
  };

  const handleTestLdap = async () => {
    setTestingLdap(true);
    try {
      const getInputValue = (key: string) => {
        const input = document.querySelector(`input[name="${key}"]`) as HTMLInputElement;
        return input ? input.value : getConfigValue(key);
      };

      const payload = {
        ldap_url: getInputValue("ldap_url"),
        ldap_bind_dn: getInputValue("ldap_bind_dn"),
        ldap_bind_password: getInputValue("ldap_bind_password"),
        ldap_user_dn: getInputValue("ldap_user_dn"),
        ldap_user_filter: getInputValue("ldap_user_filter")
      };
      
      const res = await fetch(`/api/v1/organizations/${orgId}/configs/test-ldap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        setLdapTestPassed(true);
        toast.success(data.message || "LDAP Connection Successful");
      } else {
        setLdapTestPassed(false);
        toast.error(data.message || "LDAP Connection Failed");
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to test LDAP connection");
    } finally {
      setTestingLdap(false);
    }
  };

  // Fetch current configs
  const { data: configs, isLoading } = useQuery<Config[]>({
    queryKey: ['org-configs', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/organizations/${orgId}/configs`, {
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch configs");
      return res.json();
    },
    enabled: !!session?.accessToken
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { configKey: string, configValue: string, description: string }) => {
      const res = await fetch(`/api/v1/organizations/${orgId}/configs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update integration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-configs', orgId] });
      toast.success("Integration settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const getConfigValue = (key: string) => 
    configs?.find(c => c.configKey.toLowerCase() === key.toLowerCase())?.configValue || "";

  const integrations: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    category: string;
    fields: IntegrationField[];
    status: string;
  }> = [
    {
      id: "snmp-poller",
      name: "SNMP Poller",
      description: "Connect to your on-premise or cloud SNMP poller to fetch real-time device data.",
      icon: Zap,
      category: "Network",
      fields: [
        { key: "snmp_poller_url", label: "Poller URL", placeholder: "https://poller.yourdomain.com", type: "text", required: false },
        { key: "snmp_community", label: "Read Community", placeholder: "public", type: "password", required: false }
      ],
      status: getConfigValue("snmp_poller_url") ? "Connected" : "Disconnected"
    },
    {
      id: "keycloak",
      name: "Keycloak SSO",
      description: "Enterprise-grade identity and access management for your organization team members.",
      icon: ShieldCheck,
      category: "Security",
      fields: [
        { key: "keycloak_realm", label: "Realm Name", placeholder: "my-tenant-realm", type: "text", required: false },
        { key: "keycloak_client_id", label: "Client ID", placeholder: "gis-app", type: "text", required: false }
      ],
      status: getConfigValue("keycloak_realm") ? "Active" : "Not Configured"
    },
    {
      id: "slack",
      name: "Slack Notifications",
      description: "Get real-time alerts on your Slack channels for network events and outages.",
      icon: MessageSquare,
      category: "Notifications",
      fields: [
        { key: "slack_webhook", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/...", type: "text", required: false }
      ],
      status: "Coming Soon"
    },
    {
      id: "ldap",
      name: "LDAP / Active Directory",
      description: "Sync your enterprise users directly from your internal directory server.",
      icon: ShieldCheck,
      category: "Security",
      fields: [
        { key: "ldap_enabled", label: "Enabled Integration", type: "switch", required: false },
        { key: "ldap_url", label: "LDAP URL", placeholder: "ldap://your-server:389", type: "text", required: true },
        { key: "ldap_bind_dn", label: "Bind DN", placeholder: "cn=admin,dc=example,dc=com", type: "text", required: true },
        { key: "ldap_bind_password", label: "Bind Password", placeholder: "••••••••", type: "password", required: true },
        { key: "ldap_user_dn", label: "User DN", placeholder: "ou=users,dc=example,dc=com", type: "text", required: true },
        { key: "ldap_user_filter", label: "User Filter", placeholder: "(objectClass=person)", type: "text", required: false }
      ],
      status: getConfigValue("ldap_enabled") === "true" ? "Active" : "Not Configured"
    }
  ];

  const filteredIntegrations = integrations.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 w-full">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Blocks className="w-6 h-6 text-emerald-500" />
          Integrations Marketplace
        </h1>
        <p className="text-zinc-500 mt-1">
          Connect your organization with external tools and services to enhance your GIS capabilities.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input 
          className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50"
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" key={configs?.length}>
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="bg-[#0c0c0c] border-zinc-800/50 hover:border-emerald-500/30 transition-all flex flex-col group">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-zinc-900 group-hover:bg-emerald-500/10 transition-colors">
                  <integration.icon className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500" />
                </div>
                <Badge variant="outline" className={`
                  ${integration.status === "Connected" || integration.status === "Active" 
                    ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" 
                    : "border-zinc-800 text-zinc-500"}
                `}>
                  {integration.status}
                </Badge>
              </div>
              <div>
                <CardTitle className="text-zinc-100">{integration.name}</CardTitle>
                <CardDescription className="text-zinc-500 mt-1.5 leading-relaxed">
                  {integration.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {integration.fields.map((field) => (
                field.type === "switch" ? (
                  <div key={field.key} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-900">
                    <div className="space-y-0.5">
                      <Label className="text-zinc-400 text-[10px] uppercase tracking-wider">{field.label}</Label>
                      <p className="text-[10px] text-zinc-600">Toggle this service on or off</p>
                    </div>
                    <Switch 
                      checked={getConfigValue(field.key) === "true"}
                      onCheckedChange={(checked) => {
                        setPendingChange({
                          configKey: field.key,
                          configValue: checked ? "true" : "false",
                          description: `Toggle ${integration.name}`
                        });
                        setIsSecurityModalOpen(true);
                      }}
                    />
                  </div>
                ) : (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-zinc-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      {field.label}
                      {integration.id === 'ldap' && field.required && getConfigValue('ldap_enabled') === 'true' && (
                        <span className="text-red-400">*</span>
                      )}
                    </Label>
                    <Input 
                      type={field.type}
                      name={field.key}
                      defaultValue={getConfigValue(field.key)}
                      placeholder={field.placeholder}
                      disabled={integration.id === 'ldap' && getConfigValue('ldap_enabled') !== 'true'}
                      className={cn(
                        "text-sm h-9",
                        integration.id === 'ldap' && getConfigValue('ldap_enabled') !== 'true'
                          ? "bg-zinc-950/50 border-zinc-900/50 text-zinc-600 cursor-not-allowed"
                          : "bg-zinc-950 focus:border-emerald-500/30",
                        integration.id === 'ldap' && hasFieldError(field.key, document.querySelector<HTMLInputElement>(`input[name="${field.key}"]`)?.value || getConfigValue(field.key), getFieldValidator(field.key))
                          ? "border-red-500/50"
                          : "border-zinc-900"
                      )}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (integration.id === 'ldap') {
                          markTouched(field.key);
                          setLdapTestPassed(false);
                          
                          if (val !== getConfigValue(field.key)) {
                            setPendingChange({
                              configKey: field.key,
                              configValue: val,
                              description: `Update ${field.label}`
                            });
                            setIsSecurityModalOpen(true);
                          }
                        } else {
                          if (val !== getConfigValue(field.key)) {
                            setPendingChange({
                              configKey: field.key,
                              configValue: val,
                              description: `Update ${field.label}`
                            });
                            setIsSecurityModalOpen(true);
                          }
                        }
                      }}
                    />
                    {integration.id === 'ldap' && touchedFields[field.key] && getFormatError(field.key, document.querySelector<HTMLInputElement>(`input[name="${field.key}"]`)?.value || getConfigValue(field.key)) && (
                      <p className="text-[9px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {getFormatError(field.key, document.querySelector<HTMLInputElement>(`input[name="${field.key}"]`)?.value || getConfigValue(field.key))}
                      </p>
                    )}
                  </div>
                )
              ))}
            </CardContent>
            <CardFooter className="pt-4 border-t border-zinc-900">
              {integration.id === "ldap" ? (
                <div className="w-full space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "w-full gap-2 transition-all",
                      ldapTestPassed
                        ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15"
                        : "text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                    )}
                    onClick={handleTestLdap}
                    disabled={testingLdap || getConfigValue('ldap_enabled') !== 'true' || !isLdapRequiredFieldsValid()}
                  >
                    {testingLdap ? <Loader2 className="w-4 h-4 animate-spin" /> : ldapTestPassed ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    {testingLdap ? "Testing Connection..." : ldapTestPassed ? "Connection Verified ✓" : "Test Connection"}
                  </Button>
                  {getConfigValue('ldap_enabled') !== 'true' && (
                    <p className="text-[10px] text-zinc-600 text-center">Enable LDAP integration to test connectivity</p>
                  )}
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/5 gap-2"
                  disabled={integration.status === "Coming Soon"}
                >
                  <Settings2 className="w-4 h-4" />
                  Manage Settings
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="bg-emerald-500/5 border-emerald-500/10">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-500">Need a custom integration?</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Our enterprise plans support custom webhooks and dedicated poller instances. Contact your account manager for more details.
            </p>
          </div>
        </CardContent>
      </Card>
      <SecurityChallengeModal 
        open={isSecurityModalOpen}
        onOpenChange={setIsSecurityModalOpen}
        onSuccess={() => {
          if (pendingChange) {
            updateMutation.mutate(pendingChange);
            setPendingChange(null);
          }
        }}
        description="Password verification required to update integration settings."
      />
    </div>
  );
}
