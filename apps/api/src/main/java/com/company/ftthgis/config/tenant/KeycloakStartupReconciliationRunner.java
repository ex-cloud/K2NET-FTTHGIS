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
    private final com.company.ftthgis.service.FileStorageService fileStorageService;

    @Override
    public void run(ApplicationArguments args) {
        log.info("🚀 [Startup Reconciliation] Verifying 2 Static Realms (ftth-realm & k2net-tenants) & Kong Edge...");

        try {
            // 1. Reconcile the 2 permanent realms ONLY (zero per-organization realm creation)
            keycloakService.ensureRealmExists(KongConfigSyncService.PLATFORM_REALM);
            keycloakService.ensureTenantSharedRealmExists();

            kongConfigSyncService.syncRealmToKong(KongConfigSyncService.PLATFORM_REALM);
            kongConfigSyncService.syncRealmToKong(KongConfigSyncService.TENANT_SHARED_REALM);

            // 2. Ensure MinIO S3 tenant vaults exist for active organizations (lightweight, no Keycloak/Kong reload)
            List<Organization> organizations = organizationRepository.findAll();
            for (Organization org : organizations) {
                if (org.getSlug() == null || org.getSlug().trim().isEmpty()) {
                    continue;
                }
                try {
                    fileStorageService.initTenantVault(org.getSlug());
                } catch (Exception ex) {
                    log.warn("⚠️ Failed to initialize MinIO vault for '{}' during startup: {}", org.getSlug(), ex.getMessage());
                }
            }

            log.info("🎉 [Startup Reconciliation] 2-Realm Architecture verified successfully!");
        } catch (Exception e) {
            log.error("❌ Error during startup reconciliation: {}", e.getMessage(), e);
        }
    }
}
