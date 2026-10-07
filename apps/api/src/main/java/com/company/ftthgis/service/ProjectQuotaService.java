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

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectQuotaService {

    private final ProjectRepository projectRepository;
    private final OrganizationConfigRepository organizationConfigRepository;

    /**
     * Hitung batas maksimum proyek aktif (Active Projects Limit)
     * Memperhitungkan config override (max_projects / max_olts), subscription plan, dan booster aktif.
     */
    public int getEffectiveMaxProjects(Organization org) {
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
