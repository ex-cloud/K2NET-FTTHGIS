"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  AlertCircle, Loader2, Save, Info, Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface SocialIdentity {
  provider: string;
  userId: string;
  userName: string;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

export default function PreferencesPage() {
  const { data: session, update: updateSession } = useSession();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Social Identities detailed state
  const [socialIdentities, setSocialIdentities] = useState<SocialIdentity[]>([]);

  // WhatsApp Connection State
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(false);
  const [isSavingWa, setIsSavingWa] = useState(false);

  const [subdomain, setSubdomain] = useState("");

  // Subdomain detection for dynamic theme accent colors
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.startsWith("system.") || hostname.startsWith("system-")) {
        setSubdomain("system");
      } else {
        const parts = hostname.split(".");
        if (parts.length > 2 && parts[0] !== "www") {
          setSubdomain(parts[0]);
        }
      }
    }
  }, []);

  // Clean up Keycloak OAuth parameters and execute secure account linking on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      
      // Check query parameter or fallback to sessionStorage
      let provider = url.searchParams.get("link");
      if (!provider && code) {
        provider = sessionStorage.getItem("linking_provider");
      }

      if (code && provider) {
        if (!session?.accessToken) {
          // Wait until next-auth session is fully loaded before clearing query params
          return;
        }
        
        // Clear params once we have the token and are ready to send the link request
        url.search = "";
        window.history.replaceState({}, document.title, url.pathname);
        sessionStorage.removeItem("linking_provider");
        
        const linkToast = toast.loading(`Menghubungkan akun ${provider === "google" ? "Google" : "GitHub"}...`);
        
        fetch("/api/v1/users/me/social-identities/link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`
          },
          body: JSON.stringify({
            provider,
            code,
            redirectUri: `${window.location.origin}/account/preferences?link=${provider}`
          })
        })
        .then(async (res) => {
          toast.dismiss(linkToast);
          if (res.ok) {
            toast.success(`Akun ${provider === "google" ? "Google" : "GitHub"} berhasil ditautkan!`);
            // Refresh social identities
            const listRes = await fetch("/api/v1/users/me/social-identities", {
              headers: {
                "Authorization": `Bearer ${session.accessToken}`
              }
            });
            if (listRes.ok) {
              const list = await listRes.json();
              setSocialIdentities(list);
            }
          } else {
            const data = await res.json();
            toast.error(data.message || `Gagal menautkan akun ${provider}.`);
          }
        })
        .catch((err) => {
          toast.dismiss(linkToast);
          toast.error("Kesalahan jaringan saat menautkan akun.");
          console.error(err);
        });
      } else if (url.searchParams.has("code") || url.searchParams.has("session_state")) {
        url.search = "";
        window.history.replaceState({}, document.title, url.pathname);
      }
    }
  }, [session]);

  // Fetch Profile on load
  useEffect(() => {
    if (session?.accessToken) {
      const fetchProfile = async () => {
        try {
          const res = await fetch("/api/v1/users/me", {
            headers: {
              "Authorization": `Bearer ${session.accessToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            
            // Split full name into first and last name
            if (data.fullName) {
              const parts = data.fullName.split(" ");
              setFirstName(parts[0] || "");
              setLastName(parts.slice(1).join(" ") || "");
            }
            
            setEmail(data.email || "");
            setRegisteredEmail(data.email || "");
            setUsername(data.username || "");
            setAvatarUrl(data.avatarUrl || "");
            setSecondaryEmail(data.secondaryEmail || "");
          }
        } catch (e) {
          console.error("Failed to load user profile:", e);
          setError("Gagal memuat profil dari server.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();

      // Fetch real Social identities from Keycloak via backend
      const fetchSocialIdentities = async () => {
        try {
          const res = await fetch("/api/v1/users/me/social-identities", {
            headers: {
              "Authorization": `Bearer ${session.accessToken}`
            }
          });
          if (res.ok) {
            const list = await res.json();
            setSocialIdentities(list);
          }
        } catch (e) {
          console.error("Failed to load user social identities:", e);
        }
      };

      fetchSocialIdentities();

      // Read WhatsApp connection state from localStorage
      setWhatsAppNumber(localStorage.getItem("wa_phone_number") || "");
      setWhatsAppEnabled(localStorage.getItem("wa_otp_enabled_user") === "true");
    }
  }, [session]);

  // Save profile handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setIsSaving(true);
    setError(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const res = await fetch("/api/v1/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          fullName,
          email: email.trim(),
          avatarUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local registered email state too
        setRegisteredEmail(email.trim());
        setSecondaryEmail(data.secondaryEmail || "");
        // We trigger next-auth session refresh
        await updateSession();
        toast.success("Profil berhasil diperbarui!");
      } else {
        const data = await res.json();
        setError(data.message || "Gagal memperbarui profil di server.");
      }
    } catch (e) {
      setError("Kesalahan jaringan saat memperbarui profil.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // WhatsApp Connection handler
  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWa(true);

    try {
      localStorage.setItem("wa_phone_number", whatsAppNumber.trim());
      localStorage.setItem("wa_otp_enabled_user", whatsAppEnabled.toString());
      
      // Let's also set a cookie so client can easily reference
      document.cookie = `user_wa_number=${whatsAppNumber.trim()}; path=/; max-age=31536000; SameSite=Lax; Secure`;

      toast.success("Koneksi WhatsApp berhasil disimpan!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan koneksi WhatsApp.");
    } finally {
      setIsSavingWa(false);
    }
  };

  // Social Auth Link / Unlink via Keycloak IDP
  const handleToggleIdentity = async (provider: "github" | "google") => {
    if (!session?.accessToken) return;

    const googleIdentity = socialIdentities.find(id => id.provider === "google");
    const githubIdentity = socialIdentities.find(id => id.provider === "github");
    const isConnected = provider === "github" ? !!githubIdentity : !!googleIdentity;

    if (isConnected) {
      // Disconnect: Call backend DELETE API
      const loadingToast = toast.loading(`Mencabut tautan akun ${provider === "github" ? "GitHub" : "Google"}...`);
      try {
        const res = await fetch(`/api/v1/users/me/social-identities/${provider}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${session.accessToken}`
          }
        });
        toast.dismiss(loadingToast);
        if (res.ok) {
          setSocialIdentities(prev => prev.filter(id => id.provider !== provider));
          toast.success(`Tautan akun ${provider === "github" ? "GitHub" : "Google"} berhasil dicabut.`);
          
          // Re-fetch profile to sync reverted email
          try {
            const profileRes = await fetch("/api/v1/users/me", {
              headers: {
                "Authorization": `Bearer ${session.accessToken}`
              }
            });
            if (profileRes.ok) {
              const data = await profileRes.json();
              setEmail(data.email || "");
              setRegisteredEmail(data.email || "");
              setSecondaryEmail(data.secondaryEmail || "");
            }
          } catch (e) {
            console.error("Failed to re-fetch profile after disconnect:", e);
          }
        } else {
          const data = await res.json();
          toast.error(data.message || `Gagal memutuskan tautan ${provider}.`);
        }
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error(`Terjadi kesalahan jaringan saat memutuskan tautan.`);
        console.error(err);
      }
    } else {
      // Connect: Redirect browser to Keycloak IDP link initiation url
      // Store provider in sessionStorage for recovery upon callback redirect
      sessionStorage.setItem("linking_provider", provider);

      const kcServerUrl = process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "http://localhost:8081";
      
      // Resolve Keycloak realm dynamically from session issuer to ensure seamless multi-tenant isolation
      let realm = "ftth-realm";
      if (session?.issuer) {
        try {
          const parts = session.issuer.split("/realms/");
          if (parts.length > 1) {
            realm = parts[1].split("/")[0];
          }
        } catch (e) {
          console.error("Failed to parse realm from issuer:", e);
        }
      } else {
        const orgSlug = session?.user?.organizationSlug;
        if (orgSlug) {
          if (orgSlug === "system" || orgSlug === "ex-cloud-org" || orgSlug === "default") {
            realm = "ftth-realm";
          } else {
            realm = orgSlug;
          }
        }
      }

      const clientId = "ftth-gis-frontend";
      const redirectUri = encodeURIComponent(`${window.location.origin}/account/preferences?link=${provider}`);
      // Use prompt=login to force Keycloak to request provider sign-in, showing the external provider account selector directly
      const linkUrl = `${kcServerUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid&kc_idp_hint=${provider}&prompt=login`;
      
      toast.loading(`Mengarahkan Anda ke ${provider === "github" ? "GitHub" : "Google"} untuk menautkan akun...`);
      setTimeout(() => {
        window.location.href = linkUrl;
      }, 800);
    }
  };

  const googleIdentity = socialIdentities.find(id => id.provider === "google");
  const githubIdentity = socialIdentities.find(id => id.provider === "github");
  const googleConnected = !!googleIdentity;
  const githubConnected = !!githubIdentity;

  // Generate clean email options for the primary email selector
  const emailOptions = Array.from(
    new Set(
      [
        registeredEmail,
        secondaryEmail,
        googleIdentity?.userName,
        githubIdentity?.userName && githubIdentity.userName.includes("@") ? githubIdentity.userName : null,
        email
      ].filter(Boolean)
    )
  ) as string[];

  // Dynamic buttons & outline colors matching system / tenant scheme
  const themeAccentColor = subdomain === "system" ? "text-emerald-500" : "text-primary";
  const themeAccentBg = subdomain === "system" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90";
  const themeAccentBorder = subdomain === "system" ? "focus:border-emerald-500/50" : "focus:border-primary/50";

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className={`h-8 w-8 animate-spin ${themeAccentColor}`} />
        <p className="mt-4 text-xs font-medium">Memuat Preferensi Profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Preferences</h1>
        <p className="text-zinc-400 text-xs mt-1">
          Manage your account profile, connections, and security settings.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Profile Information (Supabase Horizontal Row Style) */}
      <div className="border border-zinc-800 bg-zinc-900/10 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Profile Settings</h2>
          <p className="text-[11px] text-zinc-400">Manage your basic profile information.</p>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="p-6 space-y-6">
            
            {/* Full Name Horizontal Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
              <div>
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Full Name</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Enter your first and last name.</p>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">First Name</label>
                  <Input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`mt-1 h-9 bg-zinc-950/50 border-zinc-800 ${themeAccentBorder} text-white text-xs`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Last Name</label>
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`mt-1 h-9 bg-zinc-950/50 border-zinc-800 ${themeAccentBorder} text-white text-xs`}
                  />
                </div>
              </div>
            </div>

            <Separator className="border-zinc-900" />

            {/* Primary Email Dropdown Horizontal Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
              <div>
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Primary Email</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Choose which email is used as primary identity.</p>
              </div>
              <div className="md:col-span-2">
                <select
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-9 w-full sm:max-w-xs bg-zinc-950/50 border border-zinc-800 rounded-md px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 ${themeAccentBorder} cursor-pointer`}
                >
                  {emailOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-zinc-950 text-white text-xs">
                      {opt}
                    </option>
                  ))}
                </select>
                {secondaryEmail && (
                  <div className="mt-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950/20 max-w-sm">
                    <span className="text-[10px] text-emerald-500 uppercase tracking-wider block font-semibold">Secondary Email (Backup)</span>
                    <span className="text-xs text-zinc-300 font-mono mt-1 block">{secondaryEmail}</span>
                    <p className="text-[9px] text-zinc-550 mt-1 leading-normal">
                      Email awal ini akan otomatis digunakan kembali jika Anda memutuskan tautan akun sosial Google/GitHub.
                    </p>
                  </div>
                )}
                <p className="text-[10px] text-zinc-500 mt-2">
                  Tautkan akun Google atau GitHub Anda di bawah untuk mengaktifkan pilihan email tambahan.
                </p>
              </div>
            </div>

            <Separator className="border-zinc-900" />

            {/* Username Horizontal Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
              <div>
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Username</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Your unique system username.</p>
              </div>
              <div className="md:col-span-2">
                <Input
                  type="text"
                  disabled
                  value={username}
                  className="h-9 sm:max-w-xs bg-zinc-900/30 border-zinc-850 text-zinc-500 cursor-not-allowed text-xs"
                />
                <p className="text-[10px] text-zinc-650 mt-1.5">
                  Username dikelola secara terpusat oleh server otentikasi Keycloak.
                </p>
              </div>
            </div>

          </div>

          {/* Card Footer */}
          <div className="px-6 py-3.5 bg-zinc-900/30 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Simpan perubahan profil Anda untuk menyinkronkan data.</span>
            <Button
              type="submit"
              disabled={isSaving}
              className={`${themeAccentBg} text-white font-semibold text-xs h-8 px-4 flex items-center gap-1.5 transition-all shadow-md shadow-black/25`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Social Accounts (Supabase horizontal styled rows) */}
      <div className="border border-zinc-800 bg-zinc-900/10 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Social Identities</h2>
          <p className="text-[11px] text-zinc-400">Connect third-party accounts for secure and fast single sign-on.</p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Google Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            <div className="flex items-center gap-2.5">
              <GoogleIcon />
              <div>
                <h3 className="text-xs font-semibold text-white">Google Account</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Use Google authentication.</p>
              </div>
            </div>
            
            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {googleConnected ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                      <Check className="w-3 h-3" />
                      Connected as
                    </div>
                    <span className="text-xs text-white font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 inline-block">
                      {googleIdentity?.userName || "Verified User"}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 italic">No Google account linked.</span>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleToggleIdentity("google")}
                  className={`text-xs font-semibold h-8 px-3.5 ${
                    googleConnected 
                      ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300" 
                      : "border-zinc-800 bg-zinc-950 text-white hover:bg-zinc-900"
                  }`}
                >
                  {googleConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="border-zinc-900" />

          {/* GitHub Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            <div className="flex items-center gap-2.5">
              <GitHubIcon />
              <div>
                <h3 className="text-xs font-semibold text-white">GitHub Account</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Use GitHub authentication.</p>
              </div>
            </div>
            
            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {githubConnected ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                      <Check className="w-3 h-3" />
                      Connected as
                    </div>
                    <span className="text-xs text-white font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 inline-block">
                      {githubIdentity?.userName || "GitHub User"}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 italic">No GitHub account linked.</span>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleToggleIdentity("github")}
                  className={`text-xs font-semibold h-8 px-3.5 ${
                    githubConnected 
                      ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300" 
                      : "border-zinc-800 bg-zinc-950 text-white hover:bg-zinc-900"
                  }`}
                >
                  {githubConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info box */}
        <div className="px-6 py-3.5 bg-zinc-900/30 border-t border-zinc-800 flex items-center gap-2 text-[10px] text-zinc-500">
          <Info className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Autentikasi sosial ditangani secara langsung oleh federasi identitas Keycloak Broker.</span>
        </div>
      </div>

      {/* 3. Connections & WhatsApp OTP (Supabase horizontal styled card) */}
      <div className="border border-zinc-800 bg-zinc-900/10 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">WhatsApp & 2-Step OTP Security</h2>
          <p className="text-[11px] text-zinc-400">Configure multi-factor authentication fallback using WhatsApp.</p>
        </div>

        <form onSubmit={handleSaveWhatsApp}>
          <div className="p-6 space-y-6">
            
            {/* Enable MFA Checkbox */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
              <div>
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Enable WhatsApp MFA</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Kirim kode keamanan ke nomor WhatsApp Anda setiap kali login dari perangkat baru.</p>
              </div>
              <div className="md:col-span-2 flex items-center h-full pt-1">
                <input
                  type="checkbox"
                  id="whatsAppEnabledCheck"
                  checked={whatsAppEnabled}
                  onChange={(e) => setWhatsAppEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 text-emerald-500 bg-zinc-950 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer"
                />
                <label htmlFor="whatsAppEnabledCheck" className="ml-2.5 text-xs text-zinc-300 cursor-pointer">
                  Aktifkan Verifikasi OTP WhatsApp
                </label>
              </div>
            </div>

            <Separator className="border-zinc-900" />

            {/* Phone Number Field */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
              <div>
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nomor WhatsApp</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Koneksikan nomor WhatsApp untuk menerima kode verifikasi.</p>
              </div>
              <div className="md:col-span-2">
                <Input
                  type="tel"
                  placeholder="e.g. 08123456789 atau 628123456789"
                  value={whatsAppNumber}
                  onChange={(e) => setWhatsAppNumber(e.target.value)}
                  className={`h-9 sm:max-w-xs bg-zinc-950/50 border-zinc-800 ${themeAccentBorder} text-xs text-white`}
                />
                <p className="text-[10px] text-zinc-550 mt-1.5">
                  Pastikan nomor memiliki format internasional (62) atau lokal (08) yang aktif.
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-zinc-900/30 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">WhatsApp OTP provides fallback verification when email is slow.</span>
            <Button
              type="submit"
              disabled={isSavingWa}
              className={`${themeAccentBg} text-white font-semibold text-xs h-8 px-4 flex items-center gap-1.5 transition-all shadow-md shadow-black/25`}
            >
              {isSavingWa ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Connection
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

    </div>
  );
}
