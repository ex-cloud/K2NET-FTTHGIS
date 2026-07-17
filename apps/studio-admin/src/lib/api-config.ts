/**
 * Utility untuk mendapatkan URL Backend secara dinamis.
 * Jika diakses melalui browser, ia akan menyesuaikan hostname-nya.
 * Ini memungkinkan akses lancar via localhost maupun IP Jaringan (Mobile/Laptop lain).
 */
export const getBackendBaseUrl = () => {
  // Hanya jalankan logika ini di sisi browser (client-side)
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // In production/staged environment, backend is proxied under the same host/domain via Nginx
      return `${protocol}//${hostname}/api/v1`;
    }
    
    // Fallback to localhost if we are on local development
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:9090/api/v1`;
    }
  }

  // Server-side default: Next.js server accesses backend directly on localhost
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl;
  }
  return "http://localhost:9090/api/v1";
};

export const getMartinBaseUrl = () => {
  const defaultUrl =
    process.env.NEXT_PUBLIC_MARTIN_URL || "http://127.0.0.1:3001";

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // In production, Martin is proxied under the main host via Nginx
      return `${protocol}//${hostname}`;
    }
  }

  return defaultUrl;
};

export const getPollerBaseUrl = () => {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // In production, Poller is proxied under /poller
      return `${protocol}//${hostname}/poller`;
    }
  }
  return "http://localhost:5010";
};

export const getAuthUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";
};
