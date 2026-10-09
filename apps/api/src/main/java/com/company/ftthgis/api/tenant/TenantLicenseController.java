package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.BillingInvoiceResponseDto;
import com.company.ftthgis.api.tenant.dto.LicenseActivateRequest;
import com.company.ftthgis.api.tenant.dto.LicenseResponseDto;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.BillingInvoice;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.BillingInvoiceRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.LicenseManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller Self-Service Lisensi & Penagihan untuk Portal Tenant ISP.
 *
 * <p>Mendukung:
 * <ul>
 *   <li>Pemeriksaan status lisensi aktif, sisa waktu, dan utilisasi kuota perangkat</li>
 *   <li>Aktivasi mandiri kode lisensi kontrak offline oleh administrator tenant</li>
 *   <li>Pemeriksaan riwayat faktur tagihan resmi (Billing Invoices)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/tenant/license")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TenantLicenseController {

    private final LicenseManagementService licenseManagementService;
    private final BillingInvoiceRepository billingInvoiceRepository;
    private final UserRepository userRepository;

    /**
     * Mengambil detail lisensi aktif organisasi pemanggil untuk dasbor portal tenant.
     */
    @GetMapping("/current")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('billing.view') or hasAuthority('billing.view')")
    public ResponseEntity<LicenseResponseDto> getCurrentLicense() {
        UUID orgId = resolveCurrentOrganizationId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organisasi tenant tidak ditemukan pada sesi otentikasi.");
        }

        return licenseManagementService.getCurrentLicense(orgId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Mengaktivasi kunci lisensi mandiri oleh administrator tenant.
     */
    @PostMapping("/activate")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('billing.manage') or hasAuthority('billing.manage')")
    public ResponseEntity<LicenseResponseDto> activateLicense(@Valid @RequestBody LicenseActivateRequest request) {
        UUID orgId = resolveCurrentOrganizationId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organisasi tenant tidak ditemukan pada sesi otentikasi.");
        }

        String activatedBy = resolveCurrentUserIdentifier();
        log.info("🔑 ACTIVATION REQUEST: Tenant org '{}' is activating license key '{}' by '{}'",
                orgId, maskKey(request.getLicenseKey()), activatedBy);

        TenantLicense activated = licenseManagementService.activateLicenseKey(
                orgId,
                request.getLicenseKey(),
                request.getMachineFingerprint(),
                activatedBy
        );

        LicenseResponseDto response = licenseManagementService.getCurrentLicense(orgId)
                .orElseThrow(() -> new IllegalStateException("Lisensi berhasil diaktivasi tetapi gagal dimuat kembali."));

        return ResponseEntity.ok(response);
    }

    /**
     * Mengambil riwayat faktur tagihan resmi (Billing Invoices) organisasi pemanggil.
     */
    @GetMapping("/invoices")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('billing.view') or hasAuthority('billing.view')")
    public ResponseEntity<List<BillingInvoiceResponseDto>> getBillingInvoices() {
        UUID orgId = resolveCurrentOrganizationId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organisasi tenant tidak ditemukan pada sesi otentikasi.");
        }

        List<BillingInvoice> invoices = billingInvoiceRepository.findByOrganizationIdOrderByDueDateDesc(orgId);
        List<BillingInvoiceResponseDto> dtos = invoices.stream()
                .map(this::mapToInvoiceDto)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    // ── Internal Helpers ────────────────────────────────────────────────────

    private UUID resolveCurrentOrganizationId() {
        UUID orgId = OrganizationContext.getOrganizationId();
        if (orgId != null) {
            return orgId;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String orgIdClaim = jwt.getClaimAsString("organization_id");
            if (orgIdClaim == null) orgIdClaim = jwt.getClaimAsString("tenant_id");
            if (orgIdClaim != null) {
                try {
                    return UUID.fromString(orgIdClaim);
                } catch (IllegalArgumentException ignored) {}
            }

            String subject = jwt.getSubject();
            if (subject != null) {
                try {
                    return userRepository.findByIdWithOrganization(UUID.fromString(subject))
                            .map(u -> u.getOrganization() != null ? u.getOrganization().getId() : null)
                            .orElse(null);
                } catch (IllegalArgumentException ignored) {}
            }
        }
        return null;
    }

    private String resolveCurrentUserIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) return email;
            String preferredUsername = jwt.getClaimAsString("preferred_username");
            if (preferredUsername != null && !preferredUsername.isBlank()) return preferredUsername;
            String sub = jwt.getSubject();
            if (sub != null && !sub.isBlank()) return sub;
        }
        if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
            return auth.getName();
        }
        return "TENANT_ADMIN";
    }

    private BillingInvoiceResponseDto mapToInvoiceDto(BillingInvoice inv) {
        return BillingInvoiceResponseDto.builder()
                .id(inv.getId())
                .organizationId(inv.getOrganization() != null ? inv.getOrganization().getId() : null)
                .organizationName(inv.getOrganization() != null ? inv.getOrganization().getName() : null)
                .invoiceNumber(inv.getInvoiceNumber())
                .description(inv.getDescription())
                .amount(inv.getAmount())
                .currency(inv.getCurrency())
                .status(inv.getStatus())
                .dueDate(inv.getDueDate())
                .paidAt(inv.getPaidAt())
                .paymentMethod(inv.getPaymentMethod())
                .paymentChannel(inv.getPaymentChannel())
                .externalInvoiceUrl(inv.getExternalInvoiceUrl())
                .externalReferenceId(inv.getExternalReferenceId())
                .createdAt(inv.getCreatedAt())
                .build();
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 12) return "K2NET-****-****-****";
        String[] parts = key.split("-");
        if (parts.length == 4) {
            return parts[0] + "-" + parts[1] + "-****-" + parts[3];
        }
        return key.substring(0, 8) + "-****-" + key.substring(key.length() - 4);
    }
}
