package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.config.tenant.LicenseCheck;
import com.company.ftthgis.service.TenantSsoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

/**
 * REST API Controller untuk manajemen Federasi Identitas SSO (Single Sign-On)
 * per-organisasi tenant.
 *
 * <p>Dilindungi oleh:
 * <ul>
 *   <li>Entitlement Gate: {@code @LicenseCheck(feature = "sso")}</li>
 *   <li>PBAC Policy: {@code security.sso.view} dan {@code security.sso.manage}</li>
 *   <li>Tenant Ownership Boundary: {@code @tenantSecurity.isOwner(#slug)}</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/organizations/{slug}/sso")
@LicenseCheck(feature = "sso")
@RequiredArgsConstructor
@Slf4j
public class TenantSsoController {

    private final TenantSsoService tenantSsoService;

    /**
     * Mengambil konfigurasi SSO organisasi tenant.
     */
    @GetMapping
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.sso.view') or hasAuthority('organizations.view'))")
    public ResponseEntity<TenantSsoConfigDto> getSsoConfig(@PathVariable String slug) {
        return tenantSsoService.getSsoConfig(slug)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Menyimpan atau memperbarui konfigurasi SSO tenant.
     */
    @PutMapping
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.sso.manage') or hasAuthority('organizations.update'))")
    public ResponseEntity<?> updateSsoConfig(
            @PathVariable String slug,
            @Valid @RequestBody UpdateTenantSsoConfigRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String actor = resolveActor(jwt);
            TenantSsoConfigDto updated = tenantSsoService.updateSsoConfig(slug, request, actor);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("⚠️ Validasi SSO gagal untuk org '{}': {}", slug, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Menghapus konfigurasi SSO tenant dan federasi IdP.
     */
    @DeleteMapping
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and hasAuthority('security.sso.manage')")
    public ResponseEntity<?> deleteSsoConfig(
            @PathVariable String slug,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String actor = resolveActor(jwt);
            tenantSsoService.deleteSsoConfig(slug, actor);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Konfigurasi SSO berhasil dihapus."
            ));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Melakukan Live Probe uji coba koneksi ke IdP Discovery / Metadata URL (Anti-Lockout).
     */
    @PostMapping("/test-probe")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and hasAuthority('security.sso.manage')")
    public ResponseEntity<TestSsoProbeResponse> testProbe(
            @PathVariable String slug,
            @Valid @RequestBody TestSsoProbeRequest request) {
        TestSsoProbeResponse response = tenantSsoService.testProbe(slug, request);
        return ResponseEntity.ok(response);
    }

    private String resolveActor(Jwt jwt) {
        if (jwt == null) {
            return "system";
        }
        String email = jwt.getClaimAsString("email");
        return (email != null && !email.isBlank()) ? email : jwt.getSubject();
    }
}

