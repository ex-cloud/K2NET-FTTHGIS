"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ProfileSettingsCard } from "./components/profile-settings-card";
import { SocialIdentitiesCard } from "./components/social-identities-card";
import { WhatsAppMfaCard } from "./components/whatsapp-mfa-card";
import { PasswordSecurityCard } from "./components/password-security-card";

interface SocialIdentity {
  provider: string;
  userId: string;
  userName: string;
}

interface PasswordPolicy {
  minLength: number;
  requireSymbols: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  historyLimit: number;
  expiryDays: number;
}

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

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy | null>(null);

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
      
      const fetchPasswordPolicy = async () => {
        try {
          const res = await fetch("/api/v1/users/password-policy", {
            headers: {
              "Authorization": `Bearer ${session.accessToken}`
            }
          });
          if (res.ok) {
            const policy = await res.json();
            setPasswordPolicy(policy);
          }
        } catch (e) {
          console.error("Failed to load password policy:", e);
        }
      };

      fetchPasswordPolicy();

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

  // Save password handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    if (!currentPassword) {
      toast.error("Validation Error", {
        description: "Password saat ini wajib diisi."
      });
      return;
    }

    // Dynamic Policy checks
    const minLen = passwordPolicy?.minLength || 8;
    if (newPassword.length < minLen) {
      toast.error("Validation Error", {
        description: `Password baru harus minimal ${minLen} karakter.`
      });
      return;
    }

    if (passwordPolicy?.requireUppercase && !/[A-Z]/.test(newPassword)) {
      toast.error("Validation Error", {
        description: "Password baru harus mengandung setidaknya satu huruf besar (A-Z)."
      });
      return;
    }

    if (passwordPolicy?.requireNumbers && !/[0-9]/.test(newPassword)) {
      toast.error("Validation Error", {
        description: "Password baru harus mengandung setidaknya satu angka (0-9)."
      });
      return;
    }

    if (passwordPolicy?.requireSymbols && !/[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`\-]/.test(newPassword)) {
      toast.error("Validation Error", {
        description: "Password baru harus mengandung setidaknya satu karakter khusus/simbol."
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Validation Error", {
        description: "Konfirmasi password baru tidak cocok."
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/v1/users/me/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (res.ok) {
        toast.success("Password berhasil diubah!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        toast.error("Gagal mengubah password", {
          description: data.message || "Pastikan password saat ini sudah benar."
        });
      }
    } catch (e) {
      toast.error("Gagal mengubah password", {
        description: "Terjadi kesalahan jaringan."
      });
      console.error(e);
    } finally {
      setIsSavingPassword(false);
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

  // Derived state for components
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
  const themeAccentColor = subdomain === "system" ? "text-primary" : "text-primary";
  const themeAccentBg = subdomain === "system" ? "bg-primary hover:bg-primary/90" : "bg-primary hover:bg-primary/90";
  const themeAccentBorder = subdomain === "system" ? "focus:border-primary/50" : "focus:border-primary/50";

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className={`h-8 w-8 animate-spin ${themeAccentColor}`} />
        <p className="mt-4 text-xs font-medium">Memuat Preferensi Profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Preferences</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Manage your account profile, connections, and security settings.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Profile Information */}
      <ProfileSettingsCard
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        email={email}
        setEmail={setEmail}
        username={username}
        emailOptions={emailOptions}
        secondaryEmail={secondaryEmail}
        isSaving={isSaving}
        onSubmit={handleSaveProfile}
        themeAccentBg={themeAccentBg}
        themeAccentBorder={themeAccentBorder}
      />

      {/* 2. Social Accounts */}
      <SocialIdentitiesCard
        googleIdentity={googleIdentity}
        githubIdentity={githubIdentity}
        googleConnected={googleConnected}
        githubConnected={githubConnected}
        onToggleIdentity={handleToggleIdentity}
      />

      {/* 3. WhatsApp & MFA */}
      <WhatsAppMfaCard
        whatsAppNumber={whatsAppNumber}
        setWhatsAppNumber={setWhatsAppNumber}
        whatsAppEnabled={whatsAppEnabled}
        setWhatsAppEnabled={setWhatsAppEnabled}
        isSavingWa={isSavingWa}
        onSubmit={handleSaveWhatsApp}
        themeAccentBg={themeAccentBg}
        themeAccentBorder={themeAccentBorder}
      />

      {/* 4. Password Settings */}
      <PasswordSecurityCard
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        isSavingPassword={isSavingPassword}
        passwordPolicy={passwordPolicy}
        onSubmit={handleSavePassword}
        themeAccentBg={themeAccentBg}
        themeAccentBorder={themeAccentBorder}
        sessionUsername={session?.user?.username || session?.user?.email || ""}
      />

    </div>
  );
}
