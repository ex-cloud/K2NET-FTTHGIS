import React from "react";
import { Input } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Separator } from "@k2net/ui";
import { Loader2, Save } from "lucide-react";

interface ProfileSettingsCardProps {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  username: string;
  emailOptions: string[];
  secondaryEmail: string;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  themeAccentBg: string;
  themeAccentBorder: string;
}

export function ProfileSettingsCard({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  username,
  emailOptions,
  secondaryEmail,
  isSaving,
  onSubmit,
  themeAccentBg,
  themeAccentBorder,
}: ProfileSettingsCardProps) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/10 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Profile Settings</h2>
        <p className="text-[11px] text-zinc-400">Manage your basic profile information.</p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="p-6 space-y-6">
          {/* Full Name */}
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

          {/* Primary Email */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Primary Email</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Choose which email is used as primary identity.</p>
            </div>
            <div className="md:col-span-2">
              <select
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-9 w-full sm:max-w-xs bg-zinc-950/50 border border-zinc-800 rounded-md px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/30 ${themeAccentBorder} cursor-pointer`}
              >
                {emailOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-zinc-950 text-white text-xs">
                    {opt}
                  </option>
                ))}
              </select>
              {secondaryEmail && (
                <div className="mt-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950/20 max-w-sm">
                  <span className="text-[10px] text-primary uppercase tracking-wider block font-semibold">Secondary Email (Backup)</span>
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

          {/* Username */}
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

        {/* Footer */}
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
  );
}
