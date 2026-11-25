package com.company.ftthgis.api.system;

import com.company.ftthgis.api.security.dto.SystemSsoHealthSummaryDto;
import com.company.ftthgis.service.SsoIdpHealthProbeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Control Plane REST API untuk pemantauan proaktif kesehatan Endpoint IdP &
 * masa berlaku sertifikat SSO (TLS / SAML / Secret) seluruh tenant Enterprise.
 */
@RestController
@RequestMapping("/api/v1/system/security/sso-health")
@RequiredArgsConstructor
public class SystemSsoHealthController {

    private final SsoIdpHealthProbeService healthProbeService;

    @GetMapping
    @PreAuthorize("hasAuthority('system.security.manage') or hasAuthority('system.security.sso.manage') or hasAuthority('system.security.policy.view') or hasAuthority('system.audit.view')")
    public ResponseEntity<List<SystemSsoHealthSummaryDto>> listAllSsoHealth() {
        return ResponseEntity.ok(healthProbeService.listAllTenantSsoHealth());
    }

    @PostMapping("/run-probe")
    @PreAuthorize("hasAuthority('system.security.manage') or hasAuthority('system.security.sso.manage')")
    public ResponseEntity<List<SystemSsoHealthSummaryDto>> runAllProbes(@AuthenticationPrincipal Jwt jwt) {
        String actor = resolveActor(jwt);
        return ResponseEntity.ok(healthProbeService.runProbeAllActive(actor));
    }

    @PostMapping("/{configId}/probe")
    @PreAuthorize("hasAuthority('system.security.manage') or hasAuthority('system.security.sso.manage')")
    public ResponseEntity<SystemSsoHealthSummaryDto> runSingleProbe(
            @PathVariable UUID configId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String actor = resolveActor(jwt);
            return ResponseEntity.ok(healthProbeService.runProbeByConfigId(configId, actor));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String resolveActor(Jwt jwt) {
        if (jwt == null) {
            return "super_admin";
        }
        String email = jwt.getClaimAsString("email");
        return (email != null && !email.isBlank()) ? email : jwt.getSubject();
    }
}
