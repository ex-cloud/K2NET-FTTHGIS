/**
 * Utility untuk mendapatkan URL Backend secara dinamis.
 * Jika diakses melalui browser, ia akan menyesuaikan hostname-nya.
 * Ini memungkinkan akses lancar via localhost maupun IP Jaringan (Mobile/Laptop lain).
 */
export const getBackendBaseUrl = () => {
  // Try to get from environment variable first
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If envUrl is set and is an absolute URL, use it
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    return envUrl;
  }

  // Hanya jalankan logika ini di sisi browser (client-side)
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    // Use absolute current origin for API calls if possible to avoid CORS preflight mismatch
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // In production/staged environment, we assume backend is on port 9090 of the same host
      return `${protocol}//${hostname}:9090/api/v1`;
    }
    
    // Fallback to localhost if we are on local
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:9090/api/v1`;
    }
  }

  // Global default fallback
  return "http://localhost:9090/api/v1";
};

export const getMartinBaseUrl = () => {
  const defaultUrl =
    process.env.NEXT_PUBLIC_MARTIN_URL || "http://127.0.0.1:3001";

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:3001`;
    }
  }

  return defaultUrl;
};

export const getAuthUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";
};
