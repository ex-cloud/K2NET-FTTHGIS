import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["system.lvh.me", "localhost", "lvh.me", "system.gis.k2net.id", "system-gis.k2net.id", "gis.k2net.id"],
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

export default nextConfig;
