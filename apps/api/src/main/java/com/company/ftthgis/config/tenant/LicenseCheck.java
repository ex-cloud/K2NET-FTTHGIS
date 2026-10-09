package com.company.ftthgis.config.tenant;

import java.lang.annotation.*;

/**
 * Anotasi penegakan lisensi runtime K2NET FTTH GIS.
 *
 * <p>Diletakkan pada class Controller atau method handler.
 * AOP Aspect {@link LicenseEnforcementAspect} akan mencegat pemanggilan dan memastikan
 * lisensi organisasi pemanggil tidak berada dalam status {@code RESTRICTED_READ_ONLY},
 * {@code SUSPENDED}, atau {@code REVOKED} saat mengeksekusi mutasi data fisik.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface LicenseCheck {

    /**
     * Jika {@code true}, operasi baca (GET, HEAD, OPTIONS) tetap diizinkan
     * meskipun lisensi berstatus RESTRICTED_READ_ONLY.
     */
    boolean allowReadOnlyQueries() default true;

    /**
     * Pesan kesalahan kustom saat mutasi dicegat.
     */
    String message() default "Lisensi organisasi Anda dalam mode Hanya-Baca (Read-Only) karena keterlambatan penagihan.";
}
