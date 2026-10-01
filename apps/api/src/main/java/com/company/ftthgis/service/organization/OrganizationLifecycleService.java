package com.company.ftthgis.service.organization;

import com.company.ftthgis.config.security.TenantSecurity;
import com.company.ftthgis.config.tenant.AuditContext;
import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.FileStorageService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationLifecycleService {

    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;
    private final NetworkNodeRepository networkNodeRepository;
    private final FiberCableRepository fiberCableRepository;
    private final UserRepository userRepository;
    private final KeycloakService keycloakService;
    private final FileStorageService fileStorageService;
    private final TenantSecurity tenantSecurity;
    private final AuditLoggingService auditLoggingService;
    private final EntityManager entityManager;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public Map<String, Object> getImpactSummary(String idOrSlug) {
        Organization org = organizationRepository.findBySlug(idOrSlug)
                .or(() -> {
                    try {
                        return organizationRepository.findById(UUID.fromString(idOrSlug));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new RuntimeException("Organization not found with slug or id: " + idOrSlug));

        long projectsCount = projectRepository.countByOrganizationId(org.getId());
        long nodesCount = networkNodeRepository.countByOrganizationId(org.getId());
        long cablesCount = fiberCableRepository.countByOrganizationId(org.getId());
        long usersCount = userRepository.countByOrganizationId(org.getId());

        Map<String, Object> summary = new HashMap<>();
        summary.put("organizationId", org.getId());
        summary.put("organizationName", org.getName());
        summary.put("slug", org.getSlug());
        summary.put("projectsCount", projectsCount);
        summary.put("nodesCount", nodesCount);
        summary.put("cablesCount", cablesCount);
        summary.put("usersCount", usersCount);
        summary.put("keycloakRealm", org.getSlug());
        summary.put("status", org.getStatus() != null ? org.getStatus().toString() : "ACTIVE");
        return summary;
    }

    @Transactional
    public void deleteOrganization(String idOrSlug) {
        deleteOrganization(idOrSlug, "soft", "Recycle Bin Deletion");
    }

    @Transactional
    public void deleteOrganization(String idOrSlug, String mode, String reason) {
        // IMPERSONATION DEFENSE: Impersonated sessions must never delete or destroy tenants
        if (AuditContext.isImpersonating()) {
            log.error("🛡️ CRITICAL SECURITY VIOLATION: Impersonated session attempted to delete organization '{}'", idOrSlug);
            throw new SecurityException("Impersonated sessions are forbidden from deleting or purging tenant organizations.");
        }

        Organization org = organizationRepository.findBySlug(idOrSlug)
                .or(() -> {
                    try {
                        return organizationRepository.findById(UUID.fromString(idOrSlug));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new RuntimeException("Organization not found with slug or id: " + idOrSlug));

        String slug = org.getSlug();

        // ROOT PLATFORM DEFENSE: Prevent deletion of Main / System Organization
        if ("default".equalsIgnoreCase(slug) || "00000000-0000-0000-0000-000000000001".equals(org.getId().toString())) {
            log.warn("🛡️ PREVENTED: Attempt to delete root platform organization '{}' (ID: {})", slug, org.getId());
            throw new IllegalArgumentException("Root Platform Organization (default) is immutable and protected from deletion.");
        }

        // SECONDARY DEFENSE: Prevent unauthorized deletion
        if (!tenantSecurity.isOwner(slug)) {
            log.error("🛡️ CRITICAL SECURITY INCIDENT: Unauthorized deletion attempt for organization '{}'", slug);
            throw new SecurityException("You do not have permission to delete this organization. Incident logged.");
        }

        // TIER 2: NUCLEAR WIPE MODE (Permanent Physical Destruction)
        if ("nuclear".equalsIgnoreCase(mode)) {
            purgeOrganizationInternally(org, reason);
            return;
        }

        // TIER 1: SOFT DELETE / GRACE PERIOD (30 Hari ke Recycle Bin)
        log.warn("🗑️ TIER 1 SOFT DELETE INITIATED: {} (Slug: {}) - Reason: {}", org.getName(), slug, reason);
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = auth != null ? auth.getName() : "admin";
            org.setDeletedAt(LocalDateTime.now());
            org.setDeletedBy(currentUsername);
            org.setStatus(Organization.OrganizationStatus.SUSPENDED);
            organizationRepository.save(org);

            // Immediate Lockout: Disable Keycloak Realm so tenant users cannot authenticate
            keycloakService.setRealmEnabled(slug, false);

            try {
                auditLoggingService.logEvent(
                    "system",
                    "TENANT_SOFT_DELETED",
                    "ORGANIZATION",
                    org.getId().toString(),
                    Map.of("name", org.getName(), "slug", org.getSlug(), "mode", "SOFT_DELETE", "reason", reason != null ? reason : "Recycle Bin Grace Period"),
                    new HashMap<>(),
                    new HashMap<>()
                );
            } catch (Exception auditEx) {
                log.error("Failed to log TENANT_SOFT_DELETED audit event: {}", auditEx.getMessage());
            }

            log.info("✅ SUCCESS: Organization '{}' moved to Recycle Bin (Keycloak Realm disabled).", slug);
        } catch (Exception e) {
            log.error("❌ ERROR during soft deletion for {}: {}", slug, e.getMessage());
            throw new RuntimeException("Gagal memindahkan organisasi ke Recycle Bin: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void purgeOrganizationInternally(Organization org, String reason) {
        // IMPERSONATION DEFENSE: Impersonated sessions must never purge tenants
        if (AuditContext.isImpersonating()) {
            log.error("🛡️ CRITICAL SECURITY VIOLATION: Impersonated session attempted to purge organization '{}'", org.getSlug());
            throw new SecurityException("Impersonated sessions are forbidden from deleting or purging tenant organizations.");
        }

        String slug = org.getSlug();
        UUID orgId = org.getId();
        String orgIdStr = orgId.toString();

        // ROOT PLATFORM DEFENSE: Prevent deletion of Main / System Organization
        if ("default".equalsIgnoreCase(slug) || "00000000-0000-0000-0000-000000000001".equals(orgIdStr)) {
            log.warn("🛡️ PREVENTED: Attempt to delete root platform organization '{}' (ID: {})", slug, orgIdStr);
            throw new IllegalArgumentException("Root Platform Organization (default) is immutable and protected from deletion.");
        }

        log.warn("💥 NUCLEAR PURGE INITIATED: {} (Slug: {}) - Reason: {}", org.getName(), slug, reason);
        try {
            String effectiveRealmKey = org.getRealmKey() != null && !org.getRealmKey().trim().isEmpty() ? org.getRealmKey() : slug;

            // 1. Delete Keycloak Realm (Infrastructure Cleanup)
            log.info("🛡️ Deleting Keycloak Realm: {} (effective realmKey: {})", slug, effectiveRealmKey);
            try {
                keycloakService.deleteRealm(effectiveRealmKey);
            } catch (Exception e) {
                log.warn("⚠️ Non-critical failure deleting Keycloak realm: {}. Manual cleanup may be required.", e.getMessage());
            }
            if (!effectiveRealmKey.equalsIgnoreCase(slug)) {
                try {
                    keycloakService.deleteRealm(slug);
                } catch (Exception ignored) {}
            }

            // 2. Delete Logo File in Storage if exists
            if (org.getLogoUrl() != null && !org.getLogoUrl().isEmpty()) {
                log.info("🗑️ Deleting logo file for deleted organization: {}", org.getLogoUrl());
                try {
                    fileStorageService.deleteFile(org.getLogoUrl());
                } catch (Exception ignored) {}
            }

            // 3. Native Cascaded Nuclear Database Wipe in strict topological dependency order
            log.info("💥 Executing atomic SQL cascade wipe for organization: {} (ID: {})", slug, orgId);

            // A. Fiber & Splice & Splitter level
            jdbcTemplate.update("DELETE FROM splitter_port WHERE node_id IN (SELECT id FROM network_nodes WHERE organization_id = ?) OR connected_core_id IN (SELECT id FROM fiber_core WHERE cable_id IN (SELECT id FROM network_edges WHERE organization_id = ?))", orgId, orgId);
            jdbcTemplate.update("DELETE FROM fiber_splice WHERE from_core_id IN (SELECT id FROM fiber_core WHERE cable_id IN (SELECT id FROM network_edges WHERE organization_id = ?)) OR to_core_id IN (SELECT id FROM fiber_core WHERE cable_id IN (SELECT id FROM network_edges WHERE organization_id = ?))", orgId, orgId);
            jdbcTemplate.update("DELETE FROM fiber_core WHERE cable_id IN (SELECT id FROM network_edges WHERE organization_id = ?) OR from_node_id IN (SELECT id FROM network_nodes WHERE organization_id = ?) OR to_node_id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId, orgId, orgId);
            jdbcTemplate.update("DELETE FROM network_edges WHERE organization_id = ?", orgId);

            // B. Network Nodes Hierarchy (customers, odp, odc, olt -> network_nodes)
            jdbcTemplate.update("DELETE FROM customers WHERE id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM odp WHERE id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM odc WHERE id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM olt WHERE id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM network_nodes WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM assets WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM asset_categories WHERE organization_id = ?", orgId);

            // C. AI & Knowledge level
            jdbcTemplate.update("DELETE FROM ai_documents WHERE tenant_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM ai_chat_sessions WHERE tenant_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM ai_query_analytics WHERE tenant_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM ai_suggested_prompts WHERE tenant_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM ai_agent_authorizations WHERE tenant_id = ?", orgId);

            // D. Tasks level
            jdbcTemplate.update("DELETE FROM tasks WHERE organization_id = ?", orgId);

            // E. Impersonation sessions, User Devices, Security Events & Audit Logs
            jdbcTemplate.update("DELETE FROM impersonation_sessions WHERE target_organization_id = ? OR actor_user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM user_devices WHERE user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId);
            jdbcTemplate.update("DELETE FROM user_audit_logs WHERE organization_id = ? OR target_user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId, orgId);
            jdbcTemplate.update("DELETE FROM security_events WHERE user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId);

            // F. Project Members & Users
            jdbcTemplate.update("DELETE FROM project_members WHERE organization_id = ? OR project_id IN (SELECT id FROM projects WHERE organization_id = ?) OR user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId, orgId, orgId);
            jdbcTemplate.update("DELETE FROM users WHERE organization_id = ?", orgId);

            // G. Projects
            jdbcTemplate.update("DELETE FROM projects WHERE organization_id = ?", orgId);

            // H. Roles & Permissions (tenant-specific roles)
            jdbcTemplate.update("DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE organization_id = ? AND is_system_role = false)", orgId);
            jdbcTemplate.update("DELETE FROM roles WHERE organization_id = ? AND is_system_role = false", orgId);

            // I. Configs, Aliases, Payments
            jdbcTemplate.update("DELETE FROM organization_configs WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM organization_slug_aliases WHERE organization_id = ?", orgId);
            jdbcTemplate.update("DELETE FROM payment_transactions WHERE org_slug = ?", slug);

            // J. Organization Entity
            jdbcTemplate.update("DELETE FROM organizations WHERE id = ?", orgId);

            // Flush and clear EntityManager to avoid stale entities in Hibernate Session
            entityManager.clear();

            // L2 Cache Eviction for Roles & Organizations
            try {
                entityManager.getEntityManagerFactory().getCache().evict(Organization.class, orgId);
            } catch (Exception ignored) {}

            try {
                auditLoggingService.logEvent(
                    "system",
                    "TENANT_NUCLEAR_DELETED",
                    "ORGANIZATION",
                    orgIdStr,
                    Map.of("name", org.getName(), "slug", org.getSlug(), "status", "NUCLEAR_DELETED", "reason", reason != null ? reason : "Direct Nuclear Delete"),
                    new HashMap<>(),
                    new HashMap<>()
                );
            } catch (Exception auditEx) {
                log.error("Failed to log TENANT_NUCLEAR_DELETED audit event: {}", auditEx.getMessage());
            }

            log.info("✅ SUCCESS: Organization '{}' and all associated resources have been nuked.", slug);
        } catch (Exception e) {
            log.error("❌ ERROR during nuclear organization deletion for {}: {}", slug, e.getMessage());
            throw new RuntimeException("Failed to perform nuclear organization cleanup: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void restoreOrganization(String idOrSlug) {
        Organization org = organizationRepository.findBySlug(idOrSlug)
                .or(() -> {
                    try {
                        return organizationRepository.findById(UUID.fromString(idOrSlug));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new RuntimeException("Organization not found with slug or id: " + idOrSlug));

        String slug = org.getSlug();
        org.setDeletedAt(null);
        org.setDeletedBy(null);
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        organizationRepository.save(org);

        // Re-enable Keycloak realm
        keycloakService.setRealmEnabled(slug, true);

        try {
            auditLoggingService.logEvent(
                "system",
                "TENANT_RESTORED",
                "ORGANIZATION",
                org.getId().toString(),
                Map.of("name", org.getName(), "slug", org.getSlug()),
                new HashMap<>(),
                new HashMap<>()
            );
        } catch (Exception ignored) {}

        log.info("🔄 SUCCESS: Organization '{}' restored and Keycloak realm re-enabled.", slug);
    }
}
