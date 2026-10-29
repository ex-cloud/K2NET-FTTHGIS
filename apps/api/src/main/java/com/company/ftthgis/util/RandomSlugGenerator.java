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

    private static final String ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public static final Set<String> RESERVED_SLUGS = Set.of(
            "admin", "api", "auth", "system", "gis", "root", "superadmin",
            "dashboard", "app", "apps", "static", "assets", "tiles", "tile",
            "master", "default", "ftth-realm", "k2net-tenants", "mail", "smtp", "login",
            "logout", "register", "portal", "billing", "support", "status",
            "health", "metrics", "prometheus", "grafana", "kong", "traefik",
            "minio", "nextcloud", "poller", "notification", "payment", "storage",
            "map", "export", "scheduler", "task", "whatsapp", "olt", "observability", "ai"
    );

    /**
     * Sanitizes an organization name into a clean, professional DNS-safe base slug
     * by stripping common Indonesian corporate prefixes (PT, CV, UD, Yayasan, Perum, Koperasi).
     * e.g. "PT Kircon Bandung" -> "kircon-bandung", "PT. Nusantara Fiber" -> "nusantara-fiber"
     */
    public String sanitizeCleanBaseSlug(String name) {
        if (name == null || name.isBlank()) {
            return "tenant";
        }
        String trimmed = name.trim();
        String withoutEntityPrefix = trimmed.replaceFirst(
                "(?i)^(pt|cv|ud|yayasan|perum|koperasi)\\.?\\s+",
                ""
        ).trim();
        String candidate = withoutEntityPrefix.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (candidate.length() < 3) {
            candidate = sanitizeBaseSlug(trimmed);
        }
        if (candidate.length() < 3) {
            candidate = ("isp-" + candidate).replaceAll("-+$", "");
        }
        if (candidate.length() > 32) {
            candidate = candidate.substring(0, 32).replaceAll("-+$", "");
        }
        return candidate;
    }

    /**
     * Generates a clean, professional tenant slug directly from the organization name
     * without forced random suffixes (e.g. "PT Kircon Bandung" -> "kircon-bandung").
     * Only appends a short numeric or 4-char suffix if a name collision occurs.
     */
    public String generateCleanSlug(String orgName,
                                    OrganizationRepository organizationRepository,
                                    OrganizationSlugAliasRepository aliasRepository) {
        String base = sanitizeCleanBaseSlug(orgName);

        if (!isReserved(base)) {
            boolean existsInOrgs = organizationRepository != null && organizationRepository.existsBySlug(base);
            boolean existsInAliases = aliasRepository != null && aliasRepository.existsByOldSlug(base);
            if (!existsInOrgs && !existsInAliases) {
                log.info("🎯 Generated clean slug: '{}' for org '{}'", base, orgName);
                return base;
            }
        }

        // First fallback: short numeric suffix -2..-9
        for (int idx = 2; idx <= 9; idx++) {
            String candidate = base + "-" + idx;
            if (isReserved(candidate)) {
                continue;
            }
            boolean existsInOrgs = organizationRepository != null && organizationRepository.existsBySlug(candidate);
            boolean existsInAliases = aliasRepository != null && aliasRepository.existsByOldSlug(candidate);
            if (!existsInOrgs && !existsInAliases) {
                log.info("🎯 Generated clean slug with numeric suffix: '{}' for org '{}'", candidate, orgName);
                return candidate;
            }
        }

        // Second fallback: short 4-character alphanumeric suffix
        for (int attempt = 1; attempt <= 50; attempt++) {
            String candidate = base + "-" + generateSuffix(4);
            if (isReserved(candidate)) {
                continue;
            }
            boolean existsInOrgs = organizationRepository != null && organizationRepository.existsBySlug(candidate);
            boolean existsInAliases = aliasRepository != null && aliasRepository.existsByOldSlug(candidate);
            if (!existsInOrgs && !existsInAliases) {
                log.info("🎯 Generated clean slug with 4-char suffix: '{}' for org '{}'", candidate, orgName);
                return candidate;
            }
        }

        return base + "-" + generateSuffix(6);
    }

    /**
     * Sanitizes an organization name into a DNS-safe base slug.
     * e.g. "PT Nusantara Fiber Optik" -> "pt-nusantara-fiber"
     */
    public String sanitizeBaseSlug(String name) {
        if (name == null || name.isBlank()) {
            return "tenant";
        }
        String sanitized = name.toLowerCase().trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (sanitized.isBlank()) {
            return "tenant";
        }
        if (sanitized.length() > 24) {
            sanitized = sanitized.substring(0, 24).replaceAll("-+$", "");
        }
        return sanitized;
    }

    /**
     * Generates an alphanumeric suffix of specified length.
     */
    public String generateSuffix(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = RANDOM.nextInt(ALPHANUMERIC.length());
            sb.append(ALPHANUMERIC.charAt(index));
        }
        return sb.toString();
    }

    /**
     * Generates a human-readable smart slug based on organization name + unique 4-character suffix.
     * e.g. "PT Nusantara Fiber" -> "pt-nusantara-fiber-8k2p"
     * If 4-char suffix encounters heavy collision, cleanly falls back to 6-char suffix.
     */
    public String generateSmartSlug(String orgName,
                                    OrganizationRepository organizationRepository,
                                    OrganizationSlugAliasRepository aliasRepository) {
        String base = sanitizeBaseSlug(orgName);
        int maxAttempts = 100;
        // Attempt 1: 4-character alphanumeric suffix
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            String suffix = generateSuffix(4);
            String candidate = base + "-" + suffix;

            if (isReserved(candidate)) {
                continue;
            }

            boolean existsInOrgs = organizationRepository != null && organizationRepository.existsBySlug(candidate);
            boolean existsInAliases = aliasRepository != null && aliasRepository.existsByOldSlug(candidate);

            if (!existsInOrgs && !existsInAliases) {
                log.info("🎯 Generated smart slug: {} for org '{}' (attempt #{})", candidate, orgName, attempt);
                return candidate;
            }
        }
        // Fallback: 6-character alphanumeric suffix
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            String suffix = generateSuffix(6);
            String candidate = base + "-" + suffix;

            if (isReserved(candidate)) {
                continue;
            }

            boolean existsInOrgs = organizationRepository != null && organizationRepository.existsBySlug(candidate);
            boolean existsInAliases = aliasRepository != null && aliasRepository.existsByOldSlug(candidate);

            if (!existsInOrgs && !existsInAliases) {
                log.warn("🎯 Generated fallback 6-char smart slug: {} for org '{}' (attempt #{})", candidate, orgName, attempt);
                return candidate;
            }
        }
        return base + "-" + generateSuffix(8);
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
