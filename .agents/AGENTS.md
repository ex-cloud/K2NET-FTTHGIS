# FTTH GIS — K2NET Enterprise SaaS Platform Customization Context

Dokumen ini adalah repositori memori persisten dan aturan pengkodean untuk AI Agent yang bekerja pada proyek K2NET FTTH GIS. Aturan ini dimuat secara otomatis oleh sistem IDE untuk menjaga konsistensi pengerjaan.

---

## 🏗️ Gambaran Arsitektur Utama
- **Frontend Next.js**: [apps/studio](file:///opt/project5/apps/studio)
- **Backend Spring Boot**: [apps/api](file:///opt/project5/apps/api)
- **Go Microservices & Gateways**: [services/](file:///opt/project5/services/)
- **API Gateway**: Kong (Port 8000 / DB-less declarative)
- **Edge Reverse Proxy & SSL**: Traefik (Port 80/443)
- **Identity IAM**: Keycloak 26 (Port 8081)

---

## 🔒 Otentikasi & Super Admin (God Mode)
- Super Admin ditandai oleh role `"super_admin"` atau `"ROLE_SUPER_ADMIN"`.
- Logika otentikasi di client (`usePermissions`) dan backend **wajib** membypass semua pengecekan hak akses (return `true`) untuk Super Admin.

---

## 📋 Aturan Pengkodean per Bagian (Coding Rules)

Untuk menjaga kualitas dan standardisasi sistem, ikuti petunjuk teknis pada tautan berikut sebelum mulai melakukan modifikasi:

1. **Aturan Frontend (Next.js & UI)**: [rules/frontend.md](file:///opt/project5/.agents/rules/frontend.md)
   *Membahas: Page Guards wajib, skema validasi Zod, sonner notification, dark mode styling.*
   
2. **Aturan Backend (Spring Boot & DB)**: [rules/backend.md](file:///opt/project5/.agents/rules/backend.md)
   *Membahas: Spring Security PreAuthorize, Hibernate PostGIS audit, snake_case.*

3. **Aturan Microservices (Go & Infrastructure)**: [rules/microservices.md](file:///opt/project5/.agents/rules/microservices.md)
   *Membahas: Port map internal, X-Tenant-ID header, go.work workspace compilation.*

---

## 🧠 Pembelajaran Masalah Terselesaikan (Knowledge Base)
- **MinIO Connection**: Akses menggunakan Tailscale IP `100.110.205.109:9005`. Jangan gunakan `localhost:9005`.
- **Prometheus Port go-poller**: Port scrape yang benar untuk poller metrics adalah `ftth-poller:5010` (bukan 9091).
- **Traefik Proxy poller**: Routing `/poller` di Traefik dynamic service mengarah ke internal container `http://ftth-poller:5010` (bukan host.docker.internal).
