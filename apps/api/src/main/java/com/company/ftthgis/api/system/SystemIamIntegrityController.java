package com.company.ftthgis.api.system;

import com.company.ftthgis.api.security.dto.IamIntegrityScanSummaryDto;
import com.company.ftthgis.config.security.RequireSudoMode;
import com.company.ftthgis.service.OrphanKeycloakReaperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Control Plane REST API untuk inspeksi integritas akun Keycloak <-> PostgreSQL
 * serta pembersihan akun yatim terkontrol dengan proteksi Sudo Mode (Fase 7.6 / ADR-0028).
 */
@RestController
@RequestMapping("/api/v1/system/security/iam-integrity")
@RequiredArgsConstructor
public class SystemIamIntegrityController {

    private final OrphanKeycloakReaperService orphanReaperService;

    @GetMapping("/scan")
    @PreAuthorize("hasAuthority('system.security.manage') or hasAuthority('system.audit.view')")
    public ResponseEntity<IamIntegrityScanSummaryDto> scanIntegrity(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(orphanReaperService.scanIntegrity(resolveActor(jwt)));
    }

    @PostMapping("/purge")
    @PreAuthorize("hasAuthority('system.security.manage')")
    @RequireSudoMode(action = "system.iam.orphan_purge")
    public ResponseEntity<IamIntegrityScanSummaryDto> purgeAllEligible(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(orphanReaperService.purgeEligibleOrphans(resolveActor(jwt), false));
    }

    @DeleteMapping("/orphans/{realm}/{keycloakUserId}")
    @PreAuthorize("hasAuthority('system.security.manage')")
    @RequireSudoMode(action = "system.iam.orphan_purge")
    public ResponseEntity<?> purgeSingleOrphan(
            @PathVariable String realm,
            @PathVariable String keycloakUserId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(orphanReaperService.purgeSingleOrphan(realm, keycloakUserId, resolveActor(jwt)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
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
