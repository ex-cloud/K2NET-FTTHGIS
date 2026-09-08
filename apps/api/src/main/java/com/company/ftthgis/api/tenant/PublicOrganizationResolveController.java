package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.OrganizationResolveResponse;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSlugAlias;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

/**
 * Public discovery controller that resolves technical Keycloak realm_key and tenant metadata
 * from the public browser vanity subdomain slug.
 *
 * This decouples technical authentication (realm_key) from public routing (slug).
 */
@RestController
@RequestMapping("/api/v1/public/organizations")
@RequiredArgsConstructor
@Slf4j
public class PublicOrganizationResolveController {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSlugAliasRepository organizationSlugAliasRepository;

    @GetMapping("/resolve")
    public ResponseEntity<?> resolve(@RequestParam(name = "slug", required = false) String slug) {
        if (slug == null || slug.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Paramater slug tidak boleh kosong."));
        }

        String cleanedSlug = slug.trim().toLowerCase();

        // 1. Check primary active organizations by slug
        Optional<Organization> directOrg = organizationRepository.findBySlug(cleanedSlug);
        if (directOrg.isPresent()) {
            Organization org = directOrg.get();
            String effectiveRealmKey = org.getRealmKey() != null ? org.getRealmKey() : org.getSlug();
            String planTier = org.getSubscriptionPlan() != null ? org.getSubscriptionPlan().getName() : "FREE";

            return ResponseEntity.ok(OrganizationResolveResponse.builder()
                    .realmKey(effectiveRealmKey)
                    .organizationName(org.getName())
                    .slug(org.getSlug())
                    .targetSlug(null)
                    .isAlias(false)
                    .planTier(planTier)
                    .status(org.getStatus() != null ? org.getStatus().name() : "ACTIVE")
                    .logoUrl(org.getLogoUrl())
                    .build());
        }

        // 2. Check historical aliases (e.g. during grace period after Pro slug migration)
        Optional<OrganizationSlugAlias> aliasOpt = organizationSlugAliasRepository.findByOldSlug(cleanedSlug);
        if (aliasOpt.isPresent()) {
            OrganizationSlugAlias alias = aliasOpt.get();
            Organization targetOrg = alias.getOrganization();
            if (targetOrg != null) {
                String effectiveRealmKey = targetOrg.getRealmKey() != null ? targetOrg.getRealmKey() : targetOrg.getSlug();
                String planTier = targetOrg.getSubscriptionPlan() != null ? targetOrg.getSubscriptionPlan().getName() : "PRO";

                log.info("🔀 Resolved historical alias '{}' -> active slug '{}' (Realm: {})",
                        cleanedSlug, targetOrg.getSlug(), effectiveRealmKey);

                return ResponseEntity.ok(OrganizationResolveResponse.builder()
                        .realmKey(effectiveRealmKey)
                        .organizationName(targetOrg.getName())
                        .slug(cleanedSlug)
                        .targetSlug(targetOrg.getSlug())
                        .isAlias(true)
                        .planTier(planTier)
                        .status(targetOrg.getStatus() != null ? targetOrg.getStatus().name() : "ACTIVE")
                        .logoUrl(targetOrg.getLogoUrl())
                        .build());
            }
        }

        log.warn("⚠️ Organization not found for slug or alias: '{}'", cleanedSlug);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Organisasi dengan subdomain '" + cleanedSlug + "' tidak ditemukan."));
    }
}
