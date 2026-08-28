import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    runtimeCaching: [
      // Cache OpenFreeMap vector tile styles
      {
        urlPattern: /^https:\/\/tiles\.openfreemap\.org\/styles\/.*$/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "basemap-style-cache",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
        },
      },
      // Cache OpenFreeMap vector tiles themselves
      {
        urlPattern: /^https:\/\/tiles\.openfreemap\.org\/tiles\/.*$/,
        handler: "CacheFirst",
        options: {
          cacheName: "basemap-tiles-cache",
          expiration: {
            maxEntries: 1000,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache Google Fonts
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*$/,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  allowedDevOrigins: ["system.lvh.me", "localhost", "lvh.me", "system.gis.kdua.net", "system-gis.kdua.net", "gis.kdua.net"],
  async rewrites() {
    return [
      {
        source: "/api/gateway/:path*",
        destination: "http://localhost:5001/api/v1/:path*",
      },
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:9090/api/v1/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:9090/uploads/:path*",
      },
    ];
  },
};

export default withPWA(nextConfig);
