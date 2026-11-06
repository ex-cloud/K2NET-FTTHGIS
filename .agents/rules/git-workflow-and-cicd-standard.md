# 🛡️ Git Workflow, Pre-Flight Check & CI/CD Security Standard

> **Status Aturan**: WAJIB & SELALU AKTIF (`Always-On Rule`)  
> **Ruang Lingkup**: Seluruh AI Agent (Antigravity, Cursor, Windsurf, Claude Code) & Pengembang

---

## 🎯 1. Prinsip Utama: Pre-Flight Check Sebelum Bekerja

Setiap kali AI Agent memulai giliran kerja, sesi baru, atau melanjutkan fase berikutnya pada suatu plan, **AI Agent WAJIB menjalankan pre-flight check terlebih dahulu**:

```bash
bash scripts/preflight-check.sh
```

### 📋 4 Pilar Verifikasi Pre-Flight:
1. **Git Working Tree (Lokal)**: Wajib memastikan tidak ada file *uncommitted*, *staged*, atau *untracked* yang tertinggal dari sesi sebelumnya tanpa disengaja (`git status --short`).
2. **Sinkronisasi Remote (`origin/main`)**: Wajib memastikan commit lokal selaras penuh dengan GitHub. Jika ada commit lokal yang belum di-push (`ahead`), dorong dulu (`git push origin main`). Jika remote lebih baru (`behind`), tarik dulu (`git pull origin main`).
3. **Pipeline CI/CD GitHub Actions & GHCR**: Periksa status build runner di GitHub Actions (`https://github.com/ex-cloud/K2NET-FTTHGIS/actions`). Jangan menimpa push baru jika pipeline sebelumnya masih dalam status kritis/gagal.
4. **Kesehatan 24 Container Docker Live**: Pastikan seluruh gelombang layanan beroperasi (Wave 1 DB/Storage, Wave 2 Proxy/IAM, Wave 3 Backend/Auth, Wave 4 Frontends/12 Gateways). Jika ada gateway mati, jalankan `bash scripts/staged-startup.sh start`.

---

## 🔒 2. Direktori Terlarang di GitHub Publik (Anti-Leakage)

Repository GitHub bersifat **Publik** (`ex-cloud/K2NET-FTTHGIS`). Seluruh direktori berikut **DILARANG KERAS** masuk ke dalam indeks Git maupun GitHub:

| Direktori / File | Alasan Larangan | Penanganan |
|---|---|---|
| `/scripts/` | Berisi script operasional server, script backup, token admin, IP internal, dan kredensial SSH/DB | Ada di `.gitignore` & untracked (`git rm -r --cached scripts/`) |
| `/keycloak-themes/` | Template autentikasi proprietary internal FTTH GIS | Ada di `.gitignore` & untracked (`git rm -r --cached keycloak-themes/`) |
| `/docs/` | Dokumentasi internal, catatan arsitektur, data kredensial pengujian | Ada di `.gitignore` |
| `/knowledge-base/` | Basis pengetahuan lokal, transcript AI, embedding RAG | Ada di `.gitignore` |
| `/backups/` & `minio_data/` | Dump database Postgres, Keycloak DB, dan asset S3 | Ada di `.gitignore` |
| `.env` & `.env.*` | Kredensial rahasia, JWT secret, database password | Ada di `.gitignore` (hanya `.env.example` yang diizinkan) |

> 🛑 **PENTING**: Menambahkan folder ke `.gitignore` **tidak otomatis menghapus file yang sudah terlanjur di-track**. Jika sebuah file/folder pernah ter-commit, jalankan `git rm -r --cached <folder>` agar file terhapus dari remote GitHub tetapi tetap aman berada di filesystem lokal server.

---

## 🚀 3. Protokol Post-Push Verification

Setelah menyelesaikan tugas dan menjalankan Quality Gate:
1. **Commit Hanya File Terkait**:
   ```bash
   git add <file_yang_diubah>
   git commit -m "<tipe>(<scope>): <pesan terstruktur>"
   ```
2. **Push ke Remote**:
   ```bash
   git push origin main
   ```
3. **Verifikasi Pasca-Push**:
   Jalankan `git status -sb` untuk memastikan:
   `## main...origin/main` (tanpa ada `[ahead N]`).
4. **Catat Commit Hash di Plan**:
   Cantumkan commit SHA (misal `02380d86`) pada berkas plan aktif sebagai bukti kepatuhan audit trail SDLC.


---

## 🤝 4. Protokol Koordinasi Multi-Agent Otomatis (Wajib)

Berlaku untuk semua agent (Antigravity, Cursor, Claude Code, Copilot, CLI) di semua perangkat. Rujukan: `docs/plans/SOP-KOLABORASI-MULTI-AGENT.md`.

