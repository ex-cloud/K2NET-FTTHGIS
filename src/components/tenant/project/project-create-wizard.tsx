"use client";

import * as React from "react";
import { 
  Briefcase,
  Check, 
  ChevronRight, 
  ArrowLeft, 
  Zap,
  Loader2,
  AlertCircle,
  Layout,
  Server
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProjectCreateWizard({ open, onOpenChange, onSuccess }: WizardProps) {
  const { data: session } = useSession();
  const params = useParams();
  const orgId = params.orgId as string;
  
  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    description: "",
    region: "AWS | ap-southeast-1",
    status: "ACTIVE"
  });

  // Auto-generate code from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, name, code: prev.code === "" || prev.code === code.slice(0, -1) ? code : prev.code }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.code)) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!session?.accessToken || !orgId) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      const baseUrl = getBackendBaseUrl();
      await axios.post(`${baseUrl}/organizations/${orgId}/projects`, formData, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      
      toast.success("Project created successfully!");
      onSuccess();
      onOpenChange(false);
      // Reset
      setStep(1);
      setFormData({ name: "", code: "", description: "", region: "AWS | ap-southeast-1", status: "ACTIVE" });
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to create project.");
      } else {
        setError("An unexpected error occurred.");
      }
      toast.error("Failed to create project.");
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
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Step {step} of 3</span>
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight">
            {step === 1 && "New Network Project"}
            {step === 2 && "Infrastructure Details"}
            {step === 3 && "Review & Initialize"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            {step === 1 && "Define the scope and name for your project."}
            {step === 2 && "Configure the deployment region and notes."}
            {step === 3 && "Final check before building your project area."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="size-3" /> Project Name
                </label>
                <Input 
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. FTTH GIS BANDUNG" 
                  className="bg-[#141414] border-[#2a2a2a] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Layout className="size-3" /> Project Code
                </label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. BDG-01" 
                  className="bg-[#141414] border-[#2a2a2a] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm h-10"
                />
                <p className="text-[10px] text-zinc-500 uppercase tracking-tight">Used as prefix for assets (ODC, ODP, etc.)</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Server className="size-3" /> Deployment Region
                </label>
                <Select
                   defaultValue={formData.region}
                   onValueChange={(val: string) => setFormData(prev => ({ ...prev, region: val }))}
                >
                  <SelectTrigger className="bg-[#141414] border-[#2a2a2a] h-10 text-sm focus:ring-emerald-500/20 focus:border-emerald-500/50">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c0c0c] border-[#1f1f1f] text-zinc-100">
                    <SelectItem value="AWS | ap-southeast-1">AWS | ap-southeast-1 (Singapore)</SelectItem>
                    <SelectItem value="AWS | us-east-1">AWS | us-east-1 (N. Virginia)</SelectItem>
                    <SelectItem value="GCP | asia-southeast1">GCP | asia-southeast1 (Jakarta)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-zinc-500 italic">Multi-region support coming soon for Enterprise customers.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  Project Description
                </label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief overview of the coverage area..." 
                  className="bg-[#141414] border-[#2a2a2a] text-sm min-h-[100px] resize-none focus:border-emerald-500/50 focus:ring-0"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in zoom-in-95 duration-300">
              <div className="rounded-lg bg-[#141414] border border-[#1f1f1f] p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-[#1f1f1f] pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">Project Blueprint</span>
                  <Check className="size-3 text-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <p className="text-zinc-500 mb-0.5">Name</p>
                    <p className="font-medium text-zinc-200">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-0.5">Code</p>
                    <p className="font-medium font-mono text-emerald-400">{formData.code}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-zinc-500 mb-0.5">Infrastructure</p>
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase">
                      {formData.region}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-zinc-300">
                <Zap className="size-5 text-emerald-500 shrink-0" />
                <p>Clicking build will initialize the GIS map layers and database for this project.</p>
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
            
            {step < 3 ? (
              <Button 
                onClick={nextStep}
                disabled={!formData.name || !formData.code}
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
                    <Loader2 className="size-4 mr-2 animate-spin" /> Initializing...
                  </>
                ) : (
                  "Build Project"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
