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

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function OrganizationWizard({ open, onOpenChange, onSuccess }: WizardProps) {
  const [step, setStep] = React.useState(1);
  const { createOrganization, checkSlugAvailable } = useOrganizations();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [slugError, setSlugError] = React.useState<string | null>(null);

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
    ldapBindPassword: ""
  });

  // Auto-generate slug from name if not edited manual
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, name, slug: prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug }));
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
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createOrganization(formData);
      
      // If we got here without throwing, it's successful
      // result is the saved organization object
      toast.success("Organization deployed successfully!", {
        description: `${formData.name} is now ready to use.`,
      });
      
      onSuccess();
      onOpenChange(false);
      
      // Reset wizard
      setStep(1);
      setFormData({ 
        name: "", slug: "", description: "", website: "", address: "", plan: "FREE",
        ldapEnabled: false, ldapUrl: "", ldapBaseDn: "", ldapBindDn: "", ldapBindPassword: ""
      });
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
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Step {step} of 4</span>
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight">
            {step === 1 && "Start your journey"}
            {step === 2 && "Configure settings"}
            {step === 3 && "LDAP Integration"}
            {step === 4 && "Review & Deploy"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            {step === 1 && "Give your organization a solid identity."}
            {step === 2 && "Set up how your organization operates."}
            {step === 3 && "Connect your existing identity provider."}
            {step === 4 && "Quick double check before we go live."}
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
                  className="bg-[#141414] border-[#2a2a2a] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm h-10"
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
                    className="bg-[#141414] border-[#2a2a2a] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm h-10 pl-[62px]"
                  />
                </div>
                {slugError && <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="size-3" /> {slugError}</p>}
                <p className="text-[10px] text-zinc-500">Slug must be unique and used in your dashboard URL.</p>
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
                  <Zap className={cn("size-4", formData.plan === "FREE" ? "text-emerald-500" : "text-zinc-500")} />
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
                  formData.ldapEnabled ? "bg-emerald-500/10 border-emerald-500" : "bg-muted/10 border-[#1f1f1f]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center",
                    formData.ldapEnabled ? "bg-emerald-500/20 text-emerald-500" : "bg-zinc-800 text-zinc-500"
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
                      <Server className="size-3" /> LDAP Server URL
                    </label>
                    <Input 
                      value={formData.ldapUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, ldapUrl: e.target.value }))}
                      placeholder="ldap://your-server:389" 
                      className="bg-[#141414] border-[#2a2a2a] text-xs h-9"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                        <Users className="size-3" /> Base DN
                      </label>
                      <Input 
                        value={formData.ldapBaseDn}
                        onChange={(e) => setFormData(prev => ({ ...prev, ldapBaseDn: e.target.value }))}
                        placeholder="ou=users,dc=com" 
                        className="bg-[#141414] border-[#2a2a2a] text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                        <Key className="size-3" /> Bind DN
                      </label>
                      <Input 
                        value={formData.ldapBindDn}
                        onChange={(e) => setFormData(prev => ({ ...prev, ldapBindDn: e.target.value }))}
                        placeholder="cn=admin,dc=com" 
                        className="bg-[#141414] border-[#2a2a2a] text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                      <Lock className="size-3" /> Bind Password
                    </label>
                    <Input 
                      type="password"
                      value={formData.ldapBindPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, ldapBindPassword: e.target.value }))}
                      placeholder="••••••••" 
                      className="bg-[#141414] border-[#2a2a2a] text-xs h-9"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in zoom-in-95 duration-300">
              <div className="rounded-lg bg-[#141414] border border-[#1f1f1f] p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-[#1f1f1f] pb-2">
                  <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Review Configuration</span>
                  <Check className="size-3 text-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <p className="text-zinc-500 mb-0.5">Name</p>
                    <p className="font-medium">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Slug</p>
                    <p className="font-medium font-mono text-emerald-400">/{formData.slug}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">LDAP Status</p>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      formData.ldapEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {formData.ldapEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Plan</p>
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase">
                      {formData.plan} PLAN
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-zinc-300">
                <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
                <p>Infrastructure deployment will start immediately after confirmation.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#111111] border-t border-[#1f1f1f] flex items-center justify-between">
          {step > 1 ? (
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
                disabled={!formData.name || !formData.slug}
                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[100px] h-9 shadow-lg shadow-emerald-900/10"
              >
                Continue <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px] h-9 shadow-lg shadow-emerald-900/10"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
