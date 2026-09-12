import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    host: "0.0.0.0",
    watch: {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/apps/api/target/**",
        "**/backups/**",
        "**/.next/**",
        "**/dist/**",
        "**/docs/**",
        "**/database/**",
        "**/.turbo/**",
      ],
    },
    proxy: {
      "/api/v1": {
        target: process.env.VITE_KONG_URL || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/api/gateway": {
        target: process.env.VITE_KONG_URL || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
    // Turun dari 1200 → 600 (standar production quality gate)
    chunkSizeWarningLimit: 600,
    // Percepat CI: tidak perlu hitung ukuran compressed di setiap build
    reportCompressedSize: false,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // ── Map (besar ~2MB, hanya dipakai di /assets-3d & spatial routes) ──
            if (id.includes("maplibre-gl") || id.includes("react-map-gl")) {
              return "maplibre";
            }
            // ── AI Editor (TipTap + ProseMirror, hanya di /ai/add route) ──────
            if (
              id.includes("@tiptap") ||
              id.includes("prosemirror")
            ) {
              return "ai-editor";
            }
            // ── Markdown Renderer (react-markdown, remark, mdast) ────────────
            if (
              id.includes("react-markdown") ||
              id.includes("remark-gfm") ||
              id.includes("micromark") ||
              id.includes("mdast-") ||
              id.includes("unist-")
            ) {
              return "markdown";
            }
            // ── Charts (recharts + d3 ecosystem) ─────────────────────────────
            if (
              id.includes("recharts") ||
              id.includes("d3-") ||
              id.includes("victory-vendor")
            ) {
              return "charts";
            }
            // ── Icons (lucide-react, tree-shakeable tapi chunk tersendiri) ───
            if (id.includes("lucide-react")) {
              return "icons";
            }
            // ── Form handling (react-hook-form + resolvers + zod) ────────────
            if (
              id.includes("react-hook-form") ||
              id.includes("@hookform/resolvers") ||
              id.includes("zod")
            ) {
              return "form";
            }
            // ── Date utilities ────────────────────────────────────────────────
            if (id.includes("date-fns") || id.includes("react-day-picker")) {
              return "date";
            }
            // ── TanStack Query (state / fetching) ─────────────────────────────
            if (id.includes("@tanstack/react-query")) {
              return "tanstack-query";
            }
            // ── TanStack Router ───────────────────────────────────────────────
            if (id.includes("@tanstack/react-router")) {
              return "router";
            }
            // ── TanStack Table ────────────────────────────────────────────────
            if (id.includes("@tanstack/react-table")) {
              return "tanstack-table";
            }
            // ── Core vendor (react, zustand, utilities) ───────────────────────
            if (
              id.includes("react/") ||
              id.includes("react-dom") ||
              id.includes("zustand") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge") ||
              id.includes("class-variance-authority")
            ) {
              return "vendor";
            }
          }
        },
      },
    },
  },
});
