package com.company.ftthgis.service.organization;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationQuotaService {

    private final OrganizationRepository organizationRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public static String normalizePlanName(String rawPlan) {
        if (rawPlan == null || rawPlan.trim().isEmpty()) {
            return "FREE";
        }
        String p = rawPlan.trim().toUpperCase();
        if (p.contains("FREE") || p.contains("TRIAL") || p.contains("STARTER_TRIAL") || p.contains("GRATIS")) {
            return "FREE";
        } else if (p.contains("STARTER") || p.contains("MINI") || p.contains("BASIC") || p.contains("KOMERSIL")) {
            return "STARTER";
        } else if (p.contains("PRO") || p.contains("PROFESSIONAL") || p.contains("BISNIS") || p.contains("BUSINESS")) {
            return "PRO";
        } else if (p.contains("ENTERPRISE") || p.contains("ULTIMATE") || p.contains("CUSTOM") || p.contains("CORE")) {
            return "ENTERPRISE";
        }
        return p;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllSubscriptionPlans() {
        return subscriptionPlanRepository.findAll();
    }

    @Transactional
    public boolean upgradeSubscription(String slug, String planName) {
        Optional<Organization> orgOpt = organizationRepository.findBySlug(slug);
        if (orgOpt.isEmpty()) {
            log.error("Organization not found for subscription upgrade: {}", slug);
            return false;
        }

        String rawPlan = planName != null ? planName.trim() : "PRO";
        String normalizedPlan = normalizePlanName(rawPlan);

        Optional<SubscriptionPlan> planOpt = subscriptionPlanRepository.findByName(normalizedPlan);
        if (planOpt.isEmpty()) {
            log.error("Subscription plan not found: {}", planName);
            return false;
        }

        Organization org = orgOpt.get();
        SubscriptionPlan plan = planOpt.get();

        org.setSubscriptionPlan(plan);
        if ("FREE".equalsIgnoreCase(normalizedPlan)) {
            if (org.getTrialExpiresAt() == null) {
                org.setTrialExpiresAt(java.time.LocalDateTime.now().plusDays(14));
            }
        } else {
            org.setStatus(Organization.OrganizationStatus.ACTIVE);
            org.setTrialExpiresAt(null); // Clear trial since they have upgraded/paid
        }

        organizationRepository.save(org);
        log.info("✅ Successfully upgraded organization '{}' to plan '{}'", slug, normalizedPlan);
        return true;
    }
}