### 4.1. Awal Sesi / Awal Perintah Kerja (sebelum menyentuh berkas apa pun)
```bash
bash scripts/preflight-check.sh                  # kondisi lokal, remote, CI/CD, container
python3 scripts/agent-collab.py who-is-working   # lock plan, commit terakhir, working tree, dokumen terbaru, activity log
bash scripts/check-cicd-status.sh                # status GitHub Actions live
```
- Plan berstatus `[LOCKED]` oleh agent lain → **DILARANG** mengedit domain plan tersebut. Pilih tugas lain atau minta `handoff`.
- Working tree kotor yang bukan milik Anda → hentikan dan konfirmasi ke pengguna.
- Pipeline CI/CD `in_progress` → **DILARANG** menjalankan `scripts/deploy.sh` manual (bentrok dengan runner SSH). Tunggu sampai `completed`.

### 4.2. Saat Mulai Mengerjakan
```bash
python3 scripts/agent-collab.py lock <plan> --agent "<Agent>" --device "<Device>"
python3 scripts/agent-collab.py reserve-flyway --name "<nama>" --agent "<Agent>"   # jika butuh migrasi baru
```
`lock`, `unlock`, `claim`, `handoff`, dan `log` otomatis menulis jejak ke `docs/plans/ACTIVITY-LOG.md` (append-only; dilarang mengedit baris lama).

### 4.3. Saat Plan Selesai (setelah Quality Gate PASS)
```bash
python3 scripts/agent-collab.py doc-eval [--base <git-ref>]
```
Output `doc-eval` bersifat menentukan — ikuti levelnya:

| Level | Arti | Tindakan |
|---|---|---|
| `WAJIB` | Dokumen harus dibuat/diubah | Selesaikan sebelum plan dipindah ke `completed/` |
| `CEK` | Perlu penilaian agent | Putuskan dan catat alasan di laporan akhir |
| `LEWATI` | Tidak relevan | Tidak ada aksi |

Matriks pemicu: migrasi Flyway/domain/layanan baru → ADR + registri sumber daya; event/pubsub → `specs/events`; alert rule → `runbooks`; berkas keamanan inti → `security`; RFC belum final → ubah ke `Implemented`; versi `pom.xml` berubah → `releases`; setiap plan → `reports`. `docs/qa` hanya berubah jika jenis pengujian baru disepakati.

### 4.4. Penutupan & Serah Terima
1. Pindahkan plan ke `docs/plans/completed/`, terbitkan `docs/reports/YYYY-MM-DD-<slug>.md`, jalankan `pnpm audit:adr`.
2. Perbarui `docs/specs/registry-alokasi-sumber-daya.md` (Flyway → `Terpakai di DB`, lock → `COMPLETED & ARCHIVED`).
3. Catat: `python3 scripts/agent-collab.py log --action done --agent "<Agent>" --target "<plan>" --note "<commit sha>"`.
4. Belum tuntas → `python3 scripts/agent-collab.py handoff <plan> --to "<Agent>" --task "<tugas>"`; agent penerima menjalankan `claim`.

> `docs/` tidak ter-track git publik (anti-leakage), sehingga sinkronisasi dokumen antar-perangkat dilakukan lewat salinan server/backup, bukan `git pull`. Karena itu `ACTIVITY-LOG.md` dan papan registri adalah sumber kebenaran tunggal status kerja.

### 4.5. Aturan Diskusi (Pencatatan di `docs/discussions/`)

Riwayat chat tidak terbaca agent lain atau perangkat lain. Kesimpulan diskusi penting wajib dituliskan ke berkas.

**Pemicu eksplisit (A)** — jika pengguna menulis frasa seperti *"ini diskusi"*, *"catat di discussions"*, atau *"buka diskusi"*, agent WAJIB langsung membuat berkas:
```bash
python3 scripts/agent-collab.py new-discussion --title "<judul>" --agent "<Agent>"
```
lalu mengisi opsi, tradeoff, dan rekomendasi sesuai `docs/discussions/TEMPLATE.md`.

**Pemicu otomatis (B)** — tanpa diminta, agent WAJIB membuat berkas diskusi jika percakapan memenuhi KEDUANYA:
1. Menyangkut salah satu: arsitektur, skema DB/Flyway, keamanan/PBAC, kontrak API/event, atau pilihan teknologi; dan
2. Menghasilkan pilihan di antara ≥2 opsi, atau keputusan yang akan memengaruhi plan/ADR.

**Tidak perlu dicatat:** tanya jawab ringan, penjelasan kode, debugging rutin, dan pertanyaan operasional sekali pakai.

Jika ragu apakah suatu percakapan memenuhi ambang, agent bertanya singkat: *"Catat sebagai diskusi di docs/discussions/?"* — bukan menebak.

**Siklus:**
1. Berkas diskusi dibuat di `docs/discussions/active/`; keputusan akhir tetap di tangan pengguna (Human Architect).
2. Setelah konsensus: `python3 scripts/agent-collab.py resolve-discussion <nama> --link "<plan atau ADR hasilnya>" --agent "<Agent>"`.
3. Hasil diturunkan ke `docs/rfc/` (proposal), `docs/adr/` (keputusan mengikat), atau `docs/plans/active/` (eksekusi). Dilarang memodifikasi kode produksi sebelum konsensus tercatat.
4. Awal sesi: `who-is-working` / `status` menampilkan diskusi aktif; agent wajib membacanya sebelum mengusulkan arah baru pada topik yang sama.
