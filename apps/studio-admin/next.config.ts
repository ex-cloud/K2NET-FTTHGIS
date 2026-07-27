import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:9090";
const NOTIFICATION_GW_URL = process.env.NOTIFICATION_GATEWAY_URL || "http://localhost:5001";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  transpilePackages: [
    "@k2net/ui",
    "@k2net/design-system",
    "@k2net/auth",
    "@k2net/types",
  ],
  allowedDevOrigins: [
    "system.lvh.me",
    "localhost",
    "system.gis.k2net.id",
    "system-gis.k2net.id",
  ],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
      {
        source: "/api/gateway/:path*",
        destination: `${NOTIFICATION_GW_URL}/api/v1/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/health",
        destination: "/observability/compute",
        permanent: true,
      },
      {
        source: "/system",
        destination: "/overview",
        permanent: true,
      },
      {
        source: "/metrics",
        destination: "/observability/api-gateway",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
