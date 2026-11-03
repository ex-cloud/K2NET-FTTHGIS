export type ErrorLocale = "id" | "en";

export interface ErrorCopyDictionary {
  statusCodeLabel: (code: number) => string;
  backButton: string;
  error404Title: string;
  error404Desc: string;
  tenant404Title: string;
  tenant404DescPrefix: string;
  tenant404DescFallback: string;
  tenant404DescSuffix: string;
  tenant404ContactSupport: string;
  tenant404BackHome: string;
  error403Title: string;
  error403Desc: string;
  error403AuditNotice: string;
  error419Title: string;
  error419Desc: string;
  error419ReloginButton: string;
  error500Title: string;
  error500Desc: string;
  error500TraceLabel: string;
  error500CopyTrace: string;
  error500RetryButton: string;
  error500ReportButton: string;
  error500Reporting: string;
  error500Reported: string;
  error500ReportFailed: string;
  error500ReportNetworkError: string;
  error503Title: string;
  error503Desc: string;
}

const COPY: Record<ErrorLocale, ErrorCopyDictionary> = {
  id: {
    statusCodeLabel: (code: number) => `Kode Status: ${code}`,
    backButton: "Kembali",
    error404Title: "Halaman Tidak Ditemukan",
    error404Desc: "Maaf, halaman atau rute yang Anda cari tidak tersedia di sistem.",
    tenant404Title: "Workspace Tidak Ditemukan",
    tenant404DescPrefix: "Maaf, subdomain",
    tenant404DescFallback: "yang Anda akses",
    tenant404DescSuffix:
      "tidak terdaftar, ditangguhkan, atau belum terkonfigurasi di sistem K2NET FTTH GIS.",
    tenant404ContactSupport: "Hubungi Dukungan Platform",
    tenant404BackHome: "Kembali ke Beranda Utama",
    error403Title: "Akses Terbatas",
    error403Desc:
      "Anda tidak memiliki hak akses atau izin yang diperlukan untuk melihat halaman ini.",
    error403AuditNotice:
      "Insiden akses tidak sah ini dicatat otomatis di sistem audit trail pusat.",
    error419Title: "Halaman Kedaluwarsa",
    error419Desc:
      "Akun Anda telah terdeteksi melakukan login di perangkat atau browser lain. Sesi di perangkat ini demi keamanan otomatis dihentikan.",
    error419ReloginButton: "Masuk Kembali",
    error500Title: "Koneksi Server Terputus",
    error500Desc:
      "Terjadi kesalahan internal pada server pusat saat memproses permintaan Anda. Sistem telah membatasi dampak kesalahan ini demi keamanan data Anda.",
    error500TraceLabel: "Trace ID:",
    error500CopyTrace: "Salin Trace ID",
    error500RetryButton: "Coba Ulang Halaman",
    error500ReportButton: "Laporkan ke Pusat",
    error500Reporting: "Mengirim...",
    error500Reported: "Laporan Terkirim",
    error500ReportFailed: "Gagal mengirim laporan otomatis ke pusat. Silakan coba lagi.",
    error500ReportNetworkError: "Kesalahan jaringan saat menghubungi pusat support.",
    error503Title: "Pemeliharaan Terjadwal",
    error503Desc:
      "Platform sedang meningkatkan performa dan menerapkan migrasi sistem database rutin. Silakan coba beberapa saat lagi.",
  },
  en: {
    statusCodeLabel: (code: number) => `Status Code: ${code}`,
    backButton: "Go Back",
    error404Title: "Page Not Found",
    error404Desc: "The page or route you are looking for does not exist or has been moved.",
    tenant404Title: "Workspace Not Found",
    tenant404DescPrefix: "The workspace subdomain",
    tenant404DescFallback: "you accessed",
    tenant404DescSuffix:
      "is not registered, has been suspended, or is not configured in the K2NET FTTH GIS platform.",
    tenant404ContactSupport: "Contact Platform Support",
    tenant404BackHome: "Back to Main Website",
    error403Title: "Access Restricted",
    error403Desc:
      "You do not have the required permissions or role privileges to access this resource.",
    error403AuditNotice:
      "Unauthorized access attempts are automatically recorded in the central immutable audit trail.",
    error419Title: "Page Expired",
    error419Desc:
      "Your account has been detected signing in on another device or browser. For your security, the session on this device has been automatically terminated.",
    error419ReloginButton: "Sign In Again",
    error500Title: "Server Error",
    error500Desc:
      "An internal error occurred while processing your request. The system has contained the error to protect your data.",
    error500TraceLabel: "Trace ID:",
    error500CopyTrace: "Copy Trace ID",
    error500RetryButton: "Reload Page",
    error500ReportButton: "Report to Support",
    error500Reporting: "Sending...",
    error500Reported: "Report Sent",
    error500ReportFailed: "Failed to send automatic report to central support. Please try again.",
    error500ReportNetworkError: "Network error while contacting central support.",
    error503Title: "Scheduled Maintenance",
    error503Desc:
      "The platform is currently undergoing scheduled maintenance or database upgrades. Please try again shortly.",
  },
};

export function resolveErrorCopy(localeOverride?: ErrorLocale): ErrorCopyDictionary {
  if (localeOverride && COPY[localeOverride]) {
    return COPY[localeOverride];
  }
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("k2net_locale");
      if (stored === "en" || stored === "id") {
        return COPY[stored];
      }
    } catch {
      // ignore storage access issues
    }
    const docLang = document.documentElement?.lang?.toLowerCase();
    if (docLang?.startsWith("en")) {
      return COPY.en;
    }
  }
  return COPY.id;
}

