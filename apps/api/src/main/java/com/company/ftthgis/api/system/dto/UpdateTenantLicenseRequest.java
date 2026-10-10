package com.company.ftthgis.api.system.dto;

import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Permintaan pembaruan detail lisensi spesifik organisasi tenant oleh Super Admin.
 * Mendukung kustomisasi kuota overrides, masa aktif/grace, hardware fingerprint,
 * feature entitlements, dan kontak penagihan.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTenantLicenseRequest {

    private LicenseStatus status;

    private LocalDateTime validUntil;

    private LocalDateTime gracePeriodUntil;

    // Custom Quota Overrides
    private Integer overrideMaxProjects;

    private Integer overrideMaxOdps;

    private Integer overrideMaxOdcs;

    private Integer overrideMaxCustomers;

    private Integer overrideMaxStorageGb;

    // Feature Entitlements
    private Boolean featureSsoEnabled;

    private Boolean featureApiEnabled;

    private Boolean featureAiCopilotEnabled;

    private Boolean featureCustomDomainEnabled;

    // Hardware Binding
    private String machineFingerprint;

    // Billing Contacts
    private String billingContactName;

    private String billingContactEmail;

    private String billingContactPhone;

    private Boolean notifyEmailEnabled;

    private Boolean notifyWhatsappEnabled;

    private String notes;
}
