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
    port: 3000,
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
      "/tiles": {
        target: process.env.VITE_MARTIN_URL || "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("maplibre-gl") || id.includes("react-map-gl")) {
              return "maplibre";
            }
            if (id.includes("@tanstack/react-router")) {
              return "router";
            }
            if (id.includes("@tanstack/react-query")) {
              return "query";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("clsx") || id.includes("tailwind-merge")) {
              return "vendor";
            }
          }
        },
      },
    },
  },
});
