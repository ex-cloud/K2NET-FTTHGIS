"use client";

import { LoginForm } from "@/components/auth/login-form";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#09090b]">
      {/* Premium Dark Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-zinc-900 via-[#09090b] to-black" />

      {/* Subtle Admin Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3f3f46 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Admin Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-2xl bg-zinc-950/50 border border-zinc-800 rounded-3xl shadow-2xl p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl mb-6">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Admin Console
            </h1>
            <p className="text-zinc-400 text-sm">
              Global system management and organization control.
            </p>
          </div>

          {/* Admin Login Form */}
          <LoginForm isAdmin={true} />

          {/* Security Note */}
          <div className="mt-10 pt-6 border-t border-zinc-900 text-center">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
