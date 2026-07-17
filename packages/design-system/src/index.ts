export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: "#139BE7",
      primaryHover: "#0f7fbf",
      primaryActive: "#40b3ed",
      slateDark: "#1E293B",
    },
    semantic: {
      up: "#10b981",       // Green for Operational
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
      background: "#F8FAFC",
      sidebar: "#F1F5F9",
      card: "#FFFFFF",
      border: "#E2E8F0",
      text: "#0F172A",
      textMuted: "#64748B",
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
