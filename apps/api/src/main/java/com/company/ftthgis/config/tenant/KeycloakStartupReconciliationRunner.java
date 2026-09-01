package com.company.ftthgis.config.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.service.KongConfigSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class KeycloakStartupReconciliationRunner implements ApplicationRunner {

    private final OrganizationRepository organizationRepository;
    private final KeycloakService keycloakService;
    private final KongConfigSyncService kongConfigSyncService;

    @Override
    public void run(ApplicationArguments args) {
        log.info("🚀 [Startup Reconciliation] Synchronizing B2B Tenant Realms, Identity Providers & Kong Edge...");

        try {
            // 1. Sync system realm to Kong
            kongConfigSyncService.syncRealmToKong("ftth-realm");

            // 2. Fetch all organizations
            List<Organization> organizations = organizationRepository.findAll();
            log.info("📋 Found {} organizations to reconcile with Keycloak & Kong", organizations.size());

            for (Organization org : organizations) {
                if (org.getSlug() == null || org.getSlug().trim().isEmpty()) {
                    continue;
                }

                String realmName = org.getSlug();
                boolean hasSso = org.getSubscriptionPlan() != null && org.getSubscriptionPlan().isHasSso();

                log.info("🔍 Reconciling organization '{}' (Realm: {}, Plan: {}, hasSso: {})",
                        org.getName(), realmName,
                        org.getSubscriptionPlan() != null ? org.getSubscriptionPlan().getName() : "NONE",
                        hasSso);

                try {
                    keycloakService.ensureRealmExists(realmName, hasSso);
                    kongConfigSyncService.syncRealmToKong(realmName);
                } catch (Exception ex) {
                    log.warn("⚠️ Failed to reconcile realm '{}' during startup: {}", realmName, ex.getMessage());
                }
            }

            log.info("🎉 [Startup Reconciliation] Completed successfully!");
        } catch (Exception e) {
            log.error("❌ Error during startup reconciliation: {}", e.getMessage(), e);
        }
    }
}
