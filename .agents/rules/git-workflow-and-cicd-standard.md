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
