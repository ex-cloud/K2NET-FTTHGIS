"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Lock, Phone, Mail, KeyRound, Loader2, AlertCircle, CheckCircle, 
  ArrowLeft, ShieldCheck, Laptop, Fingerprint 
} from "lucide-react";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { ModeToggle } from "@/components/mode-toggle";

// Browser detection helpers
function getBrowserName(userAgent: string) {
  if (userAgent.includes("Firefox")) return "Mozilla Firefox";
  if (userAgent.includes("SamsungBrowser")) return "Samsung Internet";
  if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
  if (userAgent.includes("Trident")) return "Internet Explorer";
  if (userAgent.includes("Edge") || userAgent.includes("Edg")) return "Microsoft Edge";
  if (userAgent.includes("Chrome")) return "Google Chrome";
  if (userAgent.includes("Safari")) return "Apple Safari";
  return "Unknown Browser";
}

function getOSName(userAgent: string) {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  return "Unknown OS";
}

function getCookieSecureFlag() {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "; Secure";
  }
  return "";
}

export default function OtpPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  
  const [method, setMethod] = useState<"whatsapp" | "email">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // WebAuthn / Device Trust states
  const [isTrustingDevice, setIsTrustingDevice] = useState(false);

  // Session readiness: authenticated AND accessToken available
  const sessionReady = status === "authenticated" && !!session?.accessToken;
  const [hasRefreshedSession, setHasRefreshedSession] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Auto-synchronize session if authenticated but accessToken is temporarily missing (hydration lag)
  useEffect(() => {
    if (status === "authenticated" && !session?.accessToken && !hasRefreshedSession) {
      setHasRefreshedSession(true);
      console.log("[OTP] Sesi aktif tetapi token belum termuat. Menyinkronkan...");
      updateSession();
    }
  }, [status, session, hasRefreshedSession, updateSession]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Generate & Persist Browser/Device Fingerprint
  const [fingerprint, setFingerprint] = useState("");
  const [browser, setBrowser] = useState("");
  const [os, setOs] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      let fp = localStorage.getItem("device_fingerprint");
      if (!fp) {
        fp = crypto.randomUUID();
        localStorage.setItem("device_fingerprint", fp);
      }
      setFingerprint(fp);
      
      // Set cookie so it is available to Next.js middleware / server-side (only append Secure on HTTPS)
      document.cookie = `device_fingerprint=${fp}; path=/; max-age=31536000; SameSite=Lax${getCookieSecureFlag()}`;

      const ua = navigator.userAgent;
      setBrowser(getBrowserName(ua));
      setOs(getOSName(ua));
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const redirectToMain = useCallback(() => {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    if (hostname.startsWith("system.") || hostname.startsWith("system-")) {
      router.push("/organizations");
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  // Handle automatic check on load if device is already verified
  useEffect(() => {
    if (status === "unauthenticated") {
      if (!hasCheckedSession) {
        setHasCheckedSession(true);
        console.log("[OTP] Status unauthenticated tetapi kuki sesi mungkin ada. Sinkronisasi sesi...");
        updateSession();
      } else {
        // Jika setelah disinkronkan memang benar-benar unauthenticated, redirect keras ke login
        console.log("[OTP] Benar-benar unauthenticated. Mengalihkan ke login...");
        window.location.href = "/login";
      }
      return;
    }
    
    if (status === "authenticated" && session?.accessToken && fingerprint) {
      const checkStatus = async () => {
        try {
          const res = await fetch("/api/v1/security/device/status", {
            headers: {
              "Authorization": `Bearer ${session.accessToken}`,
              "X-Device-Fingerprint": fingerprint,
            }
          });
          if (res.status === 401) {
            setError("Akses ditolak: Akun Anda tidak terdaftar atau tidak memiliki akses ke domain ini.");
            return;
          }
          if (res.ok) {
            try {
              const data = await res.json();
              if (data.verified) {
                // Mark device verified via cookie and redirect to main page
                document.cookie = `device_verified_${fingerprint}=true; path=/; max-age=86400; SameSite=Lax${getCookieSecureFlag()}`;
                redirectToMain();
              }
            } catch (e) {
              console.error("Failed to parse device status:", e);
            }
          }
        } catch (e) {
          console.error("Error checking device status:", e);
        }
      };
      checkStatus();
    }
  }, [status, session, fingerprint, hasCheckedSession, updateSession, redirectToMain]);

  // Send OTP handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken || !fingerprint) return;

    if (method === "whatsapp" && (!phoneNumber || phoneNumber.trim() === "")) {
      setError("Nomor WhatsApp wajib dimasukkan jika memilih verifikasi via WhatsApp.");
      return;
    }

    setIsSending(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/v1/security/device/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          deviceFingerprint: fingerprint,
          phoneNumber: method === "whatsapp" ? phoneNumber : null,
        }),
      });

      if (res.status === 401) {
        setError("Akses ditolak: Akun Anda tidak terdaftar atau tidak memiliki akses ke domain ini.");
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        data = { success: false, message: "Gagal memproses respon server." };
      }

      if (res.ok && data.success) {
        setOtpSent(true);
        setCountdown(60); // 1-minute countdown
        if (method === "whatsapp") {
          setInfoMessage(`Kode OTP berhasil dikirim ke nomor WhatsApp Anda: ${phoneNumber}`);
        } else {
          setInfoMessage(`Kode OTP berhasil dikirim ke alamat email Anda: ${session?.user?.email || "terdaftar"}`);
        }
      } else {
        setError(data.message || "Gagal mengirimkan kode OTP. Silakan coba lagi.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan saat mengirim OTP.");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = useCallback(async () => {
    if (!session?.accessToken || !fingerprint) return;
    
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Silakan masukkan 6 digit kode OTP secara lengkap.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/security/device/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          deviceFingerprint: fingerprint,
          otpCode: otpCode,
          browser: browser,
          os: os
        }),
      });

      if (res.status === 401) {
        setError("Akses ditolak: Akun Anda tidak terdaftar atau tidak memiliki akses.");
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        data = { success: false, message: "Gagal memproses respon server." };
      }

      if (res.ok && data.success) {
        setInfoMessage("Verifikasi perangkat berhasil! Mengarahkan Anda...");
        // Set verify token cookie
        document.cookie = `device_verified_${fingerprint}=true; path=/; max-age=86400; SameSite=Lax${getCookieSecureFlag()}`;
        setTimeout(() => {
          redirectToMain();
        }, 1500);
      } else {
        setError(data.message || "Kode OTP salah atau telah kedaluwarsa.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan saat verifikasi.");
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  }, [session, fingerprint, otp, browser, os, redirectToMain]);

  // Automatically verify OTP when 6 digits are fully entered
  useEffect(() => {
    const otpCode = otp.join("");
    if (otpCode.length === 6 && sessionReady && fingerprint && !isVerifying) {
      handleVerifyOtp();
    }
  }, [otp, sessionReady, fingerprint, isVerifying, handleVerifyOtp]);

  const handleTrustDevice = async () => {
    setIsTrustingDevice(true);
    setError(null);

    // Ensure we have a valid accessToken before calling the API.
    let currentAccessToken = session?.accessToken;
    if (!currentAccessToken) {
      try {
        const refreshed = await updateSession();
        currentAccessToken = refreshed?.accessToken;
      } catch (e) {
        console.error("Failed to refresh session:", e);
      }
    }

    if (!currentAccessToken) {
      setError("Sesi belum siap. Harap muat ulang halaman dan coba lagi.");
      setIsTrustingDevice(false);
      return;
    }

    // Step 1: Try WebAuthn Biometrics ONLY if running in a Secure Context (HTTPS / localhost)
    if (typeof window !== "undefined" && window.isSecureContext && navigator.credentials?.create) {
      try {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const userId = new TextEncoder().encode(session?.user?.email || "user");

        await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: "FTTH GIS Platform", id: window.location.hostname },
            user: {
              id: userId,
              name: session?.user?.email || "user",
              displayName: session?.user?.name || "User",
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" },   // ES256
              { alg: -257, type: "public-key" },  // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform", // Force Windows Hello / Touch ID
              userVerification: "required",
              residentKey: "discouraged",
            },
            timeout: 60000,
          },
        });
      } catch (webauthnErr) {
        console.warn("[WebAuthn] Biometrics skipped/failed (e.g. HTTP connection), proceeding with API device trust:", webauthnErr);
      }
    }

    // Step 2: Register device trust in backend database via API
    try {
      const res = await fetch("/api/v1/security/device/trust-current", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentAccessToken}`,
        },
        body: JSON.stringify({
          deviceFingerprint: fingerprint,
          browser: browser,
          os: os,
        }),
      });

      if (res.status === 401) {
        setError("Akses ditolak: Sesi Anda telah berakhir. Harap login kembali.");
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        data = { success: false, message: "Gagal memproses respon server." };
      }

      if (res.ok && data.success) {
        setInfoMessage("Perangkat berhasil dipercayai! Mengarahkan...");
        document.cookie = `device_verified_${fingerprint}=true; path=/; max-age=86400; SameSite=Lax${getCookieSecureFlag()}`;
        setTimeout(() => {
          redirectToMain();
        }, 1200);
      } else {
        setError(data.message || "Gagal mempercayai perangkat ini.");
      }
    } catch (err: unknown) {
      console.error("Device trust API error:", err);
      setError("Kesalahan jaringan saat memverifikasi perangkat.");
    } finally {
      setIsTrustingDevice(false);
    }
  };

  // Otp digit inputs change helper
  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next ref
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background" />
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="backdrop-blur-xl bg-card border border-border rounded-2xl shadow-2xl p-8 animate-pulse">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 mb-4" />
              <div className="h-5 bg-zinc-800 rounded-lg w-48 mx-auto mb-2" />
              <div className="h-3 bg-zinc-800/60 rounded w-64 mx-auto" />
            </div>
            <div className="rounded-lg bg-zinc-800/40 border border-zinc-700/20 p-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-zinc-700 rounded" />
                <div className="flex-1">
                  <div className="h-3 bg-zinc-700 rounded w-24 mb-1.5" />
                  <div className="h-2 bg-zinc-800 rounded w-32" />
                </div>
                <div className="h-6 w-16 bg-zinc-700 rounded-md" />
              </div>
            </div>
            <div className="h-3 bg-zinc-800 rounded w-40 mx-auto mb-4" />
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="h-16 bg-zinc-800/60 rounded-xl" />
              <div className="h-16 bg-zinc-800/60 rounded-xl" />
            </div>
            <div className="h-10 bg-zinc-800/40 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Theme Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background" />
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl shadow-2xl p-8">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-primary to-cyan-500 shadow-md shadow-primary/25 mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
              Verifikasi 2 Langkah <ShieldCheck className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-muted-foreground text-xs mt-1">
              Akun Anda terlindungi dengan sistem verifikasi 2-Step.
            </p>
          </div>

          {/* Current Device Banner */}
          {!sessionReady ? (
            <div className="rounded-lg bg-muted/50 border border-border p-3 mb-6 animate-pulse">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-muted rounded" />
                  <div>
                    <div className="h-3 bg-muted rounded w-24 mb-1.5" />
                    <div className="h-2 bg-muted rounded w-32" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-muted/40 rounded-md" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 border border-border p-3 text-xs text-foreground mb-6 transition-all duration-500 animate-in fade-in">
              <div className="flex items-center gap-3">
                <Laptop className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Perangkat Saat Ini</p>
                  <p className="text-[10px] text-muted-foreground">{browser} ({os})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfoMessage(null);
                  handleTrustDevice();
                }}
                disabled={isTrustingDevice}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold border rounded-lg transition-all shrink-0 ${
                  isTrustingDevice
                    ? "text-muted-foreground border-border bg-muted/30 cursor-not-allowed"
                    : "text-primary border-primary/35 bg-primary/10 hover:bg-primary/20 hover:border-primary/50 hover:text-primary"
                }`}
              >
                {isTrustingDevice ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-3.5 w-3.5" />
                    Percayai Perangkat
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error and Success Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 mb-5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 mb-5">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Verification Method Chooser */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Pilih Metode Pengiriman OTP</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setMethod("email"); setError(null); }}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                      method === "email"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/40 hover:bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    <Mail className="h-5 w-5 mb-1.5" />
                    <span className="text-xs font-medium">Kirim ke Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMethod("whatsapp"); setError(null); }}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                      method === "whatsapp"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/40 hover:bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    <Phone className="h-5 w-5 mb-1.5" />
                    <span className="text-xs font-medium">Kirim ke WhatsApp</span>
                  </button>
                </div>
              </div>

              {method === "email" && (
                <div className="rounded-lg bg-muted border border-border p-3.5 text-center">
                  <p className="text-[10px] text-muted-foreground">KODE AKAN DIKIRIM KE ALAMAT EMAIL TERDAFTAR</p>
                  <p className="text-xs font-semibold text-foreground mt-1">{session?.user?.email || "Email akun"}</p>
                </div>
              )}

              {method === "whatsapp" && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    Nomor WhatsApp Anda
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g. 08123456789 atau 628123456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-11 bg-background border-border text-sm focus:border-primary/50 text-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground">Masukkan nomor yang aktif untuk menerima OTP.</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSending}
                className="w-full h-11 bg-linear-to-r from-primary to-primary/80 hover:from-primary/95 text-white transition-all shadow-lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirimkan Kode...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Kirim Kode OTP
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* 6 Digit Input Fields */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground">Masukkan 6 Digit OTP</label>
                  {countdown > 0 ? (
                    <span className="text-[10px] text-muted-foreground">Kirim ulang dalam {countdown}s</span>
                  ) : (
                    <button 
                      onClick={handleSendOtp} 
                      disabled={isSending}
                      className="text-[10px] text-primary font-semibold hover:underline"
                    >
                      Kirim Ulang OTP
                    </button>
                  )}
                </div>
                
                <div className="flex justify-between gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      disabled={isVerifying}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-12 h-12 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-center text-xl font-bold text-foreground outline-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isVerifying}
                  className="w-full h-11 bg-linear-to-r from-primary to-primary/85 hover:from-primary/90 text-white transition-all shadow-lg font-semibold"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verifikasi & Masuk
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => { setOtpSent(false); setError(null); setInfoMessage(null); }}
                  variant="outline"
                  className="w-full h-11 border-border bg-muted/30 text-muted-foreground hover:bg-muted/40 text-xs"
                >
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  Ganti Metode Pengiriman
                </Button>
              </div>
            </div>
          )}

          {/* Footer Back Link */}
          <div className="mt-8 pt-5 border-t border-border text-center">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-3 w-3" />
              Kembali ke Halaman Login
            </button>
          </div>
        </div>
      </div>

      {/* WebAuthn verification is handled natively by the browser - no modal needed */}
    </div>
  );
}
