import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    host: "0.0.0.0",
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
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("maplibre-gl") || id.includes("react-map-gl")) {
              return "maplibre";
            }
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) {
              return "charts";
            }
            if (id.includes("lucide-react")) {
              return "icons";
            }
            if (
              id.includes("react-markdown") ||
              id.includes("remark-gfm") ||
              id.includes("micromark") ||
              id.includes("mdast-") ||
              id.includes("tiptap") ||
              id.includes("prosemirror")
            ) {
              return "markdown-renderer";
            }
            if (id.includes("@tanstack/react-router")) {
              return "router";
            }
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/react-table")) {
              return "tanstack-data";
            }
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("zustand") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge")
            ) {
              return "vendor";
            }
          }
        },
      },
    },
  },
});
