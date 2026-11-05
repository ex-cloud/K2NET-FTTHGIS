package com.company.ftthgis.api.auth;

import com.company.ftthgis.api.auth.dto.SsoDiscoveryResponse;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.service.TenantSsoService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthDiscoveryController {

    private final OrganizationRepository organizationRepository;
    private final TenantSsoService tenantSsoService;

    @Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String defaultRealm;

    @GetMapping("/discovery/{slug}")
    public ResponseEntity<DiscoveryResponse> discover(@PathVariable String slug) {
        log.info("🔍 Discovery request for organization slug: {}", slug);

        // Special case for platform/system
        if ("system".equalsIgnoreCase(slug) || "admin".equalsIgnoreCase(slug)) {
            return ResponseEntity.ok(DiscoveryResponse.builder()
                    .realm(defaultRealm)
                    .issuerUrl(keycloakServerUrl + "/realms/" + defaultRealm)
                    .organizationName("FTTH GIS Platform")
                    .build());
        }

        Optional<Organization> org = organizationRepository.findBySlug(slug);
        
        if (org.isPresent()) {
            String realmName = org.get().getRealmKey() != null && !org.get().getRealmKey().isBlank()
                    ? org.get().getRealmKey()
                    : com.company.ftthgis.config.tenant.KeycloakService.TENANT_SHARED_REALM;

            return ResponseEntity.ok(DiscoveryResponse.builder()
                    .realm(realmName)
                    .issuerUrl(keycloakServerUrl + "/realms/" + realmName)
                    .organizationName(org.get().getName())
                    .logoUrl(org.get().getLogoUrl())
                    .build());
        }

        return ResponseEntity.notFound().build();
    }

    /**
     * Domain-Based Home Realm Discovery (HRD) untuk login SSO enterprise.
     * Mengembalikan status federasi identitas dan konfigurasi SSO berdasarkan domain email.
     */
    @GetMapping({"/sso-discovery", "/discovery/sso"})
    public ResponseEntity<SsoDiscoveryResponse> discoverSso(@RequestParam(required = false) String email) {
        log.info("🔍 SSO discovery request for email: {}", email);
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(SsoDiscoveryResponse.builder()
                    .ssoAvailable(false)
                    .enforceSso(false)
                    .allowBreakGlass(false)
                    .build());
        }
        return ResponseEntity.ok(tenantSsoService.discoverSsoByEmail(email));
    }

    @Data
    @Builder
    public static class DiscoveryResponse {
        private String realm;
        private String issuerUrl;
        private String organizationName;
        private String logoUrl;
    }
}
