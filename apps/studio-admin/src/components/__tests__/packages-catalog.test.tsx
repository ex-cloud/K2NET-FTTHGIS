import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PackageKpiCards } from "@/components/packages/PackageKpiCards";
import { PackageCatalogGrid } from "@/components/packages/PackageCatalogGrid";
import { DependencyMatrixModal } from "@/components/packages/DependencyMatrixModal";
import type { PlatformPackageItem, PackageKpiOverview } from "@/hooks/usePlatformPackages";

// Mock @k2net/i18n
vi.mock("@k2net/i18n", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params && typeof params.price === "string") return `${params.price} / mo`;
      if (params && typeof params.code === "string") return `Code: ${params.code}`;
      return key;
    },
  }),
}));

const mockPackages: PlatformPackageItem[] = [
  {
    id: "pkg-1",
    packageCode: "PKG_OLT_POLLER_10",
    packageName: "OLT Poller 10 Pack",
    description: "High-speed polling for 10 OLTs",
    category: "TELEMETRY",
    billingType: "MONTHLY_RECURRING",
    priceIdr: 499500,
    minimumTier: "STARTER",
    quotaDeltaOlt: 10,
    quotaDeltaOdp: 0,
    published: true,
    prerequisiteCodes: [],
    conflictCodes: [],
  },
  {
    id: "pkg-2",
    packageCode: "PKG_AI_OTDR",
    packageName: "AI OTDR Diagnostic Copilot",
    description: "Fiber optical event diagnostic copilot",
    category: "AI_COPILOT",
    billingType: "MONTHLY_RECURRING",
    priceIdr: 799000,
    minimumTier: "PRO",
    quotaDeltaOlt: 0,
    quotaDeltaOdp: 0,
    published: false,
    prerequisiteCodes: ["PKG_OLT_POLLER_10"],
    conflictCodes: [],
  },
];

const mockOverview: PackageKpiOverview = {
  totalPackages: 12,
  publishedPackages: 8,
  draftPackages: 4,
  activeSubscriptions: 25,
  estimatedMonthlyAddonRevenue: 12500000,
  categoryDistribution: { TELEMETRY: 2, AI_COPILOT: 1 },
  topAdoptedPackages: [
    {
      packageCode: "PKG_OLT_POLLER_10",
      packageName: "OLT Poller 10 Pack",
      category: "TELEMETRY",
      activeCount: 15,
    },
  ],
};

describe("Package Management Components Unit Tests", () => {
  describe("PackageKpiCards", () => {
    it("renders overview metrics accurately", () => {
      render(<PackageKpiCards overview={mockOverview} packages={mockPackages} loading={false} />);

      expect(screen.getAllByText("12").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("25").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Rp 12.500.000")).toBeInTheDocument();
    });

    it("displays loading state when loading is true", () => {
      render(<PackageKpiCards loading={true} />);
      const loadingElements = screen.getAllByText("...");
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe("PackageCatalogGrid", () => {
    it("renders package cards with codes and names", () => {
      render(
        <PackageCatalogGrid
          packages={mockPackages}
          onSelectCategory={vi.fn()}
          onSelectStatus={vi.fn()}
          onEditPackage={vi.fn()}
          onTogglePublish={vi.fn()}
          onGrantPackage={vi.fn()}
        />
      );

      expect(screen.getByText("OLT Poller 10 Pack")).toBeInTheDocument();
      expect(screen.getByText("PKG_OLT_POLLER_10")).toBeInTheDocument();
      expect(screen.getByText("AI OTDR Diagnostic Copilot")).toBeInTheDocument();
      expect(screen.getByText("PKG_AI_OTDR")).toBeInTheDocument();
    });

    it("displays quota boost delta when present", () => {
      render(
        <PackageCatalogGrid
          packages={mockPackages}
          onSelectCategory={vi.fn()}
          onSelectStatus={vi.fn()}
          onEditPackage={vi.fn()}
          onTogglePublish={vi.fn()}
          onGrantPackage={vi.fn()}
        />
      );

      expect(screen.getByText("+10 OLT")).toBeInTheDocument();
    });
  });

  describe("DependencyMatrixModal", () => {
    it("renders 3-layer compatibility table with canonical tiers", () => {
      render(
        <DependencyMatrixModal
          open={true}
          onOpenChange={vi.fn()}
          packages={mockPackages}
        />
      );

      expect(screen.getByText("packages.rules.title")).toBeInTheDocument();
      expect(screen.getByText("STARTER")).toBeInTheDocument();
      expect(screen.getByText("PRO")).toBeInTheDocument();
      // Verifies no deprecated COMMUNITY tier is present
      expect(screen.queryByText("COMMUNITY")).not.toBeInTheDocument();
    });
  });
});
