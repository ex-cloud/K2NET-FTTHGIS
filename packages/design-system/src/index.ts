export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: "#10b981",       // Neon Green
      primaryHover: "#059669",  // Green Hover
      primaryActive: "#34d399",
      slateDark: "#2e2e2e",
    },
    semantic: {
      up: "#00D26A",       // Green for Operational
      warning: "#f59e0b",  // Amber for Degraded
      down: "#f87171",     // Red for Alert/Down
      broken: "#ef4444",   // Crimson for Critical
    },
    dark: {
      background: "#1c1c1c",
      sidebar: "#171717",
      card: "#1c1c1c",
      border: "#2e2e2e",
      text: "#fafafa",
      textMuted: "#a1a1aa",
    },
    light: {
      background: "#fafafa",
      sidebar: "#f5f5f5",
      card: "#ffffff",
      border: "#e5e5e5",
      text: "#1c1c1c",
      textMuted: "#737373",
    }
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px"
  }
} as const;

export type ColorsType = typeof DESIGN_TOKENS.colors;
export type BreakpointsType = typeof DESIGN_TOKENS.breakpoints;
