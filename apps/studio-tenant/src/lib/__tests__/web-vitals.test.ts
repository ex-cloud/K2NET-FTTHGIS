import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initWebVitals, type MetricReport } from "../web-vitals";

describe("Tenant Web Vitals Monitor", () => {
  let mockReports: MetricReport[] = [];

  beforeEach(() => {
    mockReports = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize safely in browser environment", () => {
    expect(() => {
      initWebVitals((metric) => {
        mockReports.push(metric);
      });
    }).not.toThrow();
  });

  it("should handle missing PerformanceObserver gracefully", () => {
    const originalPO = window.PerformanceObserver;
    // @ts-expect-error - simulating browser without PerformanceObserver
    delete window.PerformanceObserver;

    expect(() => {
      initWebVitals((metric) => {
        mockReports.push(metric);
      });
    }).not.toThrow();

    window.PerformanceObserver = originalPO;
  });
});
