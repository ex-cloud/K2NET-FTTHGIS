package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Background Janitor Job for B2B Tenant Lifecycle & Subscription Sweep
 * Runs periodically to evaluate trial expiries, emergency booster timeouts, and dunning grace periods.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationJanitorJob {

    private final OrganizationRepository organizationRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final ProjectRepository projectRepository;

    @Scheduled(cron = "0 */5 * * * *") // Every 5 minutes
    @Transactional
    public void sweepTenantLifecycle() {
        log.debug("🧹 JANITOR: Starting B2B tenant lifecycle & subscription sweep...");
        LocalDateTime now = LocalDateTime.now();
        List<Organization> allOrgs = organizationRepository.findAll();

        for (Organization org : allOrgs) {
            try {
                // 1. Check Expired Starter Trials
                if (org.getStatus() == Organization.OrganizationStatus.TRIAL || org.getStatus() == Organization.OrganizationStatus.ACTIVE) {
                    if (org.getTrialExpiresAt() != null && org.getTrialExpiresAt().isBefore(now)) {
                        log.warn("⏳ JANITOR: Trial expired for '{}'. Moving to TRIAL_EXPIRED mode.", org.getSlug());
                        org.setStatus(Organization.OrganizationStatus.TRIAL_EXPIRED);
                        if (org.getGracePeriodUntil() == null) {
                            org.setGracePeriodUntil(now.plusDays(7)); // 7-day grace period
                        }
                        organizationRepository.save(org);
                    }
                }

                // 2. Check Expired Emergency Boosters (Kondisi 6 - Bursting Timeout)
                if (org.getBoosterExpiresAt() != null && org.getBoosterExpiresAt().isBefore(now)) {
                    log.info("⏰ JANITOR: Booster expired for '{}'. Re-evaluating base capacity...", org.getSlug());
                    
                    SubscriptionPlan plan = org.getSubscriptionPlan();
                    int baseOlts = plan != null && plan.getMaxProjects() != null ? plan.getMaxProjects() : 5;
                    int baseOdps = plan != null && plan.getMaxOdps() != null ? plan.getMaxOdps() : 1000;
                    
                    int maxOlts = getConfigInt(org, "max_olts", baseOlts);
                    int maxOdps = getConfigInt(org, "max_odps", baseOdps);
                    int usedOlts = (int) projectRepository.countByOrganizationId(org.getId());
                    int usedOdps = getConfigInt(org, "used_odps", usedOlts * 30);

                    // Clear booster fields
                    org.setBoosterOlts(0);
                    org.setBoosterOdps(0);
                    org.setBoosterExpiresAt(null);

                    // If used assets exceed base quotas, safely switch to OVER_QUOTA (Read-Only Mode)
                    if (usedOlts > maxOlts || usedOdps > maxOdps) {
                        log.warn("🛡️ JANITOR: '{}' usage ({}/{} OLTs, {}/{} ODPs) exceeds base limits. Engaging OVER_QUOTA mode.",
                                org.getSlug(), usedOlts, maxOlts, usedOdps, maxOdps);
                        org.setOverQuotaMode(true);
                        org.setStatus(Organization.OrganizationStatus.OVER_QUOTA);
                        org.setGracePeriodUntil(now.plusDays(14));
                    }
                    organizationRepository.save(org);
                }

                // 3. Check Overdue Grace Period Expiration (Kondisi 5 - Dunning Soft-Lock)
                if (org.getGracePeriodUntil() != null && org.getGracePeriodUntil().isBefore(now)) {
                    if (org.getDunningLevel() != null && org.getDunningLevel() >= 3) {
                        if (org.getStatus() != Organization.OrganizationStatus.SUSPENDED) {
                            log.warn("🚫 JANITOR: Dunning Level 3 grace period elapsed for '{}'. Soft-locking tenant.", org.getSlug());
                            org.setStatus(Organization.OrganizationStatus.SUSPENDED);
                            organizationRepository.save(org);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("❌ JANITOR Error processing '{}': {}", org.getSlug(), e.getMessage());
            }
        }
    }

    private int getConfigInt(Organization org, String key, int fallback) {
        return organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key)
                .map(c -> {
                    try { return Integer.parseInt(c.getConfigValue()); } catch (Exception e) { return fallback; }
                })
                .orElse(fallback);
    }
}
