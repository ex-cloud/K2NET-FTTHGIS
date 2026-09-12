/**
 * Core Web Vitals Reporter using native PerformanceObserver
 * Captures FCP (First Contentful Paint), LCP (Largest Contentful Paint),
 * CLS (Cumulative Layout Shift), and TTFB (Time to First Byte).
 */

export interface MetricReport {
  name: "FCP" | "LCP" | "CLS" | "INP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

function getRating(name: MetricReport["name"], value: number): MetricReport["rating"] {
  switch (name) {
    case "FCP":
      return value <= 1800 ? "good" : value <= 3000 ? "needs-improvement" : "poor";
    case "LCP":
      return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
    case "CLS":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
    case "INP":
      return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor";
    case "TTFB":
      return value <= 800 ? "good" : value <= 1800 ? "needs-improvement" : "poor";
  }
}

export function initWebVitals(onReport?: (metric: MetricReport) => void): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  const report = (name: MetricReport["name"], value: number) => {
    const roundedValue = name === "CLS" ? Math.round(value * 1000) / 1000 : Math.round(value);
    const metric: MetricReport = {
      name,
      value: roundedValue,
      rating: getRating(name, roundedValue),
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === "development") {
      // Helpful log for debugging performance in dev
      // eslint-disable-next-line no-console
      console.debug(`[Web-Vitals] ${metric.name}: ${metric.value} (${metric.rating})`);
    }

    if (onReport) {
      onReport(metric);
    }
  };

  // 1. TTFB (Navigation Timing)
  try {
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navEntries.length > 0 && navEntries[0]) {
      report("TTFB", navEntries[0].responseStart);
    }
  } catch {
    // Ignore if not supported
  }

  // 2. FCP (Paint Timing)
  try {
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          report("FCP", entry.startTime);
          paintObserver.disconnect();
        }
      }
    });
    paintObserver.observe({ type: "paint", buffered: true });
  } catch {
    // Observer not supported
  }

  // 3. LCP (Largest Contentful Paint)
  try {
    let largestLcp = 0;
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        largestLcp = Math.max(largestLcp, entry.startTime);
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    // Report final LCP on page visibility change or unload
    const reportLcp = () => {
      if (largestLcp > 0) {
        report("LCP", largestLcp);
      }
      lcpObserver.disconnect();
    };
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        reportLcp();
      }
    }, { once: true });
  } catch {
    // Observer not supported
  }

  // 4. CLS (Cumulative Layout Shift)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{ hadRecentInput: boolean; value: number }>) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    const reportCls = () => {
      report("CLS", clsValue);
      clsObserver.disconnect();
    };
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        reportCls();
      }
    }, { once: true });
  } catch {
    // Observer not supported
  }
}
