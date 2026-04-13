/**
 * Utility untuk mendapatkan URL Backend secara dinamis.
 * Jika diakses melalui browser, ia akan menyesuaikan hostname-nya.
 * Ini memungkinkan akses lancar via localhost maupun IP Jaringan (Mobile/Laptop lain).
 */
export const getBackendBaseUrl = () => {
  const defaultUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";

  // Hanya jalankan logika ini di sisi browser (client-side)
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;

    // Use absolute current origin for API calls if possible to avoid CORS preflight mismatch
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:9090/api/v1`;
    }
    
    // Fallback to localhost if we are on local
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:9090/api/v1`;
    }
  }

  return defaultUrl;
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
