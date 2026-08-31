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
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          maplibre: ["maplibre-gl"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
