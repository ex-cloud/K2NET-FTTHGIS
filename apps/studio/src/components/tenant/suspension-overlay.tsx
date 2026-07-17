"use client";

import React from "react";
import { useUIStore } from "@/store/ui-store";
import { ShieldAlert, Check, ExternalLink } from "lucide-react";
import { Button } from "@k2net/ui";
import { useParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@k2net/ui";

export function SuspensionOverlay() {
  const { organizationSuspended } = useUIStore();
  const params = useParams();
  const orgSlug = params.orgId as string;

  if (!organizationSuspended) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl p-4 max-w-[340px]">
        
        {/* Top: Icon + Text */}
        <div className="flex items-start gap-3">
          <div className="relative mt-0.5 shrink-0">
            <div className="absolute inset-0 animate-ping rounded-md bg-amber-500/20 duration-2000" />
            <div className="relative size-5 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <ShieldAlert className="size-3 text-amber-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-white leading-none mt-0.5">Account Suspended</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Your 7-day free trial has expired. To maintain access to your network data, please upgrade your plan.
            </p>
          </div>
        </div>

        {/* Bottom Right: Buttons */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button 
            size="sm"
            variant="outline" 
            className="h-7 border-none bg-[#1c1c1c] hover:bg-zinc-800 text-zinc-300 rounded-md text-[11px] px-3 shadow-none transition-colors"
            onClick={() => window.location.href = `/org/${orgSlug || ''}/settings/billing`}
          >
            Review Details
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                size="sm"
                className="h-7 bg-[#24b47e] hover:bg-[#20a070] text-white font-medium rounded-md text-[11px] px-4 shadow-none transition-colors"
              >
                Upgrade
              </Button>
            </SheetTrigger>
            <SheetContent side="right" showCloseButton={false} className="bg-[#171717] border-l border-zinc-800 w-full sm:max-w-4xl flex flex-col p-0">
              {/* Full-width Sticky Header */}
              <div className="flex items-center justify-between px-8 py-2 border-b border-zinc-800/60 shrink-0 space-y-1">
                <SheetTitle className="text-sm font-semibold text-white m-0">Change subscription plan for {orgSlug || 'your organization'}</SheetTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md flex items-center gap-1.5 m-0">
                  <ExternalLink className="size-3" /> Pricing
                </Button>
              </div>
              
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                {/* Plans Grid - 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  
                  {/* FREE PLAN */}
                  <div className="rounded-xl border border-zinc-800 bg-transparent p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-bold text-primary">FREE</h3>
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">Current plan</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-xl font-bold text-white">$0.00</span>
                      <span className="text-zinc-500 text-xs"> / month</span>
                    </div>
                    <div className="w-full h-9 mb-5 rounded-md bg-[#2a2a2a] text-zinc-400 text-xs flex items-center justify-center font-medium cursor-not-allowed">
                      Current plan
                    </div>
                    
                    <div className="space-y-3 mt-2">
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> Unlimited API requests</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> 50,000 monthly active users</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> <span className="leading-relaxed">500 MB database size<br/><span className="text-zinc-500 text-[10px]">Shared CPU • 500 MB RAM</span></span></div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> 5 GB egress</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> 5 GB cached egress</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> 1 GB file storage</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> Community support</div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-zinc-800 text-[10px] text-zinc-500 leading-relaxed">
                      Free projects are paused after 1 week of inactivity. Limit of 2 active projects.
                    </div>
                  </div>

                  {/* PRO PLAN */}
                  <div className="rounded-xl border border-primary/30 bg-transparent p-5 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
                    <div className="flex items-center gap-2 mb-2 mt-1">
                      <h3 className="text-sm font-bold text-primary">PRO</h3>
                      <span className="text-[10px] font-medium text-primary">Most Popular</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-zinc-400 text-xs mr-1">From</span>
                      <span className="text-xl font-bold text-white">$25.00</span>
                      <span className="text-zinc-500 text-xs"> / month</span>
                    </div>
                    <button 
                      className="w-full h-9 mb-5 rounded-md bg-[#24b47e] hover:bg-[#20a070] text-white text-xs font-semibold transition-colors"
                      onClick={() => window.location.href = `/org/${orgSlug || ''}/settings/billing`}
                    >
                      Upgrade to Pro
                    </button>
                    
                    <div className="space-y-3 mt-2">
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> <span className="leading-relaxed">100,000 monthly active users<br/><span className="text-zinc-500 text-[10px]">then $0.00325 per MAU</span></span></div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> <span className="leading-relaxed">8 GB disk size per project<br/><span className="text-zinc-500 text-[10px]">then $0.125 per GB</span></span></div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> <span className="leading-relaxed">250 GB egress<br/><span className="text-zinc-500 text-[10px]">then $0.09 per GB</span></span></div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> <span className="leading-relaxed">250 GB cached egress<br/><span className="text-zinc-500 text-[10px]">then $0.03 per GB</span></span></div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> <span className="leading-relaxed">100 GB file storage<br/><span className="text-zinc-500 text-[10px]">then $0.021 per GB</span></span></div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> Email support</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> Daily backups stored for 7 days</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> 7-day log retention</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> <span className="leading-relaxed">Add Log Drains<br/><span className="text-zinc-500 text-[10px]">additional $60 per drain, per project</span></span></div>
                    </div>
                  </div>

                  {/* TEAM PLAN */}
                  <div className="rounded-xl border border-zinc-800 bg-transparent p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-2 mt-1">
                      <h3 className="text-sm font-bold text-zinc-300">TEAM</h3>
                    </div>
                    <div className="mb-4">
                      <span className="text-zinc-400 text-xs mr-1">From</span>
                      <span className="text-xl font-bold text-white">$599.00</span>
                      <span className="text-zinc-500 text-xs"> / month</span>
                    </div>
                    <button 
                      className="w-full h-9 mb-5 rounded-md bg-[#24b47e] hover:bg-[#20a070] text-white text-xs font-semibold transition-colors"
                      onClick={() => window.location.href = `/org/${orgSlug || ''}/settings/billing`}
                    >
                      Upgrade to Team
                    </button>
                    
                    <div className="space-y-3 mt-2">
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> SOC2 & ISO 27001</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> Project-scoped and read-only access</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> HIPAA available as paid add-on</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> SSO for Dashboard</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> Priority email support & SLAs</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> Daily backups stored for 14 days</div>
                      <div className="flex items-start gap-2 text-[11px] text-zinc-300"><Check className="size-3.5 text-primary mt-0.5 shrink-0" /> 28-day log retention</div>
                    </div>
                  </div>

                </div>

                {/* ENTERPRISE PLAN - Full Width */}
                <div className="rounded-xl border border-zinc-800 bg-transparent p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 max-w-xs">
                    <h3 className="text-sm font-bold text-primary mb-2">ENTERPRISE</h3>
                    <p className="text-xs font-medium text-white mb-4 leading-relaxed">
                      For large-scale applications running Internet scale workloads.
                    </p>
                    <button className="px-5 py-2 rounded-md border-none bg-[#2e2e2e] hover:bg-[#3e3e3e] text-white text-xs font-medium transition-colors">
                      Contact Us
                    </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-white"><Check className="size-3.5 text-primary shrink-0" /> Designated Support manager</div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-white"><Check className="size-3.5 text-primary shrink-0" /> Uptime SLAs</div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-white"><Check className="size-3.5 text-primary shrink-0" /> BYO Cloud supported</div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-white"><Check className="size-3.5 text-primary shrink-0" /> 24x7x365 premium enterprise support</div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-white"><Check className="size-3.5 text-primary shrink-0" /> Private Slack channel</div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-white"><Check className="size-3.5 text-primary shrink-0" /> Custom Security Questionnaires</div>
                  </div>
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
