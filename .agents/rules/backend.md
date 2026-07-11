# Spring Boot Backend Coding Rules

Halaman ini mendefinisikan aturan dan pola wajib untuk pengembangan Spring Boot backend (apps/api).

---

## 🔒 1. Autorisasi & Keamanan (Spring Security)

* Gunakan `@PreAuthorize("isAuthenticated()")` daripada `hasRole('authenticated')` untuk menegakkan status otentikasi Keycloak secara konsisten tanpa tergantung pemetaan role kustom.
* Selalu validasi data yang dikirim dengan scope tenant ID yang diperoleh dari header `X-Tenant-ID` yang diteruskan oleh Kong.

---

## 💾 2. Struktur Database & Model

* Gunakan database `ftth_gis` untuk menyimpan data utama.
* Gunakan tipe data Spasial (PostGIS) untuk entitas yang merepresentasikan koordinat geografis atau jalur kabel.
* Naming convention tabel menggunakan huruf kecil plural snake_case (contoh: `users`, `roles`, `role_permissions`).
* Gunakan Hibernate/JPA auditing (`@CreatedDate`, `@LastModifiedDate`) untuk pencatatan timestamp otomatis pada model.
