package com.company.ftthgis.service;

import com.company.ftthgis.api.exception.QuotaExceededException;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.entity.TenantPackageSubscription;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import com.company.ftthgis.domain.tenant.repository.TenantPackageSubscriptionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectQuotaService {

    private final ProjectRepository projectRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final com.company.ftthgis.domain.network.repository.NetworkNodeRepository networkNodeRepository;
    private final TenantLicenseRepository tenantLicenseRepository;
    private final TenantPackageSubscriptionRepository tenantPackageSubscriptionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Hitung batas maksimum proyek aktif (Active Projects Limit)
     * Memprioritaskan: License Overrides > Booster & Config Override > Base Plan Limit + Active Package Boosters.
     */
    public int getEffectiveMaxProjects(Organization org) {
        if (org == null) return 0;

        int baseLimit;
        // 1. Prioritas Utama: Custom Override dari Lisensi Aktif
        if (tenantLicenseRepository != null && org.getId() != null) {
            Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);
            if (activeLicenseOpt.isPresent() && activeLicenseOpt.get().getOverrideMaxProjects() != null) {
                baseLimit = activeLicenseOpt.get().getOverrideMaxProjects();
            } else {
                SubscriptionPlan plan = org.getSubscriptionPlan();
                int basePlanLimit = (plan != null && plan.getMaxProjects() != null) ? plan.getMaxProjects() : 6;
                baseLimit = getConfigInt(org, "max_projects", getConfigInt(org, "max_olts", basePlanLimit));
            }
        } else {
            SubscriptionPlan plan = org.getSubscriptionPlan();
            int basePlanLimit = (plan != null && plan.getMaxProjects() != null) ? plan.getMaxProjects() : 6;
            baseLimit = getConfigInt(org, "max_projects", getConfigInt(org, "max_olts", basePlanLimit));
        }

        // Booster kuota: Legacy booster + Active Add-on Packages booster (deltaOlts)
        int legacyBooster = (org.isBoosterActive() && org.getBoosterOlts() != null) ? org.getBoosterOlts() : 0;
        int packageBooster = getActivePackageDelta(org.getId(), "deltaOlts");
        return baseLimit + legacyBooster + packageBooster;
    }

    /**
     * Hitung batas maksimum proyek terarsip (Archived Projects Limit)
     * Memperhitungkan config override (max_archived_projects) dan subscription plan.
     */
    public int getEffectiveMaxArchived(Organization org) {
        SubscriptionPlan plan = org.getSubscriptionPlan();
        int basePlanLimit = (plan != null && plan.getMaxArchivedProjects() != null) ? plan.getMaxArchivedProjects() : 1;
        
        return getConfigInt(org, "max_archived_projects", basePlanLimit);
    }

    /**
     * Hitung batas maksimum ODP aktif (Billable ODP Limit)
     * Memprioritaskan: License Overrides > Booster & Config Override > Base Plan Limit + Active Package Boosters.
     */
    public int getEffectiveMaxOdps(Organization org) {
        if (org == null) return 0;

        int baseLimit;
        // 1. Prioritas Utama: Custom Override dari Lisensi Aktif
        if (tenantLicenseRepository != null && org.getId() != null) {
            Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);
            if (activeLicenseOpt.isPresent() && activeLicenseOpt.get().getOverrideMaxOdps() != null) {
                baseLimit = activeLicenseOpt.get().getOverrideMaxOdps();
            } else {
                SubscriptionPlan plan = org.getSubscriptionPlan();
                int basePlanLimit = (plan != null && plan.getMaxOdps() != null) ? plan.getMaxOdps() : 2500;
                baseLimit = getConfigInt(org, "max_odps", basePlanLimit);
            }
        } else {
            SubscriptionPlan plan = org.getSubscriptionPlan();
            int basePlanLimit = (plan != null && plan.getMaxOdps() != null) ? plan.getMaxOdps() : 2500;
            baseLimit = getConfigInt(org, "max_odps", basePlanLimit);
        }

        // Booster kuota: Legacy booster + Active Add-on Packages booster (deltaOdps)
        int legacyBooster = (org.isBoosterActive() && org.getBoosterOdps() != null) ? org.getBoosterOdps() : 0;
        int packageBooster = getActivePackageDelta(org.getId(), "deltaOdps");
        return baseLimit + legacyBooster + packageBooster;
    }

    private int getActivePackageDelta(UUID orgId, String deltaKey) {
        if (tenantPackageSubscriptionRepository == null || orgId == null) return 0;
        try {
            List<TenantPackageSubscription> subs = tenantPackageSubscriptionRepository
                    .findActiveSubscriptionsByOrganizationId(orgId, LocalDateTime.now());
            int sum = 0;
            for (TenantPackageSubscription sub : subs) {
                String json = sub.getPlatformPackage().getQuotaDeltaJson();
                if (json != null && !json.isBlank() && json.contains(deltaKey)) {
                    JsonNode node = objectMapper.readTree(json);
                    if (node.has(deltaKey)) {
                        sum += node.get(deltaKey).asInt(0);
                    }
                }
            }
            return sum;
        } catch (Exception e) {
            log.warn("Error calculating package quota delta for key '{}': {}", deltaKey, e.getMessage());
            return 0;
        }
    }

    /**
     * Hitung jumlah proyek aktif riil di database
     */
    public long getUsedActiveProjects(UUID orgId) {
        return projectRepository.countByOrganizationIdAndStatus(orgId, Project.ProjectStatus.ACTIVE);
    }

    /**
     * Hitung jumlah proyek terarsip riil di database
     */
    public long getUsedArchivedProjects(UUID orgId) {
        return projectRepository.countByOrganizationIdAndStatus(orgId, Project.ProjectStatus.ARCHIVED);
    }

    /**
     * Hitung jumlah ODP billable riil di database
     */
    public long getUsedBillableOdps(UUID orgId) {
        return networkNodeRepository.countBillableOdpsByOrganizationId(orgId);
    }

    /**
     * Validasi apakah organisasi diizinkan membuat / mengaktifkan proyek baru
     * Melempar QuotaExceededException (HTTP 409) jika kuota penuh.
     */
    @Transactional(readOnly = true)
    public void assertCanActivate(Organization org) {
        int effectiveMax = getEffectiveMaxProjects(org);
        long currentActive = getUsedActiveProjects(org.getId());

        if (currentActive >= effectiveMax) {
            log.warn("🚫 Quota Exceeded: Organization {} reached active projects limit ({}/{})",
                    org.getName(), currentActive, effectiveMax);
            throw new QuotaExceededException(
                    "PROJECT_QUOTA_EXCEEDED",
                    "Quota exceeded: Your current plan allows up to " + effectiveMax +
                            " active FTTH projects. Please archive an existing project or upgrade your plan.",
                    (int) currentActive,
                    effectiveMax
            );
        }
    }

    /**
     * Validasi alokasi ODP baru (saat promosi zona dari PLANNING ke CONSTRUCTION/LIVE)
     * Melempar QuotaExceededException jika kuota ODP terlampaui.
     */
    @Transactional(readOnly = true)
    public void assertCanAllocateOdps(Organization org, int additionalOdps) {
        if (additionalOdps <= 0) return;
        int effectiveMax = getEffectiveMaxOdps(org);
        long currentUsed = getUsedBillableOdps(org.getId());
        long projectedUsed = currentUsed + additionalOdps;

        if (projectedUsed > effectiveMax) {
            log.warn("🚫 ODP Quota Exceeded: Org {} cannot allocate {} additional ODPs ({}/{} max)",
                    org.getName(), additionalOdps, projectedUsed, effectiveMax);
            throw new QuotaExceededException(
                    "ODP_QUOTA_EXCEEDED",
                    "Zone promotion rejected: Promoting this zone requires " + additionalOdps +
                            " ODP slots, but your organization only has " + (effectiveMax - currentUsed) +
                            " remaining slots (" + currentUsed + "/" + effectiveMax + " used). Please upgrade your subscription plan.",
                    (int) projectedUsed,
                    effectiveMax
            );
        }
    }

    /**
     * Validasi apakah organisasi diizinkan mengarsipkan proyek
     * Melempar QuotaExceededException (HTTP 409) jika slot arsip penuh.
     */
    @Transactional(readOnly = true)
    public void assertCanArchive(Organization org) {
        int maxArchived = getEffectiveMaxArchived(org);
        long currentArchived = getUsedArchivedProjects(org.getId());

        if (currentArchived >= maxArchived) {
            log.warn("🚫 Archive Limit Exceeded: Organization {} reached archived projects limit ({}/{})",
                    org.getName(), currentArchived, maxArchived);
            throw new QuotaExceededException(
                    "ARCHIVE_QUOTA_EXCEEDED",
                    "Archive limit reached: Your current plan allows up to " + maxArchived +
                            " archived projects. Please restore or permanently delete an existing archived project.",
                    (int) currentArchived,
                    maxArchived
            );
        }
    }

    private int getConfigInt(Organization org, String key, int defaultValue) {
        try {
            return organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(org, key)
                    .map(c -> Integer.parseInt(c.getConfigValue()))
                    .orElse(defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
