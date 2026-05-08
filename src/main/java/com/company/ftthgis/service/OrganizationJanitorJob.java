package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationJanitorJob {

    private final OrganizationRepository organizationRepository;

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void cleanupExpiredTrials() {
        log.info("🧹 JANITOR: Starting trial expiry check...");

        LocalDateTime now = LocalDateTime.now();
        
        List<Organization> allOrgs = organizationRepository.findAll();
        List<Organization> expiredOrgs = allOrgs.stream()
            .filter(org -> org.getStatus() == Organization.OrganizationStatus.ACTIVE)
            .filter(org -> org.getSubscriptionPlan() != null && "FREE".equalsIgnoreCase(org.getSubscriptionPlan().getName()))
            .filter(org -> org.getTrialExpiresAt() != null && org.getTrialExpiresAt().isBefore(now))
            .collect(Collectors.toList());

        if (expiredOrgs.isEmpty()) {
            log.info("✨ JANITOR: No expired trials found.");
            return;
        }

        log.warn("⚠️ JANITOR: Found {} expired trials. Suspending...", expiredOrgs.size());

        for (Organization org : expiredOrgs) {
            try {
                log.info("🚫 Suspending: {}", org.getSlug());
                org.setStatus(Organization.OrganizationStatus.SUSPENDED);
                organizationRepository.save(org);
            } catch (Exception e) {
                log.error("❌ Error suspending {}: {}", org.getSlug(), e.getMessage());
            }
        }
    }
}
