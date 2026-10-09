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

import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;

/**
 * Background Janitor Job for B2B Tenant Lifecycle & Subscription Sweep
 * Runs periodically to evaluate trial expiries, emergency booster timeouts, dunning grace periods,
 * and multi-tenant license status lifecycle (ACTIVE -> GRACE_PERIOD -> RESTRICTED_READ_ONLY -> SUSPENDED).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationJanitorJob {

    private final OrganizationRepository organizationRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationService organizationService;
    private final TenantLicenseRepository tenantLicenseRepository;

    @Scheduled(cron = "0 */5 * * * *") // Every 5 minutes
    @Transactional
    public void sweepTenantLifecycle() {
        log.debug("🧹 JANITOR: Starting B2B tenant lifecycle & subscription sweep...");
        LocalDateTime now = LocalDateTime.now();

        // 0. Sweep multi-tenant license lifecycle transitions
        sweepLicenseLifecycle(now);

        List<Organization> allOrgs = organizationRepository.findAll();

        for (Organization org : allOrgs) {
            try {
                // 1. Phase 1 -> Phase 2: Check Expired Starter Trials (14 Days)
                if (org.getStatus() == Organization.OrganizationStatus.TRIAL ||
                   (org.getStatus() == Organization.OrganizationStatus.ACTIVE && org.getTrialExpiresAt() != null &&
                    "FREE".equalsIgnoreCase(org.getSubscriptionPlan() != null ? org.getSubscriptionPlan().getName() : ""))) {
                    if (org.getTrialExpiresAt() != null && org.getTrialExpiresAt().isBefore(now)) {
                        log.warn("⏳ JANITOR: Trial expired for '{}'. Moving to TRIAL_EXPIRED mode (Grace Period: 16 days).", org.getSlug());
                        org.setStatus(Organization.OrganizationStatus.TRIAL_EXPIRED);
                        if (org.getGracePeriodUntil() == null) {
                            // 16 days grace period gives total 30 days window from trial start
                            org.setGracePeriodUntil(now.plusDays(16));
                        }
                        organizationRepository.save(org);
                    }
                }

                // 2. Phase 2 -> Phase 3: Check Hard Purge Cut-Off for Inactive/Abandoned Free Trial Tenants (> Day 30)
                if (org.getStatus() == Organization.OrganizationStatus.TRIAL_EXPIRED) {
                    if (org.getGracePeriodUntil() != null && org.getGracePeriodUntil().isBefore(now)) {
                        // Safety Guards: Never purge system/root organization or paid active tenants
                        boolean isProtectedRoot = "default".equalsIgnoreCase(org.getSlug()) ||
                                "00000000-0000-0000-0000-000000000001".equals(org.getId().toString());
                        boolean isPaidPlan = org.getSubscriptionPlan() != null &&
                                !"FREE".equalsIgnoreCase(org.getSubscriptionPlan().getName()) &&
                                !"TRIAL".equalsIgnoreCase(org.getSubscriptionPlan().getName());

                        if (!isProtectedRoot && !isPaidPlan) {
                            log.warn("🚨 JANITOR: 30-day Free Trial Cut-Off date reached for tenant '{}' (Grace expired at {}). Initiating nuclear auto-purge...",
                                    org.getSlug(), org.getGracePeriodUntil());
                            try {
                                organizationService.purgeOrganizationInternally(org, "Automated 30-Day Free Trial Inactivity Cut-off Purge");
                                log.info("💥 JANITOR: Automated nuclear purge successfully executed for '{}'", org.getSlug());
                            } catch (Exception purgeEx) {
                                log.error("❌ JANITOR: Failed to auto-purge tenant '{}': {}", org.getSlug(), purgeEx.getMessage(), purgeEx);
                            }
                            continue; // Entity is nuked, skip further evaluation for this org
                        }
                    }
                }

                // 3. Check Expired Emergency Boosters (Kondisi 6 - Bursting Timeout)
                if (org.getBoosterExpiresAt() != null && org.getBoosterExpiresAt().isBefore(now)) {
                    log.info("⏰ JANITOR: Booster expired for '{}'. Re-evaluating base capacity...", org.getSlug());
                    
                    SubscriptionPlan plan = org.getSubscriptionPlan();
                    int baseOlts = plan != null && plan.getMaxProjects() != null ? plan.getMaxProjects() : 6;
                    int baseOdps = plan != null && plan.getMaxOdps() != null ? plan.getMaxOdps() : 2500;
                    
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

                // 4. Check Overdue Grace Period Expiration (Kondisi 5 - Dunning Soft-Lock)
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

    /**
     * Sweep siklus hidup lisensi multi-tenant:
     * 1. ACTIVE -> GRACE_PERIOD (7 hari) saat valid_until < NOW()
     * 2. GRACE_PERIOD -> RESTRICTED_READ_ONLY saat grace_period_until < NOW()
     * 3. RESTRICTED_READ_ONLY -> SUSPENDED saat grace_period_until + 30 hari < NOW()
     */
    public void sweepLicenseLifecycle(LocalDateTime now) {
        log.debug("🔑 JANITOR: Sweeping tenant license lifecycle transitions...");

        // 1. ACTIVE -> GRACE_PERIOD (7 hari masa tenggang)
        List<TenantLicense> expiredActiveLicenses = tenantLicenseRepository.findByValidUntilBeforeAndStatus(now, LicenseStatus.ACTIVE);
        for (TenantLicense lic : expiredActiveLicenses) {
            try {
                lic.setStatus(LicenseStatus.GRACE_PERIOD);
                lic.setGracePeriodUntil(now.plusDays(7));
                tenantLicenseRepository.save(lic);

                Organization org = lic.getOrganization();
                log.warn("⏳ JANITOR: License '{}' for tenant '{}' expired. Transitioned to GRACE_PERIOD (7 days until {}).",
                        lic.getLicenseKey(), org != null ? org.getSlug() : "unknown", lic.getGracePeriodUntil());
            } catch (Exception e) {
                log.error("❌ JANITOR: Failed transitioning license '{}' to GRACE_PERIOD: {}", lic.getLicenseKey(), e.getMessage());
            }
        }

        // 2. GRACE_PERIOD -> RESTRICTED_READ_ONLY
        List<TenantLicense> expiredGraceLicenses = tenantLicenseRepository.findByGracePeriodUntilBeforeAndStatus(now, LicenseStatus.GRACE_PERIOD);
        for (TenantLicense lic : expiredGraceLicenses) {
            try {
                lic.setStatus(LicenseStatus.RESTRICTED_READ_ONLY);
                tenantLicenseRepository.save(lic);

                Organization org = lic.getOrganization();
                if (org != null) {
                    org.setOverQuotaMode(true);
                    if (org.getStatus() == Organization.OrganizationStatus.ACTIVE) {
                        org.setStatus(Organization.OrganizationStatus.OVERDUE);
                    }
                    organizationRepository.save(org);
                }

                log.warn("🛡️ JANITOR: License '{}' for tenant '{}' grace period elapsed. Restricted to READ_ONLY.",
                        lic.getLicenseKey(), org != null ? org.getSlug() : "unknown");
            } catch (Exception e) {
                log.error("❌ JANITOR: Failed transitioning license '{}' to RESTRICTED_READ_ONLY: {}", lic.getLicenseKey(), e.getMessage());
            }
        }

        // 3. RESTRICTED_READ_ONLY -> SUSPENDED (H+30 setelah Grace Period berakhir)
        List<TenantLicense> readOnlyLicenses = tenantLicenseRepository.findByStatus(LicenseStatus.RESTRICTED_READ_ONLY);
        for (TenantLicense lic : readOnlyLicenses) {
            try {
                if (lic.getGracePeriodUntil() != null && lic.getGracePeriodUntil().plusDays(30).isBefore(now)) {
                    lic.setStatus(LicenseStatus.SUSPENDED);
                    tenantLicenseRepository.save(lic);

                    Organization org = lic.getOrganization();
                    if (org != null && org.getStatus() != Organization.OrganizationStatus.SUSPENDED) {
                        org.setStatus(Organization.OrganizationStatus.SUSPENDED);
                        organizationRepository.save(org);
                    }

                    log.warn("🚫 JANITOR: License '{}' for tenant '{}' unpaid > 30 days after grace. License & organization SUSPENDED.",
                            lic.getLicenseKey(), org != null ? org.getSlug() : "unknown");
                }
            } catch (Exception e) {
                log.error("❌ JANITOR: Failed transitioning license '{}' to SUSPENDED: {}", lic.getLicenseKey(), e.getMessage());
            }
        }
    }
}
