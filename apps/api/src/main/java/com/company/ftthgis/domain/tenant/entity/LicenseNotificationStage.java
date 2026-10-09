package com.company.ftthgis.domain.tenant.entity;

/**
 * Tahapan pengingat notifikasi siklus hidup lisensi tenant (Proactive Multi-Channel Reminder).
 */
public enum LicenseNotificationStage {
    NONE,
    EXPIRING_7D,       // H-7 Sebelum jatuh tempo lisensi
    EXPIRING_3D,       // H-3 Sebelum jatuh tempo lisensi
    GRACE_PERIOD,      // H+0 Memasuki 7 hari masa tenggang (Grace Period)
    READ_ONLY_LOCKED,  // H+7 Masa tenggang habis, akses dikunci ke mode Read-Only
    SUSPENDED,         // H+30 Penonaktifan total organisasi tenant
    MANUAL_REMINDER    // Pengingat manual darurat yang dipicu oleh Super Admin
}
