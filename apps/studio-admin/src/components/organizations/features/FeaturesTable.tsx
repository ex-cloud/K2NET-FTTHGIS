import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { Search } from "lucide-react";
import type { EnrichedOrganization } from "../types";
import type { FeatureFlagKey } from "./types";
import { FeaturesTableRow } from "./FeaturesTableRow";

interface FeaturesTableProps {
  organizations: EnrichedOrganization[];
  filteredOrgs: EnrichedOrganization[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  planFilter: string;
  setPlanFilter: (plan: string) => void;
  onNavigateDetail: (slug: string) => void;
  onToggleFlag: (slug: string, orgName: string, flagKey: FeatureFlagKey) => void;
  onCopy: (text: string, label: string) => void;
}

export function FeaturesTable({
  organizations,
  filteredOrgs,
  searchQuery,
  setSearchQuery,
  planFilter,
  setPlanFilter,
  onNavigateDetail,
  onToggleFlag,
  onCopy,
}: FeaturesTableProps) {
  return (
    <div className="flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden">
      <div className="flex-1 min-h-0 border border-border bg-card/30 rounded-xl overflow-hidden flex flex-col shadow-xs">
        {/* Filter Toolbar */}
        <div className="p-3 px-6 border-b border-border/60 bg-background/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by tenant name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-card border-border text-foreground"
              />
            </div>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs bg-card border-border text-foreground">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground text-xs">
                <SelectItem value="ALL">All Plans</SelectItem>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Showing <strong className="text-foreground">{filteredOrgs.length}</strong> of {organizations.length} organizations
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6 min-w-[200px]">
                  Organization
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[130px]">
                  Plan Tier
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[130px]">
                  GIS Core
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[140px]">
                  OLT Poller
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[150px]">
                  WhatsApp Engine
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[140px]">
                  AI Copilot
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center w-[130px]">
                  Sandbox Mode
                </TableHead>
                <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">
                  Detail
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-muted-foreground text-xs font-mono">
                    No organizations matching your search filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrgs.map((org) => (
                  <FeaturesTableRow
                    key={org.id}
                    org={org}
                    onNavigateDetail={(slug) => onNavigateDetail(slug)}
                    onToggleFlag={onToggleFlag}
                    onCopy={onCopy}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
