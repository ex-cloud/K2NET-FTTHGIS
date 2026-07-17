"use client";

import * as React from "react";
import { 
  Building2, 
  Globe, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck, 
  Zap,
  Loader2,
  AlertCircle,
  Server,
  Key,
  Users,
  Lock,
  Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useOrganizations } from "@/hooks/useOrganizations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function OrganizationWizard({ open, onOpenChange, onSuccess }: WizardProps) {
  const [step, setStep] = React.useState(1);
  const { createOrganization, checkSlugAvailable, organizations } = useOrganizations();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [testingLdap, setTestingLdap] = React.useState(false);
  const [ldapTestPassed, setLdapTestPassed] = React.useState(false);
  const [slugError, setSlugError] = React.useState<string | null>(null);
  const [deployedData, setDeployedData] = React.useState<{ slug: string, adminPassword?: string, adminUsername?: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    description: "",
    website: "",
    address: "",
    plan: "FREE",
    // LDAP Configuration
    ldapEnabled: false,
    ldapUrl: "",
    ldapBaseDn: "",
    ldapBindDn: "",
    ldapBindPassword: "",
    // Admin Account Provisioning
    adminEmail: "",
    adminUsername: ""
  });

  // Auto-generate slug from name if not edited manual
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, name, slug: prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug }));
  };

  // Track which LDAP fields the user has interacted with
  const [touchedFields, setTouchedFields] = React.useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  // Format validators
  const isValidLdapUrl = (url: string) => !url.trim() || /^ldaps?:\/\/.+/i.test(url.trim());
  const isValidDn = (dn: string) => !dn.trim() || dn.includes('=');

  // Helper: check if all LDAP fields are filled
  const isLdapFormComplete = formData.ldapUrl.trim() !== "" && formData.ldapBaseDn.trim() !== "" && formData.ldapBindDn.trim() !== "" && formData.ldapBindPassword.trim() !== "";

  // Helper: check if all formats are valid
  const isLdapFormatValid = isValidLdapUrl(formData.ldapUrl) && isValidDn(formData.ldapBaseDn) && isValidDn(formData.ldapBindDn);

  // Helper: determine if a specific field should show error
  const hasFieldError = (field: string, value: string, validator?: (v: string) => boolean) => {
    if (!touchedFields[field]) return false;
    if (!value.trim()) return true; // empty after touch
    if (validator && !validator(value)) return true; // format error
    return false;
  };

  // Helper: update LDAP field and reset test status
  const updateLdapField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setLdapTestPassed(false); // Any change invalidates previous test
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.name || !formData.slug) return;
      
      const isAvailable = await checkSlugAvailable(formData.slug);
      if (!isAvailable) {
        setSlugError("Slug ini sudah dipakai organisasi lain, Bro. Cari yang lain ya!");
        return;
      }
      setSlugError(null);
    }
    if (step === 3 && formData.ldapEnabled && !ldapTestPassed) {
      toast.error("Please test your LDAP connection first before continuing.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createOrganization(formData);
      
      // Store result to show in success screen
      setDeployedData({
        slug: result.slug,
        adminPassword: result.adminPassword,
        adminUsername: formData.adminUsername || formData.adminEmail
      });

      toast.success("Organization deployed successfully!", {
        description: `${formData.name} is now ready to use.`,
      });
      
      // Move to success view (we'll treat step 5 as success)
      setStep(5);
      
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Gagal membuat organisasi.";
      console.error("Failed to create organization:", err);
      setSlugError(errorMessage);
      toast.error("Deployment failed", {
        description: errorMessage || "Please check your configuration and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const closeWizard = () => {
    onOpenChange(false);
    // Reset wizard after a short delay to avoid flickering
    setTimeout(() => {
      setStep(1);
      setDeployedData(null);
      setFormData({ 
        name: "", slug: "", description: "", website: "", address: "", plan: "FREE",
        ldapEnabled: false, ldapUrl: "", ldapBaseDn: "", ldapBindDn: "", ldapBindPassword: "",
        adminEmail: "", adminUsername: ""
      });
      setLdapTestPassed(false);
    }, 300);
  };

  const handleTestLdap = async () => {
    setTestingLdap(true);
    try {
      const payload = {
        ldap_url: formData.ldapUrl,
        ldap_bind_dn: formData.ldapBindDn,
        ldap_bind_password: formData.ldapBindPassword,
      };
      
      const res = await fetch(`/api/v1/organizations/${formData.slug || 'temp'}/configs/test-ldap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The fetch will automatically include the session cookie for auth
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

  const user = session?.user;
  const userRoles = user?.roles || [];
  const issuer = (session as { issuer?: string })?.issuer || "";
  const isSuperAdmin = 
    issuer.includes("ftth-realm") || 
    issuer.includes("/system") || 
    userRoles.includes("super_admin") || 
    userRoles.includes("ROLE_SUPER_ADMIN");

  const hasFreePlan = organizations.some(org => org.subscriptionPlan?.name?.toUpperCase() === "FREE");
  const isLimitReached = !isSuperAdmin && hasFreePlan;

  if (isLimitReached) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px] bg-[#0c0c0c] border-[#1f1f1f] text-zinc-100 p-6 outline-none">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="size-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-2">
              <Zap className="size-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Upgrade to Create More</h3>
            <p className="text-zinc-400 text-sm max-w-sm">
              Your active tenant is on the <strong className="text-amber-500 font-medium">FREE</strong> plan, which is limited to 1 organization. 
              Please upgrade your plan to unlock unlimited organizations and premium features.
            </p>
            <div className="flex items-center gap-3 w-full pt-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-transparent border-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer h-9 text-xs"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  window.location.assign("/org");
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold cursor-pointer h-9 text-xs"
              >
                Manage Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0c0c0c] border-[#1f1f1f] text-zinc-100 p-0 overflow-hidden outline-none">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#1f1f1f]">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-in-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 text-primary mb-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Step {step} of 4</span>
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight">
            {step === 1 && "Start your journey"}
            {step === 2 && "Configure settings"}
            {step === 3 && "LDAP Integration"}
            {step === 4 && "Review & Deploy"}
            {step === 5 && "Deployment Success!"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            {step === 1 && "Give your organization a solid identity."}
            {step === 2 && "Set up how your organization operates."}
            {step === 3 && "Connect your existing identity provider."}
            {step === 4 && "Quick double check before we go live."}
            {step === 5 && "Your infrastructure is ready. Save your credentials!"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="size-3" /> Organization Name
                </label>
                <Input 
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Acme Corporation" 
                  className="bg-[#141414] border-[#2a2a2a] focus:border-primary/50 focus:ring-primary/20 text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="size-3" /> Organization Slug
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">gis.com/</span>
                  <Input 
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="bg-[#141414] border-[#2a2a2a] focus:border-primary/50 focus:ring-primary/20 text-sm h-10 pl-[62px]"
                  />
                </div>
                {slugError && <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="size-3" /> {slugError}</p>}
                <p className="text-[10px] text-zinc-500">Slug must be unique and used in your dashboard URL.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Admin Email <span className="text-red-500">*</span></label>
                  <Input 
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                    placeholder="boss@company.com" 
                    className="bg-[#141414] border-[#2a2a2a] text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Admin Username</label>
                  <Input 
                    value={formData.adminUsername}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminUsername: e.target.value }))}
                    placeholder="Leave blank for email" 
                    className="bg-[#141414] border-[#2a2a2a] text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Website</label>
                  <Input 
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://" 
                    className="bg-[#141414] border-[#2a2a2a] text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Office Location</label>
                  <Input 
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="City, Country" 
                    className="bg-[#141414] border-[#2a2a2a] text-xs h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  Description
                </label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us about your organization..." 
                  className="bg-[#141414] border-[#2a2a2a] text-sm min-h-[100px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, plan: "FREE" }))}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all space-y-2",
                    formData.plan === "FREE" ? "bg-emerald-500/5 border-emerald-500" : "bg-muted/10 border-[#1f1f1f] grayscale"
                  )}
                >
                  <Zap className={cn("size-4", formData.plan === "FREE" ? "text-primary" : "text-zinc-500")} />
                  <div>
                    <p className="text-xs font-bold">Free Plan</p>
                    <p className="text-[10px] text-zinc-500">Perfect for exploration.</p>
                  </div>
                </div>
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, plan: "PRO" }))}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all space-y-2 opacity-60",
                    formData.plan === "PRO" ? "bg-emerald-500/5 border-emerald-500" : "bg-muted/10 border-[#1f1f1f]"
                  )}
                >
                  <ShieldCheck className="size-4 text-zinc-500" />
                  <div>
                    <p className="text-xs font-bold font-mono">Enterprise</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div 
                onClick={() => setFormData(prev => ({ ...prev, ldapEnabled: !prev.ldapEnabled }))}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between",
                  formData.ldapEnabled ? "bg-primary/10 border-emerald-500" : "bg-muted/10 border-[#1f1f1f]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center",
                    formData.ldapEnabled ? "bg-emerald-500/20 text-primary" : "bg-zinc-800 text-zinc-500"
                  )}>
                    <Network className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Enable LDAP User Sync</p>
                    <p className="text-[10px] text-zinc-500">Sync your enterprise users automatically.</p>
                  </div>
                </div>
                <div className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center",
                  formData.ldapEnabled ? "border-emerald-500 bg-emerald-500" : "border-zinc-700"
                )}>
                  {formData.ldapEnabled && <Check className="size-3 text-white" />}
                </div>
              </div>

              {formData.ldapEnabled && (
                <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                      <Server className="size-3" /> LDAP Server URL <span className="text-red-400">*</span>
                    </label>
                    <Input 
                      value={formData.ldapUrl}
                      onChange={(e) => updateLdapField('ldapUrl', e.target.value)}
                      onBlur={() => markTouched('ldapUrl')}
                      placeholder="ldap://your-server:389" 
                      className={cn("bg-[#141414] text-xs h-9", hasFieldError('ldapUrl', formData.ldapUrl, isValidLdapUrl) ? "border-red-500/50" : "border-[#2a2a2a]")}
                    />
                    {touchedFields['ldapUrl'] && formData.ldapUrl.trim() && !isValidLdapUrl(formData.ldapUrl) && (
                      <p className="text-[9px] text-red-400">URL must start with ldap:// or ldaps://</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                        <Users className="size-3" /> Base DN <span className="text-red-400">*</span>
                      </label>
                      <Input 
                        value={formData.ldapBaseDn}
                        onChange={(e) => updateLdapField('ldapBaseDn', e.target.value)}
                        onBlur={() => markTouched('ldapBaseDn')}
                        placeholder="dc=example,dc=com" 
                        className={cn("bg-[#141414] text-xs h-9", hasFieldError('ldapBaseDn', formData.ldapBaseDn, isValidDn) ? "border-red-500/50" : "border-[#2a2a2a]")}
                      />
                      {touchedFields['ldapBaseDn'] && formData.ldapBaseDn.trim() && !isValidDn(formData.ldapBaseDn) && (
                        <p className="text-[9px] text-red-400">Invalid DN format (must contain &apos;=&apos;)</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                        <Key className="size-3" /> Bind DN <span className="text-red-400">*</span>
                      </label>
                      <Input 
                        value={formData.ldapBindDn}
                        onChange={(e) => updateLdapField('ldapBindDn', e.target.value)}
                        onBlur={() => markTouched('ldapBindDn')}
                        placeholder="cn=admin,dc=com" 
                        className={cn("bg-[#141414] text-xs h-9", hasFieldError('ldapBindDn', formData.ldapBindDn, isValidDn) ? "border-red-500/50" : "border-[#2a2a2a]")}
                      />
                      {touchedFields['ldapBindDn'] && formData.ldapBindDn.trim() && !isValidDn(formData.ldapBindDn) && (
                        <p className="text-[9px] text-red-400">Invalid DN format (must contain &apos;=&apos;)</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                      <Lock className="size-3" /> Bind Password <span className="text-red-400">*</span>
                    </label>
                    <Input 
                      type="password"
                      value={formData.ldapBindPassword}
                      onChange={(e) => updateLdapField('ldapBindPassword', e.target.value)}
                      onBlur={() => markTouched('ldapBindPassword')}
                      placeholder="••••••••" 
                      className={cn("bg-[#141414] text-xs h-9", hasFieldError('ldapBindPassword', formData.ldapBindPassword) ? "border-red-500/50" : "border-[#2a2a2a]")}
                    />
                  </div>

                  {/* Test Connection Button */}
                  <Button 
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full mt-2 gap-2 h-9 text-xs font-semibold transition-all",
                      ldapTestPassed 
                        ? "text-primary border-emerald-500/40 bg-primary/10 hover:bg-emerald-500/15" 
                        : "text-primary border-primary/20 hover:bg-primary/10"
                    )}
                    onClick={handleTestLdap}
                    disabled={testingLdap || !isLdapFormComplete || !isLdapFormatValid}
                  >
                    {testingLdap ? <Loader2 className="size-4 animate-spin" /> : ldapTestPassed ? <Check className="size-4" /> : <Zap className="size-4" />}
                    {testingLdap ? "Testing Connection..." : ldapTestPassed ? "Connection Verified ✓" : "Test Connection"}
                  </Button>

                  {/* Validation Status */}
                  {!ldapTestPassed && isLdapFormComplete && isLdapFormatValid && (
                    <p className="text-[10px] text-amber-500/80 flex items-center gap-1">
                      <AlertCircle className="size-3" /> You must test and verify the connection before continuing.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in zoom-in-95 duration-300">
              <div className="rounded-lg bg-[#141414] border border-[#1f1f1f] p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-[#1f1f1f] pb-2">
                  <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Review Configuration</span>
                  <Check className="size-3 text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <p className="text-zinc-500 mb-0.5">Name</p>
                    <p className="font-medium">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Slug</p>
                    <p className="font-medium font-mono text-primary">/{formData.slug}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">LDAP Status</p>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      formData.ldapEnabled ? "bg-primary/10 text-primary" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {formData.ldapEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Plan</p>
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">
                      {formData.plan} PLAN
                    </span>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Admin Account</p>
                    <p className="font-medium text-primary">{formData.adminEmail}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-primary/20 text-xs text-zinc-300">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <p>Infrastructure deployment will start immediately after confirmation.</p>
              </div>
            </div>
          )}

          {step === 5 && deployedData && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500 py-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                  <Check className="size-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white">System Online</h3>
                <p className="text-zinc-500 text-sm">Infrastructure for <span className="text-primary">/{deployedData.slug}</span> has been provisioned.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-primary/20 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Admin Username</p>
                    <p className="text-sm font-mono text-zinc-200">{deployedData.adminUsername}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Initial Password</p>
                    <div className="flex items-center justify-between bg-background border border-[#1f1f1f] rounded-lg p-3">
                      <code className="text-primary font-mono text-sm">{deployedData.adminPassword}</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 size-8 p-0 text-zinc-400 hover:text-primary"
                        onClick={() => copyToClipboard(deployedData.adminPassword || "")}
                      >
                        {copied ? <Check className="size-4" /> : <Key className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-3">
                  <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-400">
                    <strong className="text-amber-500">Security Warning:</strong> This password will only be shown once. Please save it securely. You can change it later in the dashboard settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#111111] border-t border-[#1f1f1f] flex items-center justify-between">
          {step > 1 && step < 5 ? (
            <Button 
              variant="ghost" 
              onClick={prevStep}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-transparent px-0"
            >
              <ArrowLeft className="size-4 mr-2" /> Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenChange(false)}
                  className="text-zinc-500 hover:text-zinc-100"
                >
                  Cancel
                </Button>
                
                {step < 4 ? (
                  <Button 
                    onClick={nextStep}
                    disabled={
                      !formData.name || !formData.slug || !formData.adminEmail ||
                      (step === 3 && formData.ldapEnabled && !ldapTestPassed)
                    }
                    className={cn(
                      "text-white min-w-[100px] h-9 shadow-lg shadow-emerald-900/10",
                      (step === 3 && formData.ldapEnabled && !ldapTestPassed)
                        ? "bg-zinc-700 hover:bg-zinc-600 cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    Continue <ChevronRight className="size-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-white min-w-[120px] h-9 shadow-lg shadow-emerald-900/10"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" /> Provisioning...
                      </>
                    ) : (
                      "Deploy Now"
                    )}
                  </Button>
                )}
              </>
            ) : (
              <Button 
                onClick={closeWizard}
                className="bg-primary hover:bg-primary/90 text-white min-w-[150px] h-9 shadow-lg shadow-emerald-900/10"
              >
                Go to Dashboard <ChevronRight className="size-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
