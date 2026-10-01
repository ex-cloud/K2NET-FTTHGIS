/**
 * Domain services for Organization lifecycle, provisioning, directory, quotas, and spatial data exports.
 *
 * <h2>Domain Services:</h2>
 * <ul>
 *   <li>{@link com.company.ftthgis.service.organization.OrganizationDirectoryService} - Tenant directory, slug validation, user queries.</li>
 *   <li>{@link com.company.ftthgis.service.organization.OrganizationProvisioningService} - Self-service registration, Super Admin approval, Keycloak realm provisioning.</li>
 *   <li>{@link com.company.ftthgis.service.organization.OrganizationLifecycleService} - Soft delete (30-day grace), restore, and topological cascade nuclear purge. Includes Impersonation Guard protection.</li>
 *   <li>{@link com.company.ftthgis.service.organization.OrganizationDataExportService} - JSON backup snapshotting, spatial GeoJSON/KML exports, and snapshot imports.</li>
 *   <li>{@link com.company.ftthgis.service.organization.OrganizationQuotaService} - Subscription plan tiers, capacity quota calculations, plan upgrades.</li>
 * </ul>
 *
 * <h2>Facade:</h2>
 * <ul>
 *   <li>{@link com.company.ftthgis.service.OrganizationService} - Thin facade maintaining 100% backward compatibility for all REST controllers.</li>
 * </ul>
 */
package com.company.ftthgis.service.organization;
