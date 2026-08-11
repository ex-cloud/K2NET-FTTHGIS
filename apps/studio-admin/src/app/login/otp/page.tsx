"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, CheckCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

// Sub-components
import { DeviceTrustBanner } from "./components/DeviceTrustBanner";
import { MethodSelector } from "./components/MethodSelector";
import { OtpInputForm } from "./components/OtpInputForm";

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
                // Mark device verified via cookie and redirect to main page (expires in 24 hours to match backend)
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
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        // Set verify token cookie (expires in 24 hours to match backend)
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

    // WebAuthn Biometrics ONLY if running in a Secure Context (HTTPS / localhost)
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
              { alg: -7, type: "public-key" },
              { alg: -257, type: "public-key" },
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "discouraged",
            },
            timeout: 60000,
          },
        });
      } catch (webauthnErr) {
        console.warn("[WebAuthn] Biometrics skipped/failed, proceeding with API device trust:", webauthnErr);
      }
    }

    // Register device trust in backend database via API
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

  const handleDigitChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4" />
              <div className="h-5 bg-muted rounded-lg w-48 mx-auto mb-2" />
              <div className="h-3 bg-muted/60 rounded w-64 mx-auto" />
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/20 p-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-muted rounded" />
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-24 mb-1.5" />
                  <div className="h-2 bg-muted rounded w-32" />
                </div>
              </div>
            </div>
            <div className="h-3 bg-muted rounded w-40 mx-auto mb-4" />
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="h-16 bg-muted/60 rounded-xl" />
              <div className="h-16 bg-muted/60 rounded-xl" />
            </div>
            <div className="h-10 bg-muted/40 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>

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
              <Lock className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
              Verifikasi 2 Langkah <ShieldCheck className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-muted-foreground text-xs mt-1">
              Akun Anda terlindungi dengan sistem verifikasi 2-Step.
            </p>
          </div>

          {/* Current Device Banner Component */}
          <DeviceTrustBanner
            sessionReady={sessionReady}
            browser={browser}
            os={os}
            isTrustingDevice={isTrustingDevice}
            onTrustDevice={handleTrustDevice}
          />

          {/* Error and Success Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 mb-5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary mb-5">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Verification Forms */}
          {!otpSent ? (
            <MethodSelector
              method={method}
              onMethodChange={(m) => {
                setMethod(m);
                setError(null);
              }}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              email={session?.user?.email || ""}
              isSending={isSending}
              onSubmit={handleSendOtp}
            />
          ) : (
            <OtpInputForm
              otp={otp}
              onChangeDigit={handleDigitChange}
              onKeyDownDigit={handleDigitKeyDown}
              inputRefs={inputRefs}
              isVerifying={isVerifying}
              countdown={countdown}
              isSending={isSending}
              onSendOtp={() => handleSendOtp()}
              onVerifyOtp={handleVerifyOtp}
              onChangeMethodClick={() => {
                setOtpSent(false);
                setError(null);
                setInfoMessage(null);
              }}
            />
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
    </div>
  );
}
