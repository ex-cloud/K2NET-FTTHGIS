package com.company.ftthgis.util;

import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Set;

@Component
@Slf4j
public class RandomSlugGenerator {

    private static final String LOWERCASE_ALPHA = "abcdefghijklmnopqrstuvwxyz";
    private static final int DEFAULT_SLUG_LENGTH = 20;
    private static final SecureRandom RANDOM = new SecureRandom();

    public static final Set<String> RESERVED_SLUGS = Set.of(
            "admin", "api", "auth", "system", "gis", "root", "superadmin",
            "dashboard", "app", "apps", "static", "assets", "tiles", "tile",
            "master", "default", "ftth-realm", "mail", "smtp", "login",
            "logout", "register", "portal", "billing", "support", "status",
            "health", "metrics", "prometheus", "grafana", "kong", "traefik",
            "minio", "nextcloud", "poller", "notification", "payment", "storage",
            "map", "export", "scheduler", "task", "whatsapp", "olt", "observability", "ai"
    );

    /**
     * Generates a 20-character cryptographically secure lowercase alphabetical random slug.
     */
    public String generateRawSlug() {
        return generateRawSlug(DEFAULT_SLUG_LENGTH);
    }

    /**
     * Generates an N-character cryptographically secure lowercase alphabetical random slug.
     */
    public String generateRawSlug(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = RANDOM.nextInt(LOWERCASE_ALPHA.length());
            sb.append(LOWERCASE_ALPHA.charAt(index));
        }
        return sb.toString();
    }

    /**
     * Generates a unique 20-character slug guaranteed not to collide with existing organizations,
     * historical aliases, or reserved keywords.
     */
    public String generateUniqueSlug(OrganizationRepository organizationRepository,
                                     OrganizationSlugAliasRepository aliasRepository) {
        int maxAttempts = 100;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            String candidate = generateRawSlug(DEFAULT_SLUG_LENGTH);

            if (isReserved(candidate)) {
                continue;
            }

            boolean existsInOrgs = organizationRepository.existsBySlug(candidate);
            boolean existsInAliases = aliasRepository != null && aliasRepository.existsByOldSlug(candidate);

            if (!existsInOrgs && !existsInAliases) {
                log.info("🎲 Generated unique 20-char random slug: {} (attempt #{})", candidate, attempt);
                return candidate;
            }
        }
        throw new IllegalStateException("Failed to generate a unique random slug after " + maxAttempts + " attempts");
    }

    /**
     * Checks if a given slug is in the platform reserved keywords blacklist.
     */
    public boolean isReserved(String slug) {
        if (slug == null) {
            return false;
        }
        String normalized = slug.trim().toLowerCase();
        return RESERVED_SLUGS.contains(normalized);
    }

    /**
     * Validates if a custom slug follows DNS-safe format rules and is not reserved.
     * Rules:
     * - 3 to 40 characters
     * - Lowercase alphanumeric and single hyphens (no consecutive hyphens)
     * - Must start and end with an alphanumeric character
     * - Not in reserved words
     */
    public boolean isValidCustomSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            return false;
        }
        String normalized = slug.trim().toLowerCase();
        if (normalized.length() < 3 || normalized.length() > 40) {
            return false;
        }
        if (isReserved(normalized)) {
            return false;
        }
        // Match regex: starts with [a-z0-9], ends with [a-z0-9], allows single hyphens in between
        return normalized.matches("^[a-z0-9]([a-z0-9-]*[a-z0-9])?$") && !normalized.contains("--");
    }
}
