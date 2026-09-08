import * as React from "react";
import { 
  Globe, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Info
} from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import { useAuth } from "@k2net/auth/client";
import { extractTenantSlug } from "../../lib/keycloak-config";

export function WorkspaceDomainSettings() {
  const { user, token } = useAuth();
  const currentSlug = extractTenantSlug();
  const [targetSlug, setTargetSlug] = React.useState("");
  const [isMigrating, setIsMigrating] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [migrationSuccess, setMigrationSuccess] = React.useState<{ newUrl: string; newSlug: string } | null>(null);
  const [countdown, setCountdown] = React.useState(5);

  // Determine tier from user roles or claims
  const isFreeTier = currentSlug.length === 20;
  const currentDomain = `${currentSlug}-gis.kdua.net`;

  const copyDomain = () => {
    navigator.clipboard.writeText(`https://${currentDomain}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInitiateMigration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = targetSlug.trim().toLowerCase();

    if (!cleaned) {
      setErrorMsg("Nama subdomain kustom tidak boleh kosong.");
      return;
    }

    if (cleaned === currentSlug) {
      setErrorMsg("Subdomain tujuan sama dengan subdomain aktif saat ini.");
      return;
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(cleaned) || cleaned.length < 3 || cleaned.length > 40) {
      setErrorMsg("Format subdomain tidak valid (harus 3-40 huruf/angka kecil dan tanpa tanda minus di awal/akhir).");
      return;
    }

    setShowConfirmModal(true);
  };

  const executeMigration = async () => {
    setIsMigrating(true);
    setErrorMsg(null);

    try {
      const orgId = user?.organizationId || user?.tenantId || currentSlug;
      const resp = await fetch(`/api/v1/organizations/${orgId}/migrate-slug`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ targetSlug: targetSlug.trim().toLowerCase() }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || `Migrasi gagal dengan status HTTP ${resp.status}`);
      }

      const result = await resp.json();
      setShowConfirmModal(false);
      setMigrationSuccess({
        newUrl: result.newUrl || `https://${targetSlug.trim().toLowerCase()}-gis.kdua.net`,
        newSlug: targetSlug.trim().toLowerCase(),
      });

      // Start countdown to redirect
      let count = 5;
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          window.location.href = result.newUrl || `https://${targetSlug.trim().toLowerCase()}-gis.kdua.net`;
        }
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses migrasi domain.");
      setShowConfirmModal(false);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Globe className="size-5 text-primary" />
          Pengaturan Domain & Identitas Workspace
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Kelola nama subdomain teknis dan routing gateway portal ISP mitra Anda.
        </p>
      </div>

      {/* Success Banner (During Redirect) */}
      {migrationSuccess && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-6 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <CheckCircle2 className="size-5" />
            Subdomain Workspace Berhasil Diperbarui!
          </div>
          <p className="text-xs text-muted-foreground">
            Alamat baru telah aktif secara instan. Mengalihkan Anda ke domain baru dalam <strong className="text-foreground font-mono">{countdown} detik</strong>...
          </p>
          <div className="pt-2">
            <a
              href={migrationSuccess.newUrl}
              className="inline-flex items-center gap-2 text-xs font-semibold font-mono text-primary hover:underline"
            >
              {migrationSuccess.newUrl} <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Active Domain Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subdomain Aktif Saat Ini</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold font-mono text-foreground">https://{currentDomain}</span>
              <button
                onClick={copyDomain}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                title="Salin URL"
              >
                {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentSlug.length === 20 ? (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[10px] flex items-center gap-1">
                <Lock className="size-2.5" /> FREE TIER (20-CHAR ALPHA HASH)
              </Badge>
            ) : (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] flex items-center gap-1">
                <Sparkles className="size-2.5" /> CUSTOM SUBDOMAIN PRO
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">SSL/TLS Terkelola Otomatis:</strong> Dilindungi sertifikat wildcard Cloudflare Edge & Traefik HTTPS Port 443.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Zero Session Disruption:</strong> Identitas teknis terisolasi pada <code className="text-primary font-mono">{currentSlug}</code> dengan perlindungan PBAC.
            </div>
          </div>
        </div>
      </div>

      {/* Free Tier Notice or Pro Migration Form */}
      {isFreeTier ? (
        <div className="rounded-xl border border-border bg-card/60 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
              <Lock className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Kustomisasi Subdomain Terkunci pada Paket Starter (Free)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pengguna paket evaluasi gratis memperoleh subdomain acak 20-karakter huruf murni untuk menjamin pendaftaran tanpa hambatan dan isolasi instan. Untuk menggunakan nama brand sendiri (contoh: <code className="text-primary font-mono font-bold">kircon-gis.kdua.net</code>), silakan lakukan upgrade ke paket <strong>Professional (PRO)</strong> atau <strong>Enterprise</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open("https://kdua.net/pricing", "_blank")}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5" />
              Upgrade ke Paket Pro
            </Button>
          </div>
        </div>
      ) : (
        /* PRO Tier Subdomain Customization / Migration Form */
        <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Ubah Subdomain Kustom Workspace (Controlled Migration)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Anda dapat memperbarui subdomain portal Anda ke nama baru yang mencerminkan identitas operasional ISP Anda.
            </p>
          </div>

          <form onSubmit={handleInitiateMigration} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subdomain Kustom Baru</label>
              <div className="flex items-center rounded-lg border border-border bg-muted/40 px-3 h-10 text-xs max-w-lg">
                <span className="text-muted-foreground font-mono">https://</span>
                <input
                  type="text"
                  value={targetSlug}
                  onChange={(e) => setTargetSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g. sukarajin-fiber"
                  className="flex-1 bg-transparent border-none outline-none px-1 text-primary font-mono font-bold placeholder:text-muted-foreground/50"
                />
                <span className="text-muted-foreground font-mono">-gis.kdua.net</span>
              </div>
              {errorMsg && (
                <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                  <AlertTriangle className="size-3.5" /> {errorMsg}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Gunakan 3-40 huruf kecil atau angka. Tanda hubung (-) diperbolehkan di tengah nama.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isMigrating || !targetSlug.trim()}
              size="sm"
              className="text-xs font-semibold"
            >
              Lanjutkan Pembaruan Subdomain
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </form>
        </div>
      )}

      {/* Controlled Migration Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl text-foreground">
            <div className="flex items-center gap-2.5 text-primary font-bold text-base">
              <Sparkles className="size-5 shrink-0" />
              Konfirmasi Pembaruan Subdomain Workspace
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                Anda akan mengubah domain workspace dari <strong className="text-foreground font-mono">https://{currentDomain}</strong> menjadi <strong className="text-primary font-mono">https://{targetSlug.trim().toLowerCase()}-gis.kdua.net</strong>.
              </p>

              <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-start gap-2 text-foreground font-semibold text-xs">
                  <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
                  Sesi Login & Data Operasional 100% Utuh
                </div>
                <p className="text-[11px] text-muted-foreground pl-6">
                  Perubahan URL tidak mengganggu sesi login pengguna yang sedang aktif. Semua data tiket, tugas lapangan, dan keanggotaan proyek tetap aman.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-start gap-2 text-foreground font-semibold text-xs">
                  <Globe className="size-4 text-primary shrink-0 mt-0.5" />
                  Pengalihan Otomatis Masa Tenggang
                </div>
                <p className="text-[11px] text-muted-foreground pl-6">
                  Tautan lama yang tersimpan pada bookmark browser atau riwayat pesan akan secara otomatis dialihkan ke subdomain baru.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={isMigrating}
                onClick={() => setShowConfirmModal(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={isMigrating}
                onClick={executeMigration}
                className="text-xs flex items-center gap-1.5"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Menyimpan Subdomain Baru...
                  </>
                ) : (
                  "Konfirmasi Perubahan Subdomain"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
