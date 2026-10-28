---
name: anti-slop-and-hygiene
description: >-
  Use this skill before committing/deploying, after major refactoring, or when the user
  asks to audit code quality, detect AI slop (dead files, unused exports, duplicate
  functions, high complexity), or clean up server RAM/Swap/Docker hygiene.
---

# SOP: Anti-AI-Slop Audit, Monorepo Quality Gate 5-Pilar & Server Hygiene

Gunakan skill ini setelah menyelesaikan refactoring atau sebelum melakukan `git commit` / deployment untuk memastikan **0% AI Slop** (tidak ada file yatim, export mati, duplikasi logika, atau kebocoran memori server).

## Referensi Lengkap
- [Matriks Standar Audit 5-Pilar per Service](./references/service-audit-standards.md)

---

## Alur Eksekusi Anti-AI-Slop & Quality Gate

### 1. Deteksi Dead Files, Unused Exports & Ghost Dependencies (`knip`)
Jalankan pemindaian `knip` di seluruh workspace monorepo untuk memastikan tidak ada komponen/hook lama yang tertinggal pasca-refactoring:
```bash
pnpm audit:slop
pnpm audit:deadcode
```
- Jika ditemukan file di `Unused files` yang memang sudah digantikan oleh implementasi baru, hapus file tersebut (`rm`) dan pastikan tidak ada broken import.

### 2. Deteksi Duplikasi Logika & Cognitive Complexity (`eslint-plugin-sonarjs`)
Jalankan ESLint strict mode (`--max-warnings 0`) yang telah dilengkapi `eslint-plugin-sonarjs` (`no-identical-functions`, `no-duplicated-branches`, `no-identical-conditions`, `max-lines`, `complexity`):
```bash
pnpm lint:strict
pnpm typecheck
```

### 3. Audit Desain, Warna Semantik, i18n, & Keamanan API
```bash
pnpm audit:colors
pnpm audit:design-system
pnpm audit:i18n
pnpm audit:versioning
```

### 4. Pembersihan Ghost Processes, Docker Cache & Swap Server (`scripts/cleanup.sh`)
Jika penggunaan RAM/Swap server meningkat atau setelah sesi kerja panjang:
```bash
bash /opt/project5/scripts/cleanup.sh --dry-run
# Jika perlu dieksekusi langsung:
bash /opt/project5/scripts/cleanup.sh
```
Script ini otomatis mematikan pohon proses IDE versi lama yang menggantung, membersihkan proses yatim (`PPID=1`) dari `tsserver`/MCP, dan me-flush swap container yang membengkak.

