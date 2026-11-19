# 📑 Standar Siklus Hidup Dokumen, Tiket Bug, Mandatory QA/UAT Gate & Implementation Plan (`docs/sop_sdlc/`)

Dokumen ini adalah aturan baku (*Hard Constraint*) bagi seluruh AI Agent dan Developer dalam mencatat temuan bug, merumuskan rencana implementasi, melakukan pengujian QA/UAT, dan mengarsipkan dokumen pekerjaan di repositori K2NET FTTH GIS.

---

## 🚫 Larangan Keras (Zero Chaos & Zero Premature Closure Policy)
1. **Dilarang Menulis di Luar `docs/sop_sdlc/`**: Seluruh 12 folder dokumen siklus hidup SDLC berada secara eksklusif di dalam `/opt/project5/docs/sop_sdlc/` agar terpisah bersih dari arsip historis lama di `/opt/project5/docs/`.
2. **Dilarang Mencampur Pengetahuan AI**: Folder `/opt/project5/knowledge-base/` murni dialokasikan untuk korpus RAG vektor AI Gateway dan **100% di-gitignore**.
3. **🛑 Dilarang Melompati Gerbang QA (`docs/sop_sdlc/qa/active/`)**: Setelah kode di-commit, di-push, dan selesai di-deploy melalui CI/CD, AI Agent **DILARANG KERAS langsung membuat laporan di `docs/sop_sdlc/reports/` atau memindahkan plan ke `docs/sop_sdlc/plans/completed/`!** Agent wajib terlebih dahulu membuat lembar uji di `docs/sop_sdlc/qa/active/YYYY-MM-DD-<slug>.md` dan menunggu verifikasi pengujian fungsional & UI/UX oleh pengguna.

---

## 🗂️ Struktur Direktori Baku `docs/sop_sdlc/`

```text
/opt/project5/docs/sop_sdlc/
├── adr/                               # Keputusan Arsitektur Resmi (0001-*.md .. NNNN-*.md + README.md)
├── bug/
│   ├── pending/                       # Tiket temuan bug/backlog yang belum aktif dikerjakan
│   ├── active/                        # Tiket bug yang sedang aktif dalam investigasi/remediasi
│   └── resolved/                      # Tiket bug yang telah tuntas, lulus QA/UAT & terverifikasi
├── discussions/
│   ├── active/                        # Ruang musyawarah & analisis opsi sebelum eksekusi kode
│   └── resolved/                      # Diskusi yang telah mencapai konsensus
├── plans/
│   ├── active/                        # Action plan yang sedang dikerjakan / sedang diuji di qa/active/
│   └── completed/                     # Action plan yang telah lulus QA/UAT pengguna & ditutup resmi
├── qa/
│   ├── active/                        # [GERBANG WAJIB] Lembar uji QA & UAT yang sedang diuji / menunggu validasi pengguna
│   ├── completed/                     # Lembar uji QA & UAT yang telah 100% lulus verifikasi kode & pengguna
│   ├── quality-gate-checklist.md      # Standar perintah Quality Gate per domain
│   └── TEMPLATE.md                    # Template wajib lembar uji QA & UAT
├── releases/                          # Catatan rilis SemVer (vX.Y.Z.md & CHANGELOG.md)
├── reports/                           # Laporan akhir formal (dibuat HANYA SETELAH qa/active/ lulus & pindah ke qa/completed/)
├── rfc/                               # Proposal desain fitur/modul baru berskala besar
├── runbooks/                          # SOP tanggap darurat operasional SRE/NOC
├── security/                          # Katalog kebijakan keamanan berjenjang
├── specs/                             # Kontrak OpenAPI, MIB, & registry-alokasi-sumber-daya.md
├── ui-ux/                             # Standar desain sistem, heuristik visual & anatomi kontrol
└── README.md                          # Peta utama arsitektur dokumentasi SDLC
```
