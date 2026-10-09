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
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectQuotaService {

    private final ProjectRepository projectRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final com.company.ftthgis.domain.network.repository.NetworkNodeRepository networkNodeRepository;
    private final TenantLicenseRepository tenantLicenseRepository;

    /**
     * Hitung batas maksimum proyek aktif (Active Projects Limit)
     * Memprioritaskan: License Overrides > Booster & Config Override > Base Plan Limit.
     */
    public int getEffectiveMaxProjects(Organization org) {
        if (org == null) return 0;

        // 1. Prioritas Utama: Custom Override dari Lisensi Aktif
        if (tenantLicenseRepository != null && org.getId() != null) {
            Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);
            if (activeLicenseOpt.isPresent() && activeLicenseOpt.get().getOverrideMaxProjects() != null) {
                return activeLicenseOpt.get().getOverrideMaxProjects();
            }
        }

        SubscriptionPlan plan = org.getSubscriptionPlan();
        int basePlanLimit = (plan != null && plan.getMaxProjects() != null) ? plan.getMaxProjects() : 6;
        
        // Cek override config di organization_configs (cek 'max_projects', fallback 'max_olts')
        int baseLimit = getConfigInt(org, "max_projects", getConfigInt(org, "max_olts", basePlanLimit));
        
        // Booster kuota
        int booster = (org.isBoosterActive() && org.getBoosterOlts() != null) ? org.getBoosterOlts() : 0;
        return baseLimit + booster;
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
     * Memprioritaskan: License Overrides > Booster & Config Override > Base Plan Limit.
     */
    public int getEffectiveMaxOdps(Organization org) {
        if (org == null) return 0;

        // 1. Prioritas Utama: Custom Override dari Lisensi Aktif
        if (tenantLicenseRepository != null && org.getId() != null) {
            Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);
            if (activeLicenseOpt.isPresent() && activeLicenseOpt.get().getOverrideMaxOdps() != null) {
                return activeLicenseOpt.get().getOverrideMaxOdps();
            }
        }

        SubscriptionPlan plan = org.getSubscriptionPlan();
        int basePlanLimit = (plan != null && plan.getMaxOdps() != null) ? plan.getMaxOdps() : 2500;
        int booster = (org.isBoosterActive() && org.getBoosterOdps() != null) ? org.getBoosterOdps() : 0;
        return getConfigInt(org, "max_odps", basePlanLimit) + booster;
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
