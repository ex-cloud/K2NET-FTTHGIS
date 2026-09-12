// @ts-nocheck
// Note: vitest pulls vite@5 as peer dep, but studio-tenant uses vite@6.
// @ts-nocheck here prevents false-positive type errors in IDE caused by this monorepo version mismatch.
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: [...configDefaults.exclude, "**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@k2net/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@k2net/auth": path.resolve(__dirname, "../../packages/auth/src/index.ts"),
      "@k2net/auth/client": path.resolve(__dirname, "../../packages/auth/src/client/index.ts"),
      "@k2net/api-client": path.resolve(__dirname, "../../packages/api-client/src/index.ts"),
      "@k2net/design-system": path.resolve(__dirname, "../../packages/design-system/src/index.ts"),
      "@k2net/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
    },
  },
});
