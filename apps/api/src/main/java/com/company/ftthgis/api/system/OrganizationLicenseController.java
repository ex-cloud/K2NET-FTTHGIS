package com.company.ftthgis.api.system;

import com.company.ftthgis.api.system.dto.LicenseExtendRequest;
import com.company.ftthgis.api.system.dto.LicenseOverviewKpiDto;
import com.company.ftthgis.api.system.dto.LicenseRevokeRequest;
import com.company.ftthgis.api.tenant.dto.LicenseIssueRequest;
import com.company.ftthgis.api.tenant.dto.LicenseResponseDto;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.service.LicenseManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller Platform Super Admin untuk Tata Kelola Lisensi Tenant & Kontrak B2B.
 *
 * <p>Mendukung:
 * <ul>
 *   <li>Agregasi metrik KPI lisensi seluruh platform</li>
 *   <li>Pemeriksaan daftar lisensi lintas tenant</li>
 *   <li>Penerbitan kontrak lisensi manual B2B dengan kustomisasi batas kuota (Overrides)</li>
 *   <li>Perpanjangan masa aktif (Extend) dan pencabutan darurat (Revoke Kill-Switch)</li>
 *   <li>Ekspor berkas sertifikat offline bertanda tangan digital (.lic) untuk instalasi intranet</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class OrganizationLicenseController {

    private final LicenseManagementService licenseManagementService;

    /**
     * Mengambil ringkasan metrik KPI lisensi lintas tenant untuk dasbor Super Admin.
     */
    @GetMapping("/licenses/overview")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage')")
    public ResponseEntity<LicenseOverviewKpiDto> getLicensesOverview() {
        return ResponseEntity.ok(licenseManagementService.getLicensesOverview());
    }

    /**
     * Mengambil seluruh daftar lisensi lintas organisasi untuk tabel lisensi admin.
     */
    @GetMapping("/licenses")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage')")
    public ResponseEntity<List<LicenseResponseDto>> getAllLicenses() {
        return ResponseEntity.ok(licenseManagementService.getAllLicenses());
    }

    /**
     * Mengambil riwayat seluruh lisensi milik satu organisasi tenant.
     */
    @GetMapping("/organizations/{orgId}/licenses")
    @PreAuthorize("hasAuthority('system.organizations.view') or hasAuthority('system.organizations.manage')")
    public ResponseEntity<List<LicenseResponseDto>> getLicensesByOrganization(@PathVariable UUID orgId) {
        return ResponseEntity.ok(licenseManagementService.getLicensesByOrganization(orgId));
    }

    /**
     * Menerbitkan lisensi kontrak B2B manual dengan batas kuota khusus (Overrides) oleh Super Admin.
     */
    @PostMapping("/organizations/{orgId}/licenses")
    @PreAuthorize("hasAuthority('system.organizations.manage')")
    public ResponseEntity<LicenseResponseDto> issueManualLicense(
            @PathVariable UUID orgId,
            @Valid @RequestBody LicenseIssueRequest request
    ) {
        String issuedBy = resolveCurrentUserIdentifier();
        log.info("🔑 SUPER ADMIN ACTION: Issuing manual license for org '{}' by '{}'", orgId, issuedBy);

        TenantLicense issued = licenseManagementService.issueManualLicenseWithOverrides(orgId, request, issuedBy);
        LicenseResponseDto dto = licenseManagementService.getLicenseById(issued.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Gagal memuat lisensi yang baru diterbitkan."));

        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Memperpanjang masa aktif lisensi tenant secara manual.
     */
    @PostMapping("/organizations/{orgId}/licenses/{licenseId}/extend")
    @PreAuthorize("hasAuthority('system.organizations.manage')")
    public ResponseEntity<LicenseResponseDto> extendLicense(
            @PathVariable UUID orgId,
            @PathVariable UUID licenseId,
            @Valid @RequestBody LicenseExtendRequest request
    ) {
        String extendedBy = resolveCurrentUserIdentifier();
        log.info("⏰ SUPER ADMIN ACTION: Extending license '{}' for org '{}' by {} months by '{}'",
                licenseId, orgId, request.getAdditionalMonths(), extendedBy);

        TenantLicense extended = licenseManagementService.extendLicense(licenseId, request.getAdditionalMonths(), extendedBy);
        LicenseResponseDto dto = licenseManagementService.getLicenseById(extended.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Gagal memuat lisensi yang diperpanjang."));

        return ResponseEntity.ok(dto);
    }

    /**
     * Mencabut lisensi tenant secara darurat (Emergency Kill-Switch).
     */
    @PostMapping("/organizations/{orgId}/licenses/{licenseId}/revoke")
    @PreAuthorize("hasAuthority('system.organizations.manage')")
    public ResponseEntity<Map<String, Object>> revokeLicense(
            @PathVariable UUID orgId,
            @PathVariable UUID licenseId,
            @Valid @RequestBody LicenseRevokeRequest request
    ) {
        String revokedBy = resolveCurrentUserIdentifier();
        log.warn("🚨 SUPER ADMIN ACTION: Revoking license '{}' for org '{}' by '{}'. Reason: {}",
                licenseId, orgId, revokedBy, request.getReason());

        licenseManagementService.revokeLicense(licenseId, request.getReason(), revokedBy);

        return ResponseEntity.ok(Map.of(
                "status", "REVOKED",
                "licenseId", licenseId,
                "organizationId", orgId,
                "reason", request.getReason(),
                "revokedBy", revokedBy
        ));
    }

    /**
     * Mengunduh berkas sertifikat offline bertanda tangan digital (.lic) untuk instalasi intranet/air-gapped.
     */
    @GetMapping("/organizations/{orgId}/licenses/{licenseId}/export-cert")
    @PreAuthorize("hasAuthority('system.organizations.manage')")
    public ResponseEntity<String> exportOfflineCertificate(
            @PathVariable UUID orgId,
            @PathVariable UUID licenseId
    ) {
        String certContent = licenseManagementService.exportOfflineCertificate(licenseId);
        String filename = "k2net-license-" + licenseId.toString().substring(0, 8) + ".lic";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(certContent);
    }

    // ── Internal Helpers ────────────────────────────────────────────────────

    private String resolveCurrentUserIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) return email;
            String preferredUsername = jwt.getClaimAsString("preferred_username");
            if (preferredUsername != null && !preferredUsername.isBlank()) return preferredUsername;
            return jwt.getSubject();
        }
        return auth != null ? auth.getName() : "SUPER_ADMIN";
    }
}
