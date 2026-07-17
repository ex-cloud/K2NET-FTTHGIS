"use client";

import { RefreshCw, Shield, UserCheck, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function UserFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentRole = searchParams.get("role") || "all";
  const currentStatus = searchParams.get("status") || "all";
  const currentOrg = searchParams.get("org") || "";

  const [orgInput, setOrgInput] = useState(currentOrg);

  useEffect(() => {
    setOrgInput(currentOrg);
  }, [currentOrg]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "0");
    replace(`${pathname}?${params.toString()}`);
  };

  const handleOrgSearch = () => {
    updateParam("org", orgInput);
  };

  const clearAll = () => {
    replace(pathname);
  };

  const roles = [
    { id: "all", label: "All Roles" },
    { id: "super_admin", label: "Super Admin" },
    { id: "admin", label: "Tenant Admin" },
    { id: "technician", label: "Technician" },
    { id: "viewer", label: "Viewer" },
  ];

  const statuses = [
    { id: "all", label: "All Statuses" },
    { id: "ACTIVE", label: "Active" },
    { id: "SUSPENDED", label: "Suspended" },
  ];

  return (
    <aside className="hidden xl:flex w-80 flex-col border-l border-border/40 bg-background/50 backdrop-blur shrink-0 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Advanced Filters
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={clearAll}
              title="Reset filters"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Organization Filter */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-primary" /> Organization Name / Slug
            </Label>
            <div className="flex gap-2">
              <Input
                value={orgInput}
                onChange={(e) => setOrgInput(e.target.value)}
                placeholder="e.g. telkom, indosat..."
                className="bg-muted/40 border-border/40 text-xs h-9"
                onKeyDown={(e) => e.key === "Enter" && handleOrgSearch()}
              />
              <Button 
                onClick={handleOrgSearch}
                size="sm"
                className="h-9 bg-primary hover:bg-primary/90 text-white text-xs px-3"
              >
                Apply
              </Button>
            </div>
            {currentOrg && (
              <div className="flex items-center justify-between p-1.5 px-2 bg-primary/10 border border-primary/20 rounded text-[11px] text-primary">
                <span>Active: <strong>{currentOrg}</strong></span>
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => updateParam("org", "all")} />
              </div>
            )}
          </div>

          {/* Global Role */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-primary" /> Global Role
            </Label>
            <div className="grid grid-cols-1 gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => updateParam("role", r.id)}
                  className={cn(
                    "p-2 text-left rounded text-xs font-medium transition-all flex items-center justify-between border",
                    currentRole === r.id
                      ? "bg-primary/10 border-emerald-500 text-primary font-bold"
                      : "bg-muted/20 border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <span>{r.label}</span>
                  {currentRole === r.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <UserCheck className="w-3 h-3 text-primary" /> Account Status
            </Label>
            <Select value={currentStatus} onValueChange={(val) => updateParam("status", val)}>
              <SelectTrigger className="w-full bg-muted/40 border-border/40 text-xs h-9">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>
    </aside>
  );
}
