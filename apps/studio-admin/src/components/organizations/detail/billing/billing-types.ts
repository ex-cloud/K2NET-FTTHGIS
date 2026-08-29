import type { EnrichedOrganization } from "@/components/organizations/types";
import type {
  SubscriptionSummary,
  SubscriptionPlanInfo,
  ProrationEstimate,
} from "@/lib/actions/gateways/subscription";

export interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  status: "PAID" | "PENDING";
  paymentMethod: string;
}

export interface OrgBillingTabProps {
  organization: EnrichedOrganization;
  onOpenPlanUpgrade?: () => void;
}

export type {
  SubscriptionSummary,
  SubscriptionPlanInfo,
  ProrationEstimate,
};
