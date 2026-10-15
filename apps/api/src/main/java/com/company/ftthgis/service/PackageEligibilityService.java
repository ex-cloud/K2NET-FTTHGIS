package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.PackageEligibilityDto;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.PlatformPackageRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import com.company.ftthgis.domain.tenant.repository.TenantPackageSubscriptionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service Evaluasi Validasi 3 Lapis Bebas Bentrok untuk Marketplace Paket Add-on.
 *
 * <p>Aturan Lapis:
 * <ul>
 *   <li>Lapis 1: Kompatibilitas Subscription Plan (Tier Rank >= min_plan_tier)</li>
 *   <li>Lapis 2: Status Kesehatan Lisensi Tenant (license.status == ACTIVE)</li>
 *   <li>Lapis 3: Matriks Dependensi Prasyarat & Konflik Paket (prerequisite_codes & conflict_codes)</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PackageEligibilityService {

    private final TenantLicenseRepository tenantLicenseRepository;
    private final TenantPackageSubscriptionRepository subscriptionRepository;
    private final PlatformPackageRepository packageRepository;
    private final ObjectMapper objectMapper;

    /**
     * Memeriksa kelayakan tenant untuk membeli atau mengaktifkan paket tertentu.
     */
    public PackageEligibilityDto evaluateEligibility(Organization org, PlatformPackage targetPackage) {
        if (org == null || targetPackage == null) {
            return PackageEligibilityDto.builder()
                    .isEligible(false)
                    .eligibilityState("INVALID_REQUEST")
                    .message("Organisasi atau paket tidak valid.")
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();

        // 0. Cek apakah paket sudah aktif pada tenant (via langganan atau lisensi bawaan)
        List<TenantPackageSubscription> activeSubs = subscriptionRepository
                .findActiveSubscriptionsByOrganizationId(org.getId(), now);
        
        boolean alreadyActive = activeSubs.stream()
                .anyMatch(s -> s.getPlatformPackage().getId().equals(targetPackage.getId()));

        // Jika lisensi organisasi sudah mencakup fitur bawaan paket ini
        if (!alreadyActive && targetPackage.getFeatureKey() != null) {
            if ("feature.branding.whitelabel".equals(targetPackage.getFeatureKey())) {
                if ("default".equalsIgnoreCase(org.getSlug()) || "system".equalsIgnoreCase(org.getSlug())) {
                    alreadyActive = true;
                } else if (org.getSubscriptionPlan() != null && "ENTERPRISE".equalsIgnoreCase(org.getSubscriptionPlan().getName())) {
                    alreadyActive = true;
                } else {
                    Optional<TenantLicense> licOpt = tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(
                            org.getId(), LicenseStatus.ACTIVE);
                    if (licOpt.isPresent() && Boolean.TRUE.equals(licOpt.get().isFeatureCustomDomainEnabled())) {
                        alreadyActive = true;
                    }
                }
            }
        }

        if (alreadyActive) {
            return PackageEligibilityDto.builder()
                    .isEligible(false)
                    .eligibilityState("ALREADY_ACTIVE")
                    .message("Paket atau fitur ini sudah aktif pada organisasi Anda.")
                    .build();
        }

        // 1. LAPIS 1: Cek Kompatibilitas Subscription Plan Tier
        String currentPlanName = org.getSubscriptionPlan() != null && org.getSubscriptionPlan().getName() != null
                ? org.getSubscriptionPlan().getName().toUpperCase()
                : "FREE";
        
        String minRequiredTier = targetPackage.getMinPlanTier() != null
                ? targetPackage.getMinPlanTier().toUpperCase()
                : "FREE";

        int currentRank = getPlanTierRank(currentPlanName);
        int requiredRank = getPlanTierRank(minRequiredTier);

        if (currentRank < requiredRank) {
            log.info("🛡️ ELIGIBILITY: Org '{}' (Tier {}) tidak memenuhi syarat min tier {} untuk paket '{}'",
                    org.getSlug(), currentPlanName, minRequiredTier, targetPackage.getCode());
            return PackageEligibilityDto.builder()
                    .isEligible(false)
                    .eligibilityState("PLAN_UPGRADE_REQUIRED")
                    .currentPlan(currentPlanName)
                    .minRequiredPlan(minRequiredTier)
                    .message(String.format("Paket dasar Anda [%s] belum mendukung add-on ini. Minimal paket [%s].",
                            currentPlanName, minRequiredTier))
                    .build();
        }

        // 2. LAPIS 2: Cek Status Kesehatan Lisensi Tenant (Harus ACTIVE)
        Optional<TenantLicense> latestLicenseOpt = tenantLicenseRepository
                .findFirstByOrganizationIdOrderByCreatedAtDesc(org.getId());

        if (latestLicenseOpt.isEmpty() || latestLicenseOpt.get().getStatus() != LicenseStatus.ACTIVE) {
            String statusStr = latestLicenseOpt.map(l -> l.getStatus().name()).orElse("NO_LICENSE");
            log.warn("🛡️ ELIGIBILITY: Org '{}' lisensi tidak sehat (Status: {}). Add-on purchase ditolak.",
                    org.getSlug(), statusStr);
            return PackageEligibilityDto.builder()
                    .isEligible(false)
                    .eligibilityState("LICENSE_UNHEALTHY")
                    .licenseStatus(statusStr)
                    .currentPlan(currentPlanName)
                    .minRequiredPlan(minRequiredTier)
                    .message(String.format("Status lisensi utama Anda saat ini [%s]. Harap selesaikan tagihan pokok terlebih dahulu sebelum menambah paket add-on.",
                            statusStr))
                    .build();
        }

        // 3. LAPIS 3: Cek Konflik Paket (conflict_codes)
        List<String> conflictCodes = parseJsonStringList(targetPackage.getConflictCodes());
        Set<String> activePackageCodes = activeSubs.stream()
                .map(s -> s.getPlatformPackage().getCode())
                .collect(Collectors.toSet());

        List<String> matchingConflicts = conflictCodes.stream()
                .filter(activePackageCodes::contains)
                .collect(Collectors.toList());

        if (!matchingConflicts.isEmpty()) {
            return PackageEligibilityDto.builder()
                    .isEligible(false)
                    .eligibilityState("CONFLICT_DETECTED")
                    .conflictActivePackages(matchingConflicts)
                    .currentPlan(currentPlanName)
                    .message("Paket ini bertolak belakang dengan paket aktif lain yang sedang berjalan: "
                            + String.join(", ", matchingConflicts))
                    .build();
        }

        // 4. LAPIS 3: Cek Prasyarat Dependensi Paket (prerequisite_codes)
        List<String> prerequisiteCodes = parseJsonStringList(targetPackage.getPrerequisiteCodes());
        List<String> missingPrerequisites = new ArrayList<>();

        for (String reqCode : prerequisiteCodes) {
            boolean satisfiedViaAddon = activePackageCodes.contains(reqCode);
            // Pengecualian Tier Enterprise: Jika enterprise sudah mencakup fitur bawaan
            boolean satisfiedViaNativePlan = "ENTERPRISE".equalsIgnoreCase(currentPlanName);

            if (!satisfiedViaAddon && !satisfiedViaNativePlan) {
                missingPrerequisites.add(reqCode);
            }
        }

        if (!missingPrerequisites.isEmpty()) {
            log.info("🛡️ ELIGIBILITY: Org '{}' belum memiliki paket prasyarat {}", org.getSlug(), missingPrerequisites);
            return PackageEligibilityDto.builder()
                    .isEligible(false)
                    .eligibilityState("PREREQUISITE_REQUIRED")
                    .missingPrerequisites(missingPrerequisites)
                    .currentPlan(currentPlanName)
                    .minRequiredPlan(minRequiredTier)
                    .message("Paket ini membutuhkan paket prasyarat aktif: " + String.join(", ", missingPrerequisites))
                    .build();
        }

        // Seluruh lapis lulus
        return PackageEligibilityDto.builder()
                .isEligible(true)
                .eligibilityState("READY")
                .currentPlan(currentPlanName)
                .minRequiredPlan(minRequiredTier)
                .licenseStatus(LicenseStatus.ACTIVE.name())
                .message("Syarat terpenuhi. Paket siap dibeli dan diaktifkan.")
                .build();
    }

    /**
     * Konversi string nama tier ke bobot numerik terurut.
     */
    public int getPlanTierRank(String planName) {
        if (planName == null) return 0;
        return switch (planName.toUpperCase()) {
            case "ENTERPRISE" -> 3;
            case "PRO" -> 2;
            case "STARTER" -> 1;
            default -> 0; // FREE / TRIAL
        };
    }

    public List<String> parseJsonStringList(String json) {
        if (json == null || json.isBlank() || "[]".equals(json.trim())) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Gagal parse JSON list: {}", json);
            return Collections.emptyList();
        }
    }
}
