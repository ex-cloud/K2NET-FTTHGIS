// @ts-nocheck
// Note: vitest pulls vite@5 as peer dep, but studio-admin uses vite@6.
// @ts-nocheck here prevents false-positive type errors in IDE caused by this
// monorepo version mismatch. The config is correct at runtime.
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/main.tsx",
        "src/router.tsx", // router is integration-tested via CI
        "src/app/**/page.tsx", // pages tested via E2E, not unit
      ],
    },
    exclude: [...configDefaults.exclude, "e2e/**/*"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@k2net/auth": path.resolve(__dirname, "../../packages/auth/src/index.ts"),
      "@k2net/auth/client": path.resolve(__dirname, "../../packages/auth/src/client/index.ts"),
      "@k2net/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@k2net/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@k2net/design-system": path.resolve(__dirname, "../../packages/design-system/src/index.ts"),
      "@k2net/api-client": path.resolve(__dirname, "../../packages/api-client/src/index.ts"),
    },
  },
});
