# Global UI Style & Theme Consistency Rules

Halaman ini mendefinisikan aturan wajib untuk menjaga keseragaman visual (style warna, card, button, typografi, dsb.) antara **Portal Utama (System)** dan **Portal Tenant (Organization/Dashboard)**.

---

## 🎨 1. Sistem Warna Global (Tailwind v4 & CSS Variables)

Aplikasi ini menggunakan tema **Dark Mode by default (Supabase Style)** yang diatur oleh CSS Variables di [`globals.css`](file:///opt/project5/apps/studio/src/app/globals.css):

| Token UI | HSL Value | Deskripsi | Class Tailwind |
|---|---|---|---|
| `--background` | `0 0% 11%` | Latar belakang halaman | `bg-background` (#1c1c1c) |
| `--card` | `0 0% 11%` | Latar belakang kartu/kontainer | `bg-card` |
| `--border` | `0 0% 18%` | Warna garis batas tipis | `border-border` (#2e2e2e) |
| `--muted` | `240 5% 64.9%`| Teks deskripsi / sekunder | `text-muted-foreground` |
| `--sidebar-background`| `0 0% 9%` | Background panel samping | `bg-sidebar` (#171717) |

---

## 📦 2. Panduan Desain Komponen (Component Styling)

Untuk menjaga keseragaman total, semua komponen baru harus mengikuti struktur visual berikut:

### A. Kartu & Panel (Cards)
* **Warna & Border**: Gunakan background gelap transparan dengan border putih transparan tipis.
  * *Class*: `bg-white/3 border-white/8 backdrop-blur-xl` atau `bg-card border-border`.
* **Radius Sudut (Rounded)**: Selalu gunakan `rounded-xl` (12px) atau `rounded-2xl` (16px) untuk card besar.
* **Pulsing Dot**: Untuk indikator status ONLINE, gunakan dot kecil dengan pulse:
  * *Class*: `h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse`

### B. Tombol & Badge (Buttons & Badges)
* **Tombol Aksi**: Gunakan variant `outline` dengan warna teks muted untuk aksi sekunder, dan variant `default` untuk aksi utama.
  * *Class*: `Button variant="outline" className="border-white/10 hover:border-white/20 text-white/70 hover:text-white"`
* **Badge Status**:
  * **ONLINE / Operational**: `bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px]`
  * **OFFLINE / Alert**: `bg-rose-500/15 text-rose-400 border-rose-500/30 text-[11px]`
  * **WARNING / Pending**: `bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px]`

### C. Tipografi (Typography)
* **Header Halaman (H1)**: Gunakan font tipis/light dengan tracking ketat.
  * *Class*: `text-3xl font-light text-zinc-100 tracking-tight`
* **Sub-header / Card Title**: Gunakan semibold/medium berukuran kecil.
  * *Class*: `text-sm font-medium text-white/80`
* **Deskripsi / Info**: Gunakan ukuran ekstra kecil berwarna abu-abu.
  * *Class*: `text-xs text-zinc-500` atau `text-white/40`

---

## 🏛️ 3. Perbedaan Portal Utama vs Portal Tenant

Meskipun menggunakan tema global yang sama, terdapat aksen visual yang membedakan lingkup kerja user:

### A. Portal Utama (System / Admin Platform Control)
* **Tujuan**: Mengelola organisasi, kesehatan server global, dan database.
* **Aksen Warna**: Dominan **Hijau Emerald (`emerald`)** untuk melambangkan stabilitas operasional.
* **Background Utama**: `bg-[#080808] px-8 pt-16` (untuk layout kontrol admin).

### B. Portal Tenant (Operational Dashboard)
* **Tujuan**: Monitoring perangkat FTTH pelanggan, peta spasial, dan billing tenant.
* **Aksen Warna**: Dominan **Biru Langit (`sky`)** atau **Violet (`violet`)** untuk membedakan ruang operasional kerja tenant.
* **Background Utama**: Sesuai dengan tema standard `bg-background` (#1c1c1c).
