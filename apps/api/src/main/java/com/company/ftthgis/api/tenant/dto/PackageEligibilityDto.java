package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO status kelayakan pembelian paket berdasarkan Validasi 3 Lapis Bebas Bentrok.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageEligibilityDto {

    private boolean isEligible;

    /**
     * Kondisi respons visual:
     * READY (Kondisi A: Siap Beli)
     * PREREQUISITE_REQUIRED (Kondisi B: Butuh Paket Prasyarat / Auto-Bundle)
     * PLAN_UPGRADE_REQUIRED (Kondisi C: Tier Plan Belum Cukup)
     * LICENSE_UNHEALTHY (Kondisi C2: Lisensi Menunggak / Bukan ACTIVE)
     * ALREADY_ACTIVE (Paket sudah aktif pada tenant)
     */
    private String eligibilityState;

    private List<String> missingPrerequisites;

    private List<String> conflictActivePackages;

    private String minRequiredPlan;

    private String currentPlan;

    private String licenseStatus;

    private String message;
}
