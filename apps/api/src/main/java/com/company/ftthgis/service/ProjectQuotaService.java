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
    private final jakarta.persistence.EntityManager entityManager;

    public void evictQuotaCache(UUID orgId) {
        if (orgId == null) return;
        try {
            if (entityManager != null && entityManager.getEntityManagerFactory() != null) {
                jakarta.persistence.Cache cache = entityManager.getEntityManagerFactory().getCache();
                if (cache != null) {
                    cache.evict(Organization.class, orgId);
                    cache.evict(TenantLicense.class);
                }
            }
            log.info("🧹 Evicted L2 quota cache for org {}", orgId);
        } catch (Exception e) {
            log.warn("Cache eviction warning for org {}: {}", orgId, e.getMessage());
        }
    }

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

    public int getActivePackageDelta(UUID orgId, String deltaKey) {
        if (tenantPackageSubscriptionRepository == null || orgId == null) return 0;
        try {
            List<TenantPackageSubscription> subs = tenantPackageSubscriptionRepository
                    .findActiveSubscriptionsByOrganizationId(orgId, LocalDateTime.now());
            int sum = 0;
            for (TenantPackageSubscription sub : subs) {
                String json = sub.getPlatformPackage().getQuotaDeltaJson();
                if (json != null && !json.isBlank()) {
                    JsonNode node = objectMapper.readTree(json);
                    if (node.has(deltaKey)) {
                        sum += node.get(deltaKey).asInt(0);
                    } else if ("deltaOlts".equalsIgnoreCase(deltaKey)) {
                        if (node.has("olt")) sum += node.get("olt").asInt(0);
                        else if (node.has("olts")) sum += node.get("olts").asInt(0);
                        else if (node.has("extraOlts")) sum += node.get("extraOlts").asInt(0);
                    } else if ("deltaOdps".equalsIgnoreCase(deltaKey)) {
                        if (node.has("odp")) sum += node.get("odp").asInt(0);
                        else if (node.has("odps")) sum += node.get("odps").asInt(0);
                        else if (node.has("extraOdps")) sum += node.get("extraOdps").asInt(0);
                    } else if ("deltaStorageGb".equalsIgnoreCase(deltaKey)) {
                        if (node.has("storageGb")) sum += node.get("storageGb").asInt(0);
                        else if (node.has("storage")) sum += node.get("storage").asInt(0);
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
     * Mengambil seluruh akumulasi penambahan kuota dari paket aktif tenant.
     */
    public java.util.Map<String, Integer> getActiveQuotaDeltas(UUID orgId) {
        java.util.Map<String, Integer> map = new java.util.HashMap<>();
        map.put("deltaOlts", getActivePackageDelta(orgId, "deltaOlts"));
        map.put("deltaOdps", getActivePackageDelta(orgId, "deltaOdps"));
        map.put("deltaStorageGb", getActivePackageDelta(orgId, "deltaStorageGb"));
        return map;
    }

    /**
     * Mengambil ringkasan kuota lengkap (kapasitas dasar + booster aktif + pemakaian saat ini).
     */
    public java.util.Map<String, Object> getQuotaSummary(Organization org) {
        if (org == null) return java.util.Map.of();
        int maxProjects = getEffectiveMaxProjects(org);
        long usedProjects = getUsedActiveProjects(org.getId());
        int maxOdps = getEffectiveMaxOdps(org);
        long usedOdps = getUsedBillableOdps(org.getId());
        int boosterOlts = getActivePackageDelta(org.getId(), "deltaOlts");
        int boosterOdps = getActivePackageDelta(org.getId(), "deltaOdps");

        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        int maxOlts = getEffectiveMaxOlts(org);
        long usedOlts = getUsedOlts(org.getId());
        int maxStorageGb = getEffectiveMaxStorageGb(org);
        int boosterStorageGb = getActivePackageDelta(org.getId(), "deltaStorageGb");
        summary.put("effectiveMaxProjects", maxProjects);
        summary.put("usedProjects", usedProjects);
        summary.put("effectiveMaxOlts", maxOlts);
        summary.put("usedOlts", usedOlts);
        summary.put("packageBoosterOlts", boosterOlts);
        summary.put("effectiveMaxOdps", maxOdps);
        summary.put("usedOdps", usedOdps);
        summary.put("packageBoosterOdps", boosterOdps);
        summary.put("effectiveMaxStorageGb", maxStorageGb);
        summary.put("packageBoosterStorageGb", boosterStorageGb);
        return summary;
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
                    "ODP quota exceeded: Allocating " + additionalOdps +
                            " ODP(s) rejected. Your organization only has " + (effectiveMax - currentUsed) +
                            " remaining slots (" + currentUsed + "/" + effectiveMax + " used). Please activate PKG_BOOSTER_ODP_100 in the Marketplace or upgrade your plan.",
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

    /**
     * Hitung batas maksimum OLT aktif (Hardware OLT Limit)
     * Memprioritaskan: License Overrides > Booster & Config Override > Base Plan Limit + Active Package Boosters.
     */
    public int getEffectiveMaxOlts(Organization org) {
        if (org == null) return 0;

        int baseLimit;
        if (tenantLicenseRepository != null && org.getId() != null) {
            Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);
            if (activeLicenseOpt.isPresent() && activeLicenseOpt.get().getOverrideMaxProjects() != null) {
                baseLimit = activeLicenseOpt.get().getOverrideMaxProjects();
            } else {
                SubscriptionPlan plan = org.getSubscriptionPlan();
                int basePlanLimit = (plan != null && plan.getMaxProjects() != null) ? plan.getMaxProjects() : 2;
                baseLimit = getConfigInt(org, "max_olts", getConfigInt(org, "max_projects", basePlanLimit));
            }
        } else {
            SubscriptionPlan plan = org.getSubscriptionPlan();
            int basePlanLimit = (plan != null && plan.getMaxProjects() != null) ? plan.getMaxProjects() : 2;
            baseLimit = getConfigInt(org, "max_olts", getConfigInt(org, "max_projects", basePlanLimit));
        }

        int legacyBooster = (org.isBoosterActive() && org.getBoosterOlts() != null) ? org.getBoosterOlts() : 0;
        int packageBooster = getActivePackageDelta(org.getId(), "deltaOlts");
        return baseLimit + legacyBooster + packageBooster;
    }

    /**
     * Hitung jumlah OLT terdaftar di database untuk organisasi
     */
    public long getUsedOlts(UUID orgId) {
        if (orgId == null || networkNodeRepository == null) return 0;
        return networkNodeRepository.countByOrganizationIdAndNodeType(orgId, "OLT");
    }

    /**
     * Validasi pendaftaran OLT baru (Hardware Capacity Check)
     * Melempar QuotaExceededException jika kuota OLT telah tercapai.
     */
    @Transactional(readOnly = true)
    public void assertCanCreateOlt(Organization org) {
        if (org == null) return;
        int effectiveMax = getEffectiveMaxOlts(org);
        long currentUsed = getUsedOlts(org.getId());

        if (currentUsed >= effectiveMax) {
            log.warn("🚫 OLT Quota Exceeded: Organization {} reached OLT hardware limit ({}/{})",
                    org.getName(), currentUsed, effectiveMax);
            throw new QuotaExceededException(
                    "OLT_QUOTA_EXCEEDED",
                    "OLT hardware quota exceeded: Your current plan and active boosters allow up to " + effectiveMax +
                            " OLTs (" + currentUsed + "/" + effectiveMax + " registered). Please activate PKG_BOOSTER_OLT_5 in the Marketplace or upgrade your plan.",
                    (int) currentUsed,
                    effectiveMax
            );
        }
    }

    /**
     * Hitung batas maksimum Media Storage MinIO S3 (dalam GB)
     * Memprioritaskan: License Overrides > Booster & Config Override > Base Plan Limit + Active Package Boosters.
     */
    public int getEffectiveMaxStorageGb(Organization org) {
        if (org == null) return 0;

        int baseLimit;
        if (tenantLicenseRepository != null && org.getId() != null) {
            Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);
            if (activeLicenseOpt.isPresent() && activeLicenseOpt.get().getOverrideMaxStorageGb() != null) {
                baseLimit = activeLicenseOpt.get().getOverrideMaxStorageGb();
            } else {
                SubscriptionPlan plan = org.getSubscriptionPlan();
                int defaultTierStorage = "ENTERPRISE".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 500 :
                        "PRO".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 100 :
                        "STARTER".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 15 : 2;
                baseLimit = getConfigInt(org, "max_storage_gb", defaultTierStorage);
            }
        } else {
            SubscriptionPlan plan = org.getSubscriptionPlan();
            int defaultTierStorage = "ENTERPRISE".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 500 :
                    "PRO".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 100 :
                    "STARTER".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 15 : 2;
            baseLimit = getConfigInt(org, "max_storage_gb", defaultTierStorage);
        }

        int packageBooster = getActivePackageDelta(org.getId(), "deltaStorageGb");
        return baseLimit + packageBooster;
    }

    /**
     * Validasi kapasitas penyimpanan media MinIO S3 sebelum upload
     * Melempar QuotaExceededException jika kuota byte terlampaui.
     */
    public void assertCanUploadBytes(Organization org, long fileSizeBytes, long currentUsedBytes) {
        if (org == null || fileSizeBytes <= 0) return;

        // 🛡️ License Status Check: Enforce Read-Only and Suspended/Revoked Locks
        if (tenantLicenseRepository != null && org.getId() != null) {
            Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);
            if (activeLicenseOpt.isEmpty()) {
                activeLicenseOpt = tenantLicenseRepository
                        .findFirstByOrganizationIdOrderByCreatedAtDesc(org.getId());
            }
            if (activeLicenseOpt.isPresent()) {
                LicenseStatus status = activeLicenseOpt.get().getStatus();
                if (status == LicenseStatus.RESTRICTED_READ_ONLY) {
                    log.warn("🛡️ Upload blocked: Org '{}' license is RESTRICTED_READ_ONLY", org.getSlug());
                    throw new QuotaExceededException(
                            "LICENSE_RESTRICTED_READ_ONLY",
                            "Operasi unggah berkas ditolak: Lisensi organisasi berada dalam mode Read-Only (kedaluwarsa). Silakan perpanjang lisensi Anda.",
                            0, 0
                    );
                } else if (status == LicenseStatus.SUSPENDED || status == LicenseStatus.REVOKED) {
                    log.warn("🛡️ Upload blocked: Org '{}' license is {}", org.getSlug(), status);
                    throw new QuotaExceededException(
                            "LICENSE_SUSPENDED",
                            "Operasi unggah berkas ditolak: Lisensi organisasi telah ditangguhkan atau dicabut.",
                            0, 0
                    );
                }
            }
        }

        int maxStorageGb = getEffectiveMaxStorageGb(org);
        long maxStorageBytes = (long) maxStorageGb * 1024L * 1024L * 1024L;
        long projectedBytes = currentUsedBytes + fileSizeBytes;

        if (projectedBytes > maxStorageBytes) {
            log.warn("🚫 Storage Quota Exceeded: Org {} cannot upload {} bytes ({}/{} bytes used)",
                    org.getName(), fileSizeBytes, projectedBytes, maxStorageBytes);
            throw new QuotaExceededException(
                    "STORAGE_QUOTA_EXCEEDED",
                    "Storage quota exceeded: Uploading " + (fileSizeBytes / (1024 * 1024)) +
                            " MB rejected. Your organization storage is at capacity (" +
                            (currentUsedBytes / (1024 * 1024)) + "/" + (maxStorageBytes / (1024 * 1024)) +
                            " MB used). Please activate PKG_BOOSTER_STORAGE_50 in the Marketplace or upgrade your plan.",
                    (int) (projectedBytes / (1024 * 1024)),
                    (int) (maxStorageBytes / (1024 * 1024))
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
