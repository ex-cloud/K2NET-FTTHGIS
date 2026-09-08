package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSlugAlias;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.util.RandomSlugGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service that handles Controlled Subdomain Migration for Organizations.
 * 
 * Architecture Principle:
 * Decouples mutable public URL routing (slug) from immutable technical authentication (realm_key).
 * When an organization changes its slug (e.g. from 20-char random hash to custom name):
 * - The Keycloak realm (realm_key) NEVER changes -> Zero risk of User UUID orphan/mismatch.
 * - Active sessions and task/project referential integrity remain 100% intact.
 * - The previous slug is recorded in organization_slug_aliases for graceful transition.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationSlugMigrationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSlugAliasRepository organizationSlugAliasRepository;
    private final RandomSlugGenerator randomSlugGenerator;
    private final AuditLoggingService auditLoggingService;

    @Transactional
    public Map<String, Object> migrateSlug(UUID organizationId, String targetSlug, String actorUsername) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found with ID: " + organizationId));

        String oldSlug = org.getSlug();
        String normalizedTarget = targetSlug != null ? targetSlug.trim().toLowerCase() : "";

        log.info("🔄 Initiating Subdomain Migration for Org '{}' (ID: {}, RealmKey: '{}'): '{}' -> '{}'",
                org.getName(), org.getId(), org.getRealmKey(), oldSlug, normalizedTarget);

        // 1. Validate Target Slug Format & Reserved Words
        if (normalizedTarget.isBlank()) {
            throw new IllegalArgumentException("Target slug cannot be empty.");
        }

        if (normalizedTarget.equalsIgnoreCase(oldSlug)) {
            throw new IllegalArgumentException("Target slug is identical to the current active slug.");
        }

        if (randomSlugGenerator.isReserved(normalizedTarget)) {
            throw new IllegalArgumentException("The requested subdomain '" + normalizedTarget + "' is a reserved platform keyword.");
        }

        if (!randomSlugGenerator.isValidCustomSlug(normalizedTarget) && !normalizedTarget.matches("^[a-z]{20}$")) {
            throw new IllegalArgumentException("Invalid slug format. Must be 3-40 alphanumeric characters with single hyphens, or 20 lowercase letters.");
        }

        // 2. Check Subscription Plan Gating
        SubscriptionPlan plan = org.getSubscriptionPlan();
        String planName = plan != null ? plan.getName() : "FREE";
        if ("FREE".equalsIgnoreCase(planName)) {
            throw new IllegalStateException("The Starter (Free) tier is locked to auto-generated random subdomains. Please upgrade to Pro or Enterprise to customize your subdomain.");
        }

        // 3. Check Collision in Database (Current Slugs & Historical Aliases)
        if (organizationRepository.existsBySlug(normalizedTarget)) {
            throw new IllegalArgumentException("The subdomain '" + normalizedTarget + "' is already in use by another organization.");
        }

        if (organizationSlugAliasRepository.existsByOldSlug(normalizedTarget)) {
            throw new IllegalArgumentException("The subdomain '" + normalizedTarget + "' is reserved as a historical alias of another workspace.");
        }

        // 4. Record Historical Alias for Seamless Redirection / Grace Period
        OrganizationSlugAlias alias = OrganizationSlugAlias.builder()
                .organization(org)
                .oldSlug(oldSlug)
                .createdBy(actorUsername != null ? actorUsername : "system")
                .migratedAt(LocalDateTime.now())
                .build();
        organizationSlugAliasRepository.save(alias);

        // 5. Update Organization Slug (realm_key remains unchanged and immutable!)
        org.setSlug(normalizedTarget);
        org.setSlugType("CUSTOM");
        if (org.getRealmKey() == null) {
            org.setRealmKey(oldSlug); // Fallback safeguard
        }
        Organization updated = organizationRepository.saveAndFlush(org);

        // 6. Audit Logging
        try {
            Map<String, Object> oldState = new HashMap<>();
            oldState.put("slug", oldSlug);
            oldState.put("realmKey", org.getRealmKey());
            oldState.put("slugType", org.getSlugType());

            Map<String, Object> newState = new HashMap<>();
            newState.put("slug", normalizedTarget);
            newState.put("realmKey", org.getRealmKey());
            newState.put("slugType", "CUSTOM");

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("organizationId", org.getId().toString());
            metadata.put("organizationName", org.getName());
            metadata.put("plan", planName);
            metadata.put("actor", actorUsername);

            auditLoggingService.logEvent(
                    actorUsername != null ? actorUsername : "system",
                    "TENANT_SLUG_MIGRATED",
                    "ORGANIZATION",
                    org.getId().toString(),
                    oldState,
                    newState,
                    metadata
            );
        } catch (Exception auditEx) {
            log.error("Failed to record TENANT_SLUG_MIGRATED audit event: {}", auditEx.getMessage());
        }

        String newDomain = normalizedTarget + "-gis.kdua.net";
        log.info("🎉 SUCCESS: Organization '{}' subdomain updated: '{}' -> '{}' (RealmKey '{}' preserved, zero session disruption)",
                updated.getName(), oldSlug, normalizedTarget, updated.getRealmKey());

        return Map.of(
                "organizationId", updated.getId().toString(),
                "organizationName", updated.getName(),
                "realmKey", updated.getRealmKey(),
                "previousSlug", oldSlug,
                "newSlug", normalizedTarget,
                "newDomain", newDomain,
                "newUrl", "https://" + newDomain,
                "migratedAt", LocalDateTime.now().toString(),
                "status", "MIGRATED"
        );
    }
}
