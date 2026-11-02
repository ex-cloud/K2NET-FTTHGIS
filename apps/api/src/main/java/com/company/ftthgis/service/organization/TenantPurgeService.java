package com.company.ftthgis.service.organization;

import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantPurgeService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationLifecycleService organizationLifecycleService;
    private final KeycloakAdminService keycloakAdminService;
    private final StringRedisTemplate redisTemplate;
    private final AuditLoggingService auditLoggingService;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Automated Garbage Collector: Runs hourly to purge unactivated tenants and users
     * whose activation token has expired (> 24 hours).
     * Mitigates Denial of Registration (account zombie hold).
     */
    @Scheduled(cron = "${ftth.tenant.purge-cron:0 0 * * * *}")
    @Transactional
    public int purgeExpiredPendingTenants() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<User> pendingUsers = userRepository.findPendingUnactivatedUsers(cutoff);

        if (pendingUsers.isEmpty()) {
            log.debug("🧹 Auto-Purge: No expired pending unactivated users found.");
            return 0;
        }

        log.info("🧹 Auto-Purge: Found {} expired pending users created before {}.", pendingUsers.size(), cutoff);
        int purgedCount = 0;

        for (User user : pendingUsers) {
            try {
                boolean success = purgePendingUserAndTenant(user, "Scheduled Auto-Purge (>24h Expired)");
                if (success) {
                    purgedCount++;
                }
            } catch (Exception ex) {
                log.error("❌ Failed purging expired pending user '{}' (ID: {}): {}",
                        user.getEmail(), user.getId(), ex.getMessage(), ex);
            }
        }

        log.info("✅ Auto-Purge completed: Successfully purged {} expired pending tenants/users.", purgedCount);
        return purgedCount;
    }

    /**
     * Manually purges an unactivated pending organization by slug (Super Admin action).
     */
    @Transactional
    public boolean purgeSingleExpiredTenant(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Organization with slug '" + slug + "' not found"));

        List<User> users = userRepository.findByOrganizationId(org.getId());
        boolean hasActiveUser = users.stream().anyMatch(u -> "ACTIVE".equalsIgnoreCase(u.getStatus()));
        if (hasActiveUser) {
            throw new IllegalStateException("Organization '" + slug + "' has active users and cannot be purged as unactivated.");
        }

        for (User user : users) {
            purgePendingUserAndTenant(user, "Manual Purge by Super Admin");
        }

        return true;
    }

    /**
     * Atomically wipes an unactivated pending user and their empty tenant organization.
     */
    @Transactional
    public boolean purgePendingUserAndTenant(User user, String reason) {
        Organization org = user.getOrganization();
        String userEmail = user.getEmail();
        String userIdStr = user.getId() != null ? user.getId().toString() : "";
        String orgSlug = org != null ? org.getSlug() : null;

        log.warn("🗑️ PURGING unactivated pending identity: Email: {}, Org: {}, Reason: {}",
                userEmail, orgSlug, reason);

        // 1. Delete user from Keycloak realm 'k2net-tenants'
        try {
            if (userIdStr != null && !userIdStr.isBlank()) {
                keycloakAdminService.deleteUser(KeycloakService.TENANT_SHARED_REALM, userIdStr);
            }
        } catch (Exception ke) {
            log.warn("⚠️ Non-fatal: Failed deleting Keycloak user {}: {}", userIdStr, ke.getMessage());
        }

        // 2. Clean Redis activation tokens
        try {
            if (orgSlug != null && !orgSlug.isBlank()) {
                String token = redisTemplate.opsForValue().get("auth:org-activate-token:" + orgSlug);
                redisTemplate.delete("auth:org-activate-token:" + orgSlug);
                if (token != null && !token.isBlank()) {
                    redisTemplate.delete("auth:activate:" + token);
                }
            }
        } catch (Exception re) {
            log.warn("⚠️ Non-fatal: Failed deleting Redis activation token for {}: {}", orgSlug, re.getMessage());
        }

        // 3. Purge organization if empty (no network nodes)
        if (org != null) {
            Integer nodeCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM network_nodes WHERE organization_id = ?",
                    Integer.class,
                    org.getId()
            );

            if (nodeCount == null || nodeCount == 0) {
                organizationLifecycleService.purgeOrganizationInternally(org, reason);
            } else {
                log.warn("⚠️ Organization {} has {} network nodes; deleting pending user only to prevent data loss.",
                        orgSlug, nodeCount);
                userRepository.delete(user);
            }
        } else {
            userRepository.delete(user);
        }

        // 4. Audit Trail
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("email", userEmail);
            details.put("orgSlug", orgSlug);
            details.put("reason", reason);
            auditLoggingService.logEvent(
                    "system",
                    "TENANT_PROVISIONING_EXPIRED_PURGED",
                    "USER",
                    userIdStr,
                    details,
                    new HashMap<>(),
                    new HashMap<>()
            );
        } catch (Exception ae) {
            log.error("Failed writing audit event for purged user {}: {}", userEmail, ae.getMessage());
        }

        return true;
    }
}

