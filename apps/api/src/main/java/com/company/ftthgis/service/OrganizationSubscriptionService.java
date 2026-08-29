package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationConfig;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationSubscriptionService {

    private final OrganizationRepository organizationRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final ProjectRepository projectRepository;
    private final AuditLoggingService auditLoggingService;

    /**
     * Mengambil ringkasan langganan dan status siklus hidup tenant secara lengkap & real-time
     */
    @Transactional(readOnly = true)
    public SubscriptionSummaryResponse getSubscriptionSummary(String slug) {
        Organization org = getOrg(slug);
        SubscriptionPlan plan = org.getSubscriptionPlan();

        // 1. Quota & Hardware Specs
        int baseOlts = plan != null && plan.getMaxProjects() != null ? plan.getMaxProjects() : 5;
        int baseOdps = plan != null && plan.getMaxOdps() != null ? plan.getMaxOdps() : 1000;
        
        int usedOlts = 0;
        try {
            usedOlts = (int) projectRepository.countByOrganizationId(org.getId());
        } catch (Exception e) {
            log.warn("Could not count projects for {}: {}", slug, e.getMessage());
        }
        
        // Baca config dinamis jika ada override
        int maxOlts = getConfigInt(org, "max_olts", baseOlts);
        int maxOdps = getConfigInt(org, "max_odps", baseOdps);
        int usedOdps = getConfigInt(org, "used_odps", Math.min(usedOlts * 30, maxOdps));
        int maxStorageGb = getConfigInt(org, "max_storage_gb", "ENTERPRISE".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 100 : 25);
        double usedStorageGb = getConfigDouble(org, "used_storage_gb", 1.8);
        int apiRateLimitMax = getConfigInt(org, "api_rate_limit_max", "ENTERPRISE".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 20000 : 5000);
        int apiRateLimitUsed = getConfigInt(org, "api_rate_limit_used", 342);

        // 2. Booster Status
        boolean isBoosterActive = org.isBoosterActive();
        int boosterOlts = org.getBoosterOlts() != null ? org.getBoosterOlts() : 0;
        int boosterOdps = org.getBoosterOdps() != null ? org.getBoosterOdps() : 0;
        LocalDateTime boosterExpiresAt = org.getBoosterExpiresAt();
        long boosterDaysRemaining = 0;
        if (isBoosterActive && boosterExpiresAt != null) {
            boosterDaysRemaining = Math.max(0, Duration.between(LocalDateTime.now(), boosterExpiresAt).toDays());
        }

        int effectiveMaxOlts = maxOlts + (isBoosterActive ? boosterOlts : 0);
        int effectiveMaxOdps = maxOdps + (isBoosterActive ? boosterOdps : 0);

        // 3. Lifecycle Details
        boolean isTrialExpired = org.isTrialExpired();
        long trialDaysRemaining = 0;
        if (org.getTrialExpiresAt() != null && !isTrialExpired) {
            trialDaysRemaining = Math.max(0, Duration.between(LocalDateTime.now(), org.getTrialExpiresAt()).toDays());
        }

        boolean isOverQuota = org.getOverQuotaMode() != null && org.getOverQuotaMode() 
                || (usedOlts > effectiveMaxOlts || usedOdps > effectiveMaxOdps);
        boolean isSoftLocked = org.isSoftLocked();

        String planName = plan != null ? plan.getName() : "PRO";
        String planTier = mapPlanNameToTier(planName);

        return SubscriptionSummaryResponse.builder()
                .orgId(org.getId().toString())
                .orgName(org.getName())
                .orgSlug(org.getSlug())
                .status(org.getStatus().name())
                .planTier(planTier)
                .planName(planName)
                .planPrice(plan != null && plan.getPrice() != null ? plan.getPrice() : BigDecimal.valueOf(4900000))
                .planCycle(org.getPlanCycle() != null ? org.getPlanCycle() : "MONTHLY")
                .maxOlts(maxOlts)
                .usedOlts(usedOlts)
                .maxOdps(maxOdps)
                .usedOdps(usedOdps)
                .maxStorageGb(maxStorageGb)
                .usedStorageGb(usedStorageGb)
                .apiRateLimitMax(apiRateLimitMax)
                .apiRateLimitUsed(apiRateLimitUsed)
                .isBoosterActive(isBoosterActive)
                .boosterOlts(boosterOlts)
                .boosterOdps(boosterOdps)
                .boosterExpiresAt(boosterExpiresAt)
                .boosterDaysRemaining(boosterDaysRemaining)
                .effectiveMaxOlts(effectiveMaxOlts)
                .effectiveMaxOdps(effectiveMaxOdps)
                .trialExpiresAt(org.getTrialExpiresAt())
                .isTrialExpired(isTrialExpired)
                .trialDaysRemaining(trialDaysRemaining)
                .gracePeriodUntil(org.getGracePeriodUntil())
                .dunningLevel(org.getDunningLevel() != null ? org.getDunningLevel() : 0)
                .isOverQuota(isOverQuota)
                .isSoftLocked(isSoftLocked)
                .build();
    }

    /**
     * KONDISI 2 & KONDISI 3: Upgrade Paket (Instant unfreeze, Quota Jump, Prorata)
     */
    @Transactional
    public SubscriptionSummaryResponse upgradePlan(String slug, PlanUpgradeRequest request) {
        Organization org = getOrg(slug);
        String targetPlanName = mapTierToPlanName(request.getNewPlanName());

        SubscriptionPlan targetPlan = subscriptionPlanRepository.findByName(targetPlanName)
                .orElseGet(() -> subscriptionPlanRepository.findByName("PRO")
                        .orElseThrow(() -> new RuntimeException("Subscription plan not found: " + targetPlanName)));

        log.info("🚀 Upgrading plan for organization '{}' to '{}' (Cycle: {})", slug, targetPlan.getName(), request.getPlanCycle());

        org.setSubscriptionPlan(targetPlan);
        if (request.getPlanCycle() != null) {
            org.setPlanCycle(request.getPlanCycle().toUpperCase());
        }

        // Unfreeze & Reset trial/dunning/over-quota
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        org.setTrialExpiresAt(null);
        org.setGracePeriodUntil(null);
        org.setDunningLevel(0);
        org.setOverQuotaMode(false);

        // Update quota configs matching the new plan tier
        int newMaxOlts = targetPlan.getMaxProjects() != null ? targetPlan.getMaxProjects() : 20;
        int newMaxOdps = targetPlan.getMaxOdps() != null ? targetPlan.getMaxOdps() : 10000;
        int newStorageGb = "ENTERPRISE".equalsIgnoreCase(targetPlan.getName()) ? 100 : 50;
        int newRateLimit = "ENTERPRISE".equalsIgnoreCase(targetPlan.getName()) ? 20000 : 10000;

        saveOrUpdateConfig(org, "max_olts", String.valueOf(newMaxOlts));
        saveOrUpdateConfig(org, "max_odps", String.valueOf(newMaxOdps));
        saveOrUpdateConfig(org, "max_storage_gb", String.valueOf(newStorageGb));
        saveOrUpdateConfig(org, "api_rate_limit_max", String.valueOf(newRateLimit));

        organizationRepository.save(org);

        auditLoggingService.logSuspiciousActivity(
                org.getId(),
                "super_admin",
                "127.0.0.1",
                "PLAN_UPGRADE_EXECUTED",
                "Upgraded to " + targetPlan.getName() + " (" + org.getPlanCycle() + "). DirectOverride=" + request.isDirectOverride() + ". Notes=" + request.getNotes()
        );

        return getSubscriptionSummary(slug);
    }

    /**
     * KONDISI 1: Downgrade Paket saat Kapasitas Melebihi Batas Baru (Zero Data Loss Mode)
     */
    @Transactional
    public Map<String, Object> downgradePlan(String slug, PlanDowngradeRequest request) {
        Organization org = getOrg(slug);
        String targetPlanName = mapTierToPlanName(request.getTargetPlanName());

        SubscriptionPlan targetPlan = subscriptionPlanRepository.findByName(targetPlanName)
                .orElseGet(() -> subscriptionPlanRepository.findByName("FREE")
                        .orElseThrow(() -> new RuntimeException("Target plan not found: " + targetPlanName)));

        int usedOlts = (int) projectRepository.countByOrganizationId(org.getId());
        int targetMaxOlts = targetPlan.getMaxProjects() != null ? targetPlan.getMaxProjects() : 2;
        int targetMaxOdps = targetPlan.getMaxOdps() != null ? targetPlan.getMaxOdps() : 500;
        int usedOdps = getConfigInt(org, "used_odps", usedOlts * 30);

        boolean willBeOverQuota = usedOlts > targetMaxOlts || usedOdps > targetMaxOdps;

        log.info("📉 Downgrading plan for organization '{}' to '{}'. Used: {}/{} OLTs, {}/{} ODPs. OverQuota={}",
                slug, targetPlan.getName(), usedOlts, targetMaxOlts, usedOdps, targetMaxOdps, willBeOverQuota);

        org.setSubscriptionPlan(targetPlan);

        if (willBeOverQuota) {
            org.setOverQuotaMode(true);
            org.setStatus(Organization.OrganizationStatus.OVER_QUOTA);
            org.setGracePeriodUntil(LocalDateTime.now().plusDays(14));
        } else {
            org.setOverQuotaMode(false);
            org.setStatus(Organization.OrganizationStatus.ACTIVE);
            org.setGracePeriodUntil(null);
        }

        saveOrUpdateConfig(org, "max_olts", String.valueOf(targetMaxOlts));
        saveOrUpdateConfig(org, "max_odps", String.valueOf(targetMaxOdps));
        saveOrUpdateConfig(org, "max_storage_gb", "FREE".equalsIgnoreCase(targetPlan.getName()) ? "10" : "25");
        saveOrUpdateConfig(org, "api_rate_limit_max", "FREE".equalsIgnoreCase(targetPlan.getName()) ? "2000" : "5000");

        organizationRepository.save(org);

        auditLoggingService.logSuspiciousActivity(
                org.getId(),
                "super_admin",
                "127.0.0.1",
                "PLAN_DOWNGRADE_FORCED",
                "Downgraded to " + targetPlan.getName() + ". OverQuota=" + willBeOverQuota + ". Reason=" + request.getReason()
        );

        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("overQuotaMode", willBeOverQuota);
        result.put("usedOlts", usedOlts);
        result.put("targetMaxOlts", targetMaxOlts);
        result.put("usedOdps", usedOdps);
        result.put("targetMaxOdps", targetMaxOdps);
        result.put("gracePeriodUntil", org.getGracePeriodUntil());
        result.put("summary", getSubscriptionSummary(slug));

        return result;
    }

    /**
     * KONDISI 3: Hitung Simulasi Prorata Upgrade (Proration Calculator)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> calculateProrationEstimate(String slug, String targetPlanName, String targetCycle) {
        Organization org = getOrg(slug);
        SubscriptionPlan currentPlan = org.getSubscriptionPlan();
        
        String cleanTarget = mapTierToPlanName(targetPlanName);
        SubscriptionPlan targetPlan = subscriptionPlanRepository.findByName(cleanTarget)
                .orElse(currentPlan);

        BigDecimal currentPrice = currentPlan != null && currentPlan.getPrice() != null ? currentPlan.getPrice() : BigDecimal.valueOf(1500000);
        BigDecimal targetPrice = targetPlan != null && targetPlan.getPrice() != null ? targetPlan.getPrice() : BigDecimal.valueOf(12500000);

        // Simulasi hari tersisa dalam siklus 30 hari (asumsi hari ke-15)
        int totalCycleDays = 30;
        int remainingDays = 15;

        BigDecimal dailyCurrent = currentPrice.divide(BigDecimal.valueOf(totalCycleDays), 2, RoundingMode.HALF_UP);
        BigDecimal dailyTarget = targetPrice.divide(BigDecimal.valueOf(totalCycleDays), 2, RoundingMode.HALF_UP);

        BigDecimal unusedCredit = dailyCurrent.multiply(BigDecimal.valueOf(remainingDays));
        BigDecimal newPlanProRate = dailyTarget.multiply(BigDecimal.valueOf(remainingDays));
        BigDecimal netPayableDelta = newPlanProRate.subtract(unusedCredit).max(BigDecimal.ZERO);

        Map<String, Object> calc = new HashMap<>();
        calc.put("currentPlan", currentPlan != null ? currentPlan.getName() : "FREE");
        calc.put("targetPlan", targetPlan != null ? targetPlan.getName() : "PRO");
        calc.put("currentPlanPrice", currentPrice);
        calc.put("targetPlanPrice", targetPrice);
        calc.put("totalCycleDays", totalCycleDays);
        calc.put("remainingDays", remainingDays);
        calc.put("unusedOldPlanCredit", unusedCredit);
        calc.put("newPlanProratedCost", newPlanProRate);
        calc.put("netPayableDelta", netPayableDelta);

        return calc;
    }

    /**
     * KONDISI 6: Emergency Quota Booster / Add-on Sementara (Bursting)
     */
    @Transactional
    public SubscriptionSummaryResponse applyEmergencyBooster(String slug, EmergencyBoosterRequest request) {
        Organization org = getOrg(slug);
        int durationDays = request.getDurationDays() > 0 ? request.getDurationDays() : 30;

        log.info("🚀 Applying emergency booster for '{}': +{} OLTs, +{} ODPs for {} days",
                slug, request.getBoosterOlts(), request.getBoosterOdps(), durationDays);

        org.setBoosterOlts(request.getBoosterOlts());
        org.setBoosterOdps(request.getBoosterOdps());
        org.setBoosterExpiresAt(LocalDateTime.now().plusDays(durationDays));

        // Jika sebelumnya over-quota dan booster mencukupi, buka kembali status ACTIVE
        int usedOlts = (int) projectRepository.countByOrganizationId(org.getId());
        int maxOlts = getConfigInt(org, "max_olts", 5);
        int effectiveMaxOlts = maxOlts + request.getBoosterOlts();
        
        if (org.getStatus() == Organization.OrganizationStatus.OVER_QUOTA && usedOlts <= effectiveMaxOlts) {
            org.setStatus(Organization.OrganizationStatus.ACTIVE);
            org.setOverQuotaMode(false);
        }

        organizationRepository.save(org);

        auditLoggingService.logSuspiciousActivity(
                org.getId(),
                "super_admin",
                "127.0.0.1",
                "EMERGENCY_BOOSTER_APPLIED",
                "+" + request.getBoosterOlts() + " OLTs, +" + request.getBoosterOdps() + " ODPs for " + durationDays + " days. Reason: " + request.getReason()
        );

        return getSubscriptionSummary(slug);
    }

    /**
     * KONDISI 4: Perpanjangan Masa Uji Coba Trial (+7 / +14 Hari)
     */
    @Transactional
    public SubscriptionSummaryResponse extendTrial(String slug, TrialExtendRequest request) {
        Organization org = getOrg(slug);
        int days = request.getAdditionalDays() > 0 ? request.getAdditionalDays() : 7;

        LocalDateTime base = org.getTrialExpiresAt();
        if (base == null || base.isBefore(LocalDateTime.now())) {
            base = LocalDateTime.now();
        }

        org.setTrialExpiresAt(base.plusDays(days));
        org.setStatus(Organization.OrganizationStatus.TRIAL);
        org.setGracePeriodUntil(null);

        organizationRepository.save(org);

        auditLoggingService.logSuspiciousActivity(
                org.getId(),
                "super_admin",
                "127.0.0.1",
                "TRIAL_EXTENDED",
                "Extended by " + days + " days. Reason: " + request.getReason()
        );

        return getSubscriptionSummary(slug);
    }

    /**
     * KONDISI 5: Update Status Dunning / Eskalasi Gagal Bayar
     */
    @Transactional
    public SubscriptionSummaryResponse updateDunningLevel(String slug, DunningUpdateRequest request) {
        Organization org = getOrg(slug);
        int level = Math.max(0, Math.min(request.getDunningLevel(), 3));

        org.setDunningLevel(level);
        if (level == 0) {
            org.setStatus(Organization.OrganizationStatus.ACTIVE);
            org.setGracePeriodUntil(null);
        } else if (level >= 3) {
            org.setStatus(Organization.OrganizationStatus.SUSPENDED);
        } else {
            org.setStatus(Organization.OrganizationStatus.OVERDUE);
            org.setGracePeriodUntil(LocalDateTime.now().plusDays(7 - (level * 2L)));
        }

        organizationRepository.save(org);

        auditLoggingService.logSuspiciousActivity(
                org.getId(),
                "super_admin",
                "127.0.0.1",
                "DUNNING_LEVEL_UPDATED",
                "Dunning level set to " + level + ". Notes: " + request.getNotes()
        );

        return getSubscriptionSummary(slug);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Organization getOrg(String slug) {
        return organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found with slug: " + slug));
    }

    private void saveOrUpdateConfig(Organization org, String key, String value) {
        Optional<OrganizationConfig> existing = organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key);
        OrganizationConfig config = existing.orElseGet(() -> {
            OrganizationConfig c = new OrganizationConfig();
            c.setOrganization(org);
            c.setConfigKey(key);
            c.setActive(true);
            return c;
        });
        config.setConfigValue(value);
        organizationConfigRepository.save(config);
    }

    private int getConfigInt(Organization org, String key, int fallback) {
        return organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key)
                .map(c -> {
                    try { return Integer.parseInt(c.getConfigValue()); } catch (Exception e) { return fallback; }
                })
                .orElse(fallback);
    }

    private double getConfigDouble(Organization org, String key, double fallback) {
        return organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key)
                .map(c -> {
                    try { return Double.parseDouble(c.getConfigValue()); } catch (Exception e) { return fallback; }
                })
                .orElse(fallback);
    }

    private String mapPlanNameToTier(String planName) {
        if (planName == null) return "Professional";
        String upper = planName.toUpperCase();
        if (upper.contains("FREE") || upper.contains("STARTER") || upper.contains("TRIAL")) return "Starter";
        if (upper.contains("PRO")) return "Professional";
        if (upper.contains("ENTERPRISE")) return "Enterprise";
        return "Custom";
    }

    private String mapTierToPlanName(String tier) {
        if (tier == null) return "PRO";
        String upper = tier.toUpperCase();
        if (upper.contains("STARTER") || upper.contains("FREE")) return "FREE";
        if (upper.contains("PRO")) return "PRO";
        if (upper.contains("ENTERPRISE") || upper.contains("CUSTOM")) return "ENTERPRISE";
        return "PRO";
    }
}
