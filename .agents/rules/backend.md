# Spring Boot Backend Coding Rules

Halaman ini mendefinisikan aturan dan pola wajib untuk pengembangan Spring Boot backend (apps/api).

---

## 🔒 1. Autorisasi & Keamanan (Spring Security)

* **Granular RBAC & PreAuthorize**: Seluruh endpoint wajib dilindungi anotasi `@PreAuthorize` berbasis Role eksplisit atau Authority granular (`<module>.<action>`), contoh: `@PreAuthorize("hasRole('super_admin') or hasRole('ROLE_SUPER_ADMIN') or hasAuthority('system.quotas.manage')")` atau `@PreAuthorize("hasAuthority('network.view')")`. DILARANG menggunakan `hasRole('authenticated')` (karena bukan role resmi). Endpoint internal platform (scope `SYSTEM`) wajib membatasi akses hanya untuk peran administratif sistem, tidak boleh hanya menggunakan `isAuthenticated()` generik.
* Selalu validasi data yang dikirim dengan scope tenant ID yang diperoleh dari header `X-Tenant-ID` yang diteruskan oleh Kong.

---

## 💾 2. Struktur Database & Model

* Gunakan database `ftth_gis` untuk menyimpan data utama.
* Gunakan tipe data Spasial (PostGIS) untuk entitas yang merepresentasikan koordinat geografis atau jalur kabel.
* Naming convention tabel menggunakan huruf kecil plural snake_case (contoh: `users`, `roles`, `role_permissions`).
* Gunakan Hibernate/JPA auditing (`@CreatedDate`, `@LastModifiedDate`) untuk pencatatan timestamp otomatis pada model.

---

## 🗺️ 3. Penanganan Data Spasial & GIS (PostGIS)

* **Standardisasi SRID**: Seluruh data spasial (koordinat OLT/ODP, rute kabel LineString) wajib menggunakan sistem proyeksi **SRID 4326 (WGS 84)**.
* **Format API**: Response API untuk data koordinat wajib dikembalikan dalam format standar **GeoJSON** (Point untuk Node, LineString untuk Kabel) agar dapat langsung dibaca oleh Google Maps / HERE Maps SDK di frontend.
* **Spatial Query Guard**: Operasi query spasial yang berat (seperti pencarian ODP terdekat / *nearest neighbor*) wajib memanfaatkan spatial index (`GIST` index) di level database PostgreSQL untuk mencegah overload resource.

---

## 📊 4. Standardisasi Audit Logging & AOP

Pencatatan log pada tier backend Spring Boot wajib menggunakan metode **Aspect-Oriented Programming (AOP)** untuk pemisahan modul yang bersih:
* **Deklarasi `@AuditRequired`**: Modifikasi state data (create, update, delete) pada service layer wajib ditandai dengan annotation `@AuditRequired(action = "NAMA_AKSI", resourceType = "TIPE_RESOURCE")`. Gunakan ekspresi SpEL untuk ekstraksi parameter dinamis dari argumen method (seperti `#slug` atau `#id.toString()`).
* **Kompabilitas Transaksi & Non-Blocking**: Pengiriman log audit tidak boleh menggagalkan transaksi database utama. Jika aspect gagal menghubungi `gateway-audit`, error tersebut wajib ditangkap (try-catch) secara internal di dalam aspect dan tidak boleh dilempar ke client.
* **Keycloak Event Syncing**: Saat menyinkronkan event autentikasi dari Keycloak, controller wajib menyaring event duplikat menggunakan in-memory cache LRU (maksimal 1000 signature) untuk mencegah pengiriman log berulang ketika dashboard logs di-refresh.


