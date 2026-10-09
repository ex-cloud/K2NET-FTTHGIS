package com.company.ftthgis.domain.tenant.entity;

/**
 * Status siklus hidup lisensi runtime tenant pada platform K2NET FTTH GIS.
 *
 * <p>Transisi status:
 * <ul>
 *   <li>ACTIVE: Lisensi sah dan beroperasi penuh (mutasi & query GIS diizinkan).</li>
 *   <li>GRACE_PERIOD: Pembayaran tagihan jatuh tempo, masa tenggang aktif (banner peringatan).</li>
 *   <li>RESTRICTED_READ_ONLY: Melewati masa tenggang, mutasi aset fisik diblokir AOP, hanya query diperbolehkan.</li>
 *   <li>SUSPENDED: Penangguhan total akses dashboard karena wanprestasi berat.</li>
 *   <li>REVOKED: Lisensi dicabut secara permanen oleh Super Admin.</li>
 * </ul>
 */
public enum LicenseStatus {
    ACTIVE,
    GRACE_PERIOD,
    RESTRICTED_READ_ONLY,
    SUSPENDED,
    REVOKED
}
