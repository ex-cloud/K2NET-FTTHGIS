"use client";

import * as React from "react";
// Removed unused imports
import { 
  CreditCard, 
  Check, 
  Zap, 
  ShieldCheck, 
  Gem, 
  ArrowRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {

  const plans = [
    {
      name: "FREE",
      price: "$0",
      description: "Perfect for small teams and hobbyists.",
      features: ["Up to 2 Projects", "50 ODC Units", "500 ODP Points", "Basic Support"],
      isCurrent: true,
      icon: Zap
    },
    {
      name: "PRO",
      price: "$49",
      description: "For growing organizations with multiple projects.",
      features: ["Up to 10 Projects", "200 ODC Units", "2,000 ODP Points", "Priority Email Support", "Keycloak SSO"],
      isCurrent: false,
      icon: ShieldCheck,
      popular: true
    },
    {
      name: "ENTERPRISE",
      price: "Custom",
      description: "Advanced controls and unlimited scale for big players.",
      features: ["Unlimited Projects", "Unlimited Assets", "White-label Support", "Custom SNMP Poller", "Audit Logs Export"],
      isCurrent: false,
      icon: Gem
    }
  ];

  return (
    <div className="p-8 space-y-8 w-full">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Billing & Plans
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage your subscription and feature quotas.
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-4 py-1">
          Current Plan: FREE
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {plans.map((plan) => (
          <Card key={plan.name} className={`
            bg-[#0c0c0c] border-zinc-800/50 flex flex-col relative
            ${plan.popular ? 'border-emerald-500/30 ring-1 ring-emerald-500/20' : ''}
          `}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded-full">
                MOST POPULAR
              </div>
            )}
            <CardHeader>
              <div className="p-2 w-fit rounded-lg bg-zinc-900 mb-4">
                <plan.icon className="w-5 h-5 text-emerald-500" />
              </div>
              <CardTitle className="text-zinc-100">{plan.name}</CardTitle>
              <CardDescription className="text-zinc-500">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-zinc-100">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-sm text-zinc-500">/month</span>}
              </div>
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-xs text-zinc-400">
                    <Check className="w-3 h-3 text-emerald-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              {plan.isCurrent ? (
                <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white group">
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-950/50 border-zinc-800/50 border-dashed">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">Payment History</h4>
              <p className="text-xs text-zinc-500">Download your invoices and manage payment methods.</p>
            </div>
          </div>
          <Button variant="outline" className="border-zinc-800 hover:bg-zinc-900 text-xs">
            View Invoices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
