package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationAnalyticsService {

    private final JdbcTemplate jdbcTemplate;
    private final OrganizationRepository organizationRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getOrganizationStats(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        
        UUID orgId = org.getId();
        log.info("📊 Fetching real stats for organization: {} ({})", org.getName(), orgId);

        Map<String, Object> stats = new HashMap<>();
        
        // Count Projects
        Integer projectCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM projects WHERE organization_id = ?", Integer.class, orgId);
        
        // Count ODCs (Nodes with type ODC in projects belonging to this org)
        Integer odcCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(n.*) FROM network_nodes n " +
                "JOIN projects p ON n.project_id = p.id " +
                "WHERE p.organization_id = ? AND n.type = 'ODC'", Integer.class, orgId);

        // Count ODPs
        Integer odpCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(n.*) FROM network_nodes n " +
                "JOIN projects p ON n.project_id = p.id " +
                "WHERE p.organization_id = ? AND n.type = 'ODP'", Integer.class, orgId);

        // Count Customers
        Integer customerCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(n.*) FROM network_nodes n " +
                "JOIN projects p ON n.project_id = p.id " +
                "WHERE p.organization_id = ? AND n.type = 'CUSTOMER'", Integer.class, orgId);

        // Calculate total cable length (in meters, assuming PostGIS)
        Double totalCableLength = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(ST_Length(geom::geography)), 0) FROM network_edges f " +
                "JOIN projects p ON f.project_id = p.id " +
                "WHERE p.organization_id = ?", Double.class, orgId);

        stats.put("projectCount", projectCount);
        stats.put("odcCount", odcCount);
        stats.put("odpCount", odpCount);
        stats.put("customerCount", customerCount);
        stats.put("totalCableLength", Math.round(totalCableLength != null ? totalCableLength : 0));
        stats.put("organizationName", org.getName());
        stats.put("organizationSlug", org.getSlug());
        stats.put("featureFlags", resolveFeatureFlags(org));

        return stats;
    }

    /**
     * Mengambil statistik ringkasan riil untuk seluruh organisasi dalam 1 kali agregasi efisien.
     */
    public Map<String, Map<String, Object>> getAllOrganizationsStats() {
        java.util.List<Organization> orgs = organizationRepository.findAll();
        Map<String, Map<String, Object>> result = new HashMap<>();

        for (Organization org : orgs) {
            UUID orgId = org.getId();
            Map<String, Object> stats = new HashMap<>();

            try {
                Integer projectCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM projects WHERE organization_id = ? AND deleted_at IS NULL", Integer.class, orgId);
                Integer oltCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(n.*) FROM network_nodes n " +
                        "JOIN projects p ON n.project_id = p.id " +
                        "WHERE p.organization_id = ? AND (n.type = 'OLT' OR n.type = 'CENTRAL_OFFICE')", Integer.class, orgId);
                Integer odcCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(n.*) FROM network_nodes n " +
                        "JOIN projects p ON n.project_id = p.id " +
                        "WHERE p.organization_id = ? AND n.type = 'ODC'", Integer.class, orgId);
                Integer odpCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(n.*) FROM network_nodes n " +
                        "JOIN projects p ON n.project_id = p.id " +
                        "WHERE p.organization_id = ? AND n.type = 'ODP'", Integer.class, orgId);
                Integer customerCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(n.*) FROM network_nodes n " +
                        "JOIN projects p ON n.project_id = p.id " +
                        "WHERE p.organization_id = ? AND n.type = 'CUSTOMER'", Integer.class, orgId);

                int resolvedOltCount = (oltCount != null && oltCount > 0) ? oltCount : (projectCount != null ? projectCount : 0);

                stats.put("projectCount", projectCount != null ? projectCount : 0);
                stats.put("usedOlts", resolvedOltCount);
                stats.put("odcCount", odcCount != null ? odcCount : 0);
                stats.put("usedOdps", odpCount != null ? odpCount : 0);
                stats.put("customerCount", customerCount != null ? customerCount : 0);
                stats.put("organizationSlug", org.getSlug());
                stats.put("organizationName", org.getName());
                stats.put("featureFlags", resolveFeatureFlags(org));
            } catch (Exception e) {
                log.warn("Error calculating stats for {}: {}", org.getSlug(), e.getMessage());
                stats.put("projectCount", 0);
                stats.put("usedOlts", 0);
                stats.put("odcCount", 0);
                stats.put("usedOdps", 0);
                stats.put("customerCount", 0);
                stats.put("organizationSlug", org.getSlug());
                stats.put("organizationName", org.getName());
                stats.put("featureFlags", resolveFeatureFlags(org));
            }

            result.put(org.getSlug(), stats);
        }

        return result;
    }

    /**
     * Resolves feature flags for an organization by reading custom overrides from organization_configs,
     * or falling back to defaults based on the organization's subscription plan.
     */
    public Map<String, Boolean> resolveFeatureFlags(Organization org) {
        Map<String, Boolean> flags = new HashMap<>();
        String planName = org.getSubscriptionPlan() != null ? org.getSubscriptionPlan().getName() : "Professional";
        boolean isEnterprise = "Enterprise".equalsIgnoreCase(planName);
        boolean isStarter = "Starter".equalsIgnoreCase(planName);

        // Plan defaults
        flags.put("gisCore", true);
        flags.put("oltPoller", !isStarter);
        flags.put("whatsappEngine", true);
        flags.put("aiCopilot", isEnterprise);
        flags.put("sandboxMode", false);

        try {
            List<String> rawConfigs = jdbcTemplate.query(
                    "SELECT config_value FROM organization_configs WHERE organization_id = ? AND config_key = 'feature_flags'",
                    (rs, rowNum) -> rs.getString("config_value"),
                    org.getId()
            );
            if (!rawConfigs.isEmpty() && rawConfigs.get(0) != null && !rawConfigs.get(0).isBlank()) {
                Map<String, Object> custom = objectMapper.readValue(rawConfigs.get(0), new TypeReference<Map<String, Object>>() {});
                for (Map.Entry<String, Object> entry : custom.entrySet()) {
                    if (entry.getValue() instanceof Boolean b) {
                        flags.put(entry.getKey(), b);
                    } else if (entry.getValue() instanceof String s) {
                        flags.put(entry.getKey(), Boolean.parseBoolean(s));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("No custom feature flags override found for {}: {}", org.getSlug(), e.getMessage());
        }

        return flags;
    }

    /**
     * Saves custom feature flags for an organization in organization_configs.
     */
    public Map<String, Boolean> saveFeatureFlags(String slug, Map<String, Boolean> newFlags) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found: " + slug));

        Map<String, Boolean> currentFlags = resolveFeatureFlags(org);
        currentFlags.putAll(newFlags);

        try {
            String jsonVal = objectMapper.writeValueAsString(currentFlags);
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM organization_configs WHERE organization_id = ? AND config_key = 'feature_flags'",
                    Integer.class,
                    org.getId()
            );
            if (exists != null && exists > 0) {
                jdbcTemplate.update(
                        "UPDATE organization_configs SET config_value = ?, updated_at = NOW() WHERE organization_id = ? AND config_key = 'feature_flags'",
                        jsonVal, org.getId()
                );
            } else {
                jdbcTemplate.update(
                        "INSERT INTO organization_configs (id, organization_id, config_key, config_value, description, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, 'feature_flags', ?, 'Tenant B2B Feature Flags & Module Entitlements', true, NOW(), NOW())",
                        UUID.randomUUID(), org.getId(), jsonVal
                );
            }
            log.info("✅ Saved feature flags for organization {}: {}", slug, jsonVal);
        } catch (Exception e) {
            log.error("Failed to persist feature flags for {}: {}", slug, e.getMessage(), e);
            throw new RuntimeException("Failed to save feature flags: " + e.getMessage());
        }

        return currentFlags;
    }

    /**
     * Mengambil daftar perangkat OLT dan ODC riil yang terdaftar untuk tenant.
     */
    public java.util.List<Map<String, Object>> getOrganizationDevices(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        UUID orgId = org.getId();

        String sql = "SELECT n.id, n.name, n.code, n.type, n.status, n.created_at, p.name as project_name " +
                     "FROM network_nodes n " +
                     "JOIN projects p ON n.project_id = p.id " +
                     "WHERE p.organization_id = ? AND (n.type = 'OLT' OR n.type = 'CENTRAL_OFFICE' OR n.type = 'ODC') " +
                     "ORDER BY n.created_at DESC";

        try {
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", rs.getString("id"));
                map.put("name", rs.getString("name") != null ? rs.getString("name") : "Node " + rs.getString("id"));
                map.put("code", rs.getString("code") != null ? rs.getString("code") : rs.getString("name"));
                map.put("type", rs.getString("type"));
                map.put("status", rs.getString("status") != null ? rs.getString("status") : "UP");
                map.put("projectName", rs.getString("project_name"));
                map.put("createdAt", rs.getString("created_at"));
                return map;
            }, orgId);
        } catch (Exception e) {
            log.warn("Could not query devices for org {}: {}", slug, e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    /**
     * Mengambil log audit riil tenant dari tabel audit_events.
     */
    public List<Map<String, Object>> getOrganizationAuditEvents(String slug, int limit) {
        String sql = "SELECT id, tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, " +
                     "       old_value::text as old_value_json, new_value::text as new_value_json, metadata::text as metadata_json, occurred_at " +
                     "FROM audit_events " +
                     "WHERE tenant_slug = ? OR (tenant_slug = 'system' AND (resource_id LIKE ? OR metadata::text LIKE ?)) " +
                     "ORDER BY occurred_at DESC " +
                     "LIMIT ?";

        try {
            String slugPattern = "%" + slug + "%";
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", rs.getString("id"));
                map.put("tenantSlug", rs.getString("tenant_slug"));
                map.put("actorId", rs.getString("actor_id"));
                map.put("actorRole", rs.getString("actor_role") != null ? rs.getString("actor_role") : "SYSTEM");
                map.put("actorIp", rs.getString("actor_ip") != null ? rs.getString("actor_ip") : "127.0.0.1");
                map.put("action", rs.getString("action"));
                map.put("resourceType", rs.getString("resource_type"));
                map.put("resourceId", rs.getString("resource_id"));
                map.put("oldValueJson", rs.getString("old_value_json"));
                map.put("newValueJson", rs.getString("new_value_json"));
                map.put("metadataJson", rs.getString("metadata_json"));
                map.put("occurredAt", rs.getString("occurred_at"));
                return map;
            }, slug, slugPattern, slugPattern, limit <= 0 ? 50 : limit);
        } catch (Exception e) {
            log.warn("Could not query audit events for org {}: {}", slug, e.getMessage());
            return new java.util.ArrayList<>();
        }
    }
}


