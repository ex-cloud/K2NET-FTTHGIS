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

    // Jika kita mengakses lewat IP atau hostname selain localhost,
    // arahkan API ke host yang sama tapi port 9090
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:9090/api/v1`;
    }
  }

  return defaultUrl;
};

export const getAuthUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
};
