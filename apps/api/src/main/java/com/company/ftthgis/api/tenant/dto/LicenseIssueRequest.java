package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Permintaan penerbitan lisensi resmi baru atau kontrak B2B khusus oleh Super Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseIssueRequest {

    @NotNull(message = "Organization ID wajib diisi")
    private UUID organizationId;

    @NotBlank(message = "Nama tier plan wajib diisi (STARTER, PRO, ENTERPRISE)")
    private String planName;

    @Builder.Default
    @Min(value = 1, message = "Durasi lisensi minimal 1 bulan")
    private int durationMonths = 12;

    @Builder.Default
    private String activationType = "ONLINE"; // ONLINE, OFFLINE_KEY, ENTERPRISE_PO

    // ── Custom Quota Overrides (Opsional untuk Kontrak B2B Khusus) ───────────
    private Integer overrideMaxProjects;
    private Integer overrideMaxOdps;
    private Integer overrideMaxOdcs;
    private Integer overrideMaxCustomers;
    private Integer overrideMaxStorageGb;

    // ── Feature Flags ────────────────────────────────────────────────────────
    private Boolean featureSsoEnabled;
    private Boolean featureApiEnabled;
    private Boolean featureAiCopilotEnabled;
    private Boolean featureCustomDomainEnabled;

    // ── Hardware Binding (Khusus instalasi offline intranet) ────────────────
    private String machineFingerprint;

    private String notes;
}
