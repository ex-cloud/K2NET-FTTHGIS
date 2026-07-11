# Next.js Studio Frontend Coding Rules

Halaman ini mendefinisikan aturan dan pola wajib untuk pengembangan frontend Next.js (apps/studio).

---

## 🛡️ 1. Page Guards & Permission Checks

Setiap halaman baru di `/system` (portal utama) atau `/org` (portal tenant) **wajib** dilindungi oleh Page Guard pembungkus yang sesuai dari `src/components/page-guards/` sebelum merender komponen apa pun.

### Daftar Wrapper Sesuai Peruntukan
* **`/system/overview` dan `/system/health`**:
  Gunakan `SystemOverviewWrapper` atau `SystemHealthWrapper` (`permission="orgs.view"`).
* **`/system/gateways/...` dan `/system/settings`**:
  Gunakan `GatewayPageWrapper` atau `SystemSettingsWrapper` (`permission="orgs.manage"`).
* **`/system/users`**:
  Gunakan `UsersPageWrapper` (`permission="users.view"`).
* **`/system/security/...`**:
  Gunakan `SystemSecurityWrapper` (`permission="orgs.manage"`).

### Contoh Implementasi Page Guard
```tsx
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";

export default function MyNewPage() {
  return (
    <SystemHealthWrapper>
      <div className="p-6">
        {/* Konten Halaman */}
      </div>
    </SystemHealthWrapper>
  );
}
```

---

## 📋 2. Validasi Form & Zod

Semua form input konfigurasi wajib menggunakan **Zod** untuk validasi skema sebelum melakukan mutation atau API calls.
* Gunakan validasi **parsial** jika hanya menyimpan field yang diubah user (`schema.partial()`).
* Kembalikan pesan error berbahasa Indonesia yang jelas melalui `toast.error()` jika validasi gagal.
* Jangan biarkan input kosong atau format tidak valid lolos ke backend.

### Skema Validasi Standard
* **Database URL**:
  ```typescript
  z.string().url("Format URL database tidak valid").startsWith("postgres://", "Database harus berupa URL PostgreSQL (postgres://)")
  ```
* **Redis Address**:
  ```typescript
  z.string().regex(/^[^:]+:\d+$/, "Format Redis Address harus host:port")
  ```
* **Port**:
  ```typescript
  z.coerce.number().int().min(1).max(65535, "Port harus antara 1-65535")
  ```

---

## 🎨 3. Estetika UI & Styling

Aplikasi studio FTTH GIS menggunakan tema **sleek dark mode** bernuansa premium:
* Gunakan background gelap (`bg-[#080808]` atau `bg-zinc-950`).
* Gunakan border tipis semi-transparan (`border-white/5` atau `border-white/8`).
* Gunakan warna aksen hijau zamrud/emerald (`text-emerald-500`, `bg-emerald-500/10`) untuk indikator aktif/sukses.
* Gunakan warna biru langit/sky (`text-sky-400`) untuk data grafik/line charts.
* Elemen interaktif harus memiliki micro-animations (hover transitions, pulsing dot indicator `animate-pulse` untuk status active).
* Gunakan ikon dari `lucide-react`.

---

## 💬 4. Notifikasi & Toast

* Gunakan `sonner` (`toast.success`, `toast.error`, `toast.info`) untuk feedback operasi.
* Jangan gunakan browser `alert()` atau console error mentah tanpa informasi di UI.
