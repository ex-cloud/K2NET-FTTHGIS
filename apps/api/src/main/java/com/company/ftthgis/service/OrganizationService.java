package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.OrganizationCreateRequest;
import com.company.ftthgis.api.tenant.dto.OrganizationImportRequest;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.service.organization.OrganizationDataExportService;
import com.company.ftthgis.service.organization.OrganizationDirectoryService;
import com.company.ftthgis.service.organization.OrganizationLifecycleService;
import com.company.ftthgis.service.organization.OrganizationProvisioningService;
import com.company.ftthgis.service.organization.OrganizationQuotaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Thin Facade for Organization domain operations.
 * Preserves 100% backward compatibility for existing REST Controllers
 * while delegating domain logic to specialized services.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationDirectoryService directoryService;
    private final OrganizationProvisioningService provisioningService;
    private final OrganizationLifecycleService lifecycleService;
    private final OrganizationDataExportService dataExportService;
    private final OrganizationQuotaService quotaService;

    // --- Directory & Access ---

    @Transactional(readOnly = true)
    public List<Organization> getAllOrganizations() {
        return directoryService.getAllOrganizations();
    }

    @Transactional(readOnly = true)
    public Optional<Organization> getBySlug(String slug) {
        return directoryService.getBySlug(slug);
    }

    public boolean isSlugAvailable(String slug) {
        return directoryService.isSlugAvailable(slug);
    }

    @Transactional
    public Organization updateOrganization(String oldSlug, Organization updatedOrg) {
        return directoryService.updateOrganization(oldSlug, updatedOrg);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrganizationUsers(String slug) {
        return directoryService.getOrganizationUsers(slug);
    }

    // --- Provisioning & Onboarding ---

    @Transactional
    public Map<String, Object> createOrganization(OrganizationCreateRequest request) {
        return provisioningService.createOrganization(request);
    }

    @Transactional
    public Organization registerSelfService(OrganizationCreateRequest request) {
        return provisioningService.registerSelfService(request);
    }

    @Transactional
    public Map<String, Object> approveOrganization(UUID orgId) {
        return provisioningService.approveOrganization(orgId);
    }

    public boolean resetTenantRealm(String slug) {
        return provisioningService.resetTenantRealm(slug);
    }

    // --- Lifecycle & Destruction ---

    @Transactional(readOnly = true)
    public Map<String, Object> getImpactSummary(String idOrSlug) {
        return lifecycleService.getImpactSummary(idOrSlug);
    }

    @Transactional
    public void deleteOrganization(String idOrSlug) {
        lifecycleService.deleteOrganization(idOrSlug);
    }

    @Transactional
    public void deleteOrganization(String idOrSlug, String mode, String reason) {
        lifecycleService.deleteOrganization(idOrSlug, mode, reason);
    }

    @Transactional
    public void purgeOrganizationInternally(Organization org, String reason) {
        lifecycleService.purgeOrganizationInternally(org, reason);
    }

    @Transactional
    public void restoreOrganization(String idOrSlug) {
        lifecycleService.restoreOrganization(idOrSlug);
    }

    // --- Backup, Import & Spatial GIS Exports ---

    @Transactional
    public Map<String, Object> exportTenantBackup(String idOrSlug) {
        return dataExportService.exportTenantBackup(idOrSlug);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportSpatialGeoJson(String idOrSlug) {
        return dataExportService.exportSpatialGeoJson(idOrSlug);
    }

    @Transactional(readOnly = true)
    public String exportSpatialKml(String idOrSlug) {
        return dataExportService.exportSpatialKml(idOrSlug);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTenantSnapshots(String idOrSlug) {
        return dataExportService.getTenantSnapshots(idOrSlug);
    }

    @Transactional
    public Organization importTenantBackup(OrganizationImportRequest request) {
        return dataExportService.importTenantBackup(request);
    }

    // --- Quotas & Subscriptions ---

    public static String normalizePlanName(String rawPlan) {
        return OrganizationQuotaService.normalizePlanName(rawPlan);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllSubscriptionPlans() {
        return quotaService.getAllSubscriptionPlans();
    }

    @Transactional
    public boolean upgradeSubscription(String slug, String planName) {
        return quotaService.upgradeSubscription(slug, planName);
    }
}
