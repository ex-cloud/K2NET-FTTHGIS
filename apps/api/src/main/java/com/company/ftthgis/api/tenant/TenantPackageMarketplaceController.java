package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.OrderPackageRequest;
import com.company.ftthgis.api.tenant.dto.OrderPackageResponseDto;
import com.company.ftthgis.api.tenant.dto.PackageResponseDto;
import com.company.ftthgis.api.tenant.dto.TenantPackageSubscriptionDto;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.TenantPackageSubscriptionService;
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
 * REST Controller Self-Service Marketplace Add-on untuk Portal Tenant ISP.
 *
 * <p>Mendukung:
 * <ul>
 *   <li>Katalog marketplace dengan status kelayakan 3-lapis dinamis (Kondisi A, B, C)</li>
 *   <li>Pemeriksaan daftar paket add-on aktif organisasi</li>
 *   <li>Pembelian mandiri paket add-on dengan kalkulasi pro-rata co-termed dan dukungan auto-bundle</li>
 *   <li>Pembatalan perpanjangan otomatis (auto-renew)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/tenant/packages")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TenantPackageMarketplaceController {

    private final TenantPackageSubscriptionService subscriptionService;
    private final UserRepository userRepository;

    /**
     * Mengambil katalog paket marketplace lengkap dengan status kelayakan dinamis tenant pemanggil.
     */
    @GetMapping("/marketplace")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('billing.packages.view') or hasAuthority('billing.packages.view') or @tenantSecurity.hasEffectivePermission('billing.view') or hasAuthority('billing.view')")
    public ResponseEntity<List<PackageResponseDto>> getMarketplaceCatalog() {
        UUID orgId = resolveCurrentOrganizationId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organisasi tenant tidak ditemukan pada sesi otentikasi.");
        }
        return ResponseEntity.ok(subscriptionService.getMarketplaceCatalog(orgId));
    }

    /**
     * Mengambil seluruh langganan paket add-on aktif milik organisasi tenant pemanggil.
     */
    @GetMapping("/subscriptions")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('billing.packages.view') or hasAuthority('billing.packages.view') or @tenantSecurity.hasEffectivePermission('billing.view') or hasAuthority('billing.view')")
    public ResponseEntity<List<TenantPackageSubscriptionDto>> getActiveSubscriptions() {
        UUID orgId = resolveCurrentOrganizationId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organisasi tenant tidak ditemukan pada sesi otentikasi.");
        }
        return ResponseEntity.ok(subscriptionService.getActiveSubscriptions(orgId));
    }

    /**
     * Melakukan pemesanan paket add-on (dengan opsi auto-bundle jika prasyarat belum dimiliki).
     */
    @PostMapping("/order")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('billing.packages.subscribe') or hasAuthority('billing.packages.subscribe') or @tenantSecurity.hasEffectivePermission('billing.manage') or hasAuthority('billing.manage')")
    public ResponseEntity<OrderPackageResponseDto> orderPackage(@Valid @RequestBody OrderPackageRequest request) {
        UUID orgId = resolveCurrentOrganizationId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organisasi tenant tidak ditemukan pada sesi otentikasi.");
        }
        String callerUser = resolveCurrentUserIdentifier();
        return ResponseEntity.ok(subscriptionService.orderPackage(orgId, request, callerUser));
    }

    /**
     * Membatalkan perpanjangan otomatis (auto-renew) untuk paket add-on tertentu.
     */
    @PostMapping("/subscriptions/{id}/cancel-renew")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('billing.packages.subscribe') or hasAuthority('billing.packages.subscribe') or @tenantSecurity.hasEffectivePermission('billing.manage') or hasAuthority('billing.manage')")
    public ResponseEntity<TenantPackageSubscriptionDto> cancelAutoRenew(@PathVariable UUID id) {
        UUID orgId = resolveCurrentOrganizationId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organisasi tenant tidak ditemukan pada sesi otentikasi.");
        }
        return ResponseEntity.ok(subscriptionService.cancelAutoRenew(id, orgId));
    }

    private UUID resolveCurrentOrganizationId() {
        UUID contextOrgId = OrganizationContext.getOrganizationId();
        if (contextOrgId != null) return contextOrgId;

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
}
