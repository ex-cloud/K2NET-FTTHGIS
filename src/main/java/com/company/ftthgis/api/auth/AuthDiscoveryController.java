package com.company.ftthgis.api.auth;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth/discovery")
@RequiredArgsConstructor
@Slf4j
public class AuthDiscoveryController {

    private final OrganizationRepository organizationRepository;

    @Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String defaultRealm;

    @GetMapping("/{slug}")
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
            // For now, we assume realm name = slug
            // In the future, we could store the realm name in Organization entity
            String realmName = org.get().getSlug();
            
            return ResponseEntity.ok(DiscoveryResponse.builder()
                    .realm(realmName)
                    .issuerUrl(keycloakServerUrl + "/realms/" + realmName)
                    .organizationName(org.get().getName())
                    .logoUrl(org.get().getLogoUrl())
                    .build());
        }

        return ResponseEntity.notFound().build();
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
