import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
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
        destination: "http://localhost:9090/api/v1/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:9090/uploads/:path*",
      },
      {
        source: "/api/gateway/:path*",
        destination: "http://localhost:5001/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
