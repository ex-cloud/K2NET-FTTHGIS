"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { Users, Plus, Search, Shield, Building2, Briefcase, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamInviteWizard } from "@/components/team/team-invite-wizard";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  username: string;
  roleDisplayName: string;
  roleName: string;
  status: string;
  avatarUrl?: string;
  projectRoles?: {
    projectId: string;
    projectName: string;
    roleName: string;
    roleDisplayName: string;
  }[];
}

export default function OrganizationTeamPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { data: session } = useSession();
  const params = useParams();
  const orgId = params.orgId as string;
  
  const [members, setMembers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = React.useCallback(async () => {
    if (!session?.accessToken || !orgId) return;
    
    setIsLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await axios.get(`${baseUrl}/organizations/${orgId}/users`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      // Handle Spring Data Page structure
      setMembers(res.data?.content || res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load organization members");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, orgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div className="flex-1 w-full bg-transparent overflow-auto custom-scrollbar">
      <div className="flex flex-col gap-6 px-6 py-6 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex aspect-square h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-sm">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Organization Team
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage all members, divisions, and cross-project assignments across your Organization.
              </p>
            </div>
          </div>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            onClick={() => setIsWizardOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </Button>
        </div>

        <TeamInviteWizard 
          isOpen={isWizardOpen} 
          onClose={() => {
            setIsWizardOpen(false);
            fetchMembers(); // Refresh the list after an invite
          }} 
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border border-border rounded-xl bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Members</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{members.length}</p>
          </div>
          <div className="p-4 border border-border rounded-xl bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Divisions</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">1</p>
          </div>
          <div className="p-4 border border-border rounded-xl bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Projects</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {[...new Set(members.flatMap(m => m.projectRoles?.map(p => p.projectId) || []))].length}
            </p>
          </div>
          <div className="p-4 border border-border rounded-xl bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admins</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{members.filter(m => m.roleName?.includes("admin")).length}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 py-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search members by name, email, or role..." 
              className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      Loading team members...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No members found in this organization.
                    </td>
                  </tr>
                ) : members.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-bold text-sm">
                            {member.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{member.fullName || member.username}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                          {member.roleDisplayName || member.roleName}
                        </span>
                        {member.projectRoles && member.projectRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {member.projectRoles.map((pr, idx) => (
                              <span key={idx} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                                {pr.projectName}: <span className="text-foreground font-medium">{pr.roleDisplayName || pr.roleName}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        member.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Edit Access
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
