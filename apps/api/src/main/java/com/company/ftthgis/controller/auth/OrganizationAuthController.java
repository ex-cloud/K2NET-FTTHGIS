package com.company.ftthgis.controller.auth;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@Slf4j
public class OrganizationAuthController {

    private final OrganizationRepository organizationRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthMethodDto {
        private String id;
        private String name;
        private String type; // "social" | "saml" | "enterprise"
        private String icon; // "google" | "github" | "microsoft" | "saml"
        private boolean enabled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizationAuthMethodsResponse {
        private String slug;
        private String name;
        private String logoUrl;
        private String primaryAuthMethod;
        private List<AuthMethodDto> allowedMethods;
        private boolean mfaRequired;
        private boolean restrictToSingleMethod;
        private String theme;
    }

    /**
     * Public endpoint to retrieve allowed authentication methods and branding for a specific organization/realm.
     * Used by Linear-Style Auth Shell before initiating Keycloak OIDC PKCE flow.
     */
    @GetMapping("/{slug}/auth-methods")
    public ResponseEntity<OrganizationAuthMethodsResponse> getAuthMethods(@PathVariable String slug) {
        log.info("🔍 Resolving auth methods for tenant slug: {}", slug);

        // System Admin Realm
        if ("system".equalsIgnoreCase(slug) || "ftth-realm".equalsIgnoreCase(slug) || "admin".equalsIgnoreCase(slug)) {
            return ResponseEntity.ok(OrganizationAuthMethodsResponse.builder()
                    .slug("system")
                    .name("K2NET Master Management Portal")
                    .logoUrl("/k2net-logo.png")
                    .primaryAuthMethod("keycloak-direct")
                    .allowedMethods(List.of(
                            AuthMethodDto.builder().id("google").name("Google Workspace SSO").type("social").icon("google").enabled(true).build()
                    ))
                    .mfaRequired(true)
                    .restrictToSingleMethod(false)
                    .theme("ftth-gis")
                    .build());
        }

        // Tenant Realm
        Organization org = organizationRepository.findBySlug(slug)
                .orElse(null);

        if (org == null) {
            return ResponseEntity.notFound().build();
        }

        boolean hasSso = org.getSubscriptionPlan() != null && org.getSubscriptionPlan().isHasSso();
        List<AuthMethodDto> methods = new ArrayList<>();

        if (hasSso) {
            methods.add(AuthMethodDto.builder()
                    .id("google")
                    .name("Google Workspace")
                    .type("social")
                    .icon("google")
                    .enabled(true)
                    .build());

            methods.add(AuthMethodDto.builder()
                    .id("github")
                    .name("GitHub")
                    .type("social")
                    .icon("github")
                    .enabled(true)
                    .build());
        }

        return ResponseEntity.ok(OrganizationAuthMethodsResponse.builder()
                .slug(org.getSlug())
                .name(org.getName())
                .logoUrl(org.getLogoUrl())
                .primaryAuthMethod("keycloak-direct")
                .allowedMethods(methods)
                .mfaRequired(false)
                .restrictToSingleMethod(false)
                .theme("ftth-gis")
                .build());
    }
}
