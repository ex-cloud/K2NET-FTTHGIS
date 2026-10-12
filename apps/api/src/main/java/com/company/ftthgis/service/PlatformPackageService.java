package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.CreatePackageRequest;
import com.company.ftthgis.api.system.dto.PackageKpiOverviewDto;
import com.company.ftthgis.api.system.dto.UpdatePackageRequest;
import com.company.ftthgis.api.tenant.dto.PackageResponseDto;
import com.company.ftthgis.domain.tenant.entity.PackageBillingType;
import com.company.ftthgis.domain.tenant.entity.PackageSubscriptionStatus;
import com.company.ftthgis.domain.tenant.entity.PlatformPackage;
import com.company.ftthgis.domain.tenant.repository.PlatformPackageRepository;
import com.company.ftthgis.domain.tenant.repository.TenantPackageSubscriptionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service Tata Kelola Katalog Master Paket Platform K2NET (Control Plane / Super Admin).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformPackageService {

    private final PlatformPackageRepository packageRepository;
    private final TenantPackageSubscriptionRepository subscriptionRepository;
    private final PackageEligibilityService eligibilityService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<PackageResponseDto> getAllPackagesAdmin() {
        return packageRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PackageResponseDto> getPublishedPackages() {
        return packageRepository.findByIsPublishedTrueOrderBySortOrderAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PackageResponseDto getPackageById(UUID id) {
        return packageRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paket tidak ditemukan."));
    }

    @Transactional(readOnly = true)
    public PackageKpiOverviewDto getKpiOverview() {
        long totalPackages = packageRepository.count();
        long publishedPackages = packageRepository.countByIsPublishedTrue();
        long activeSubscriptions = subscriptionRepository.findAll().stream()
                .filter(s -> s.getStatus() == PackageSubscriptionStatus.ACTIVE)
                .count();
        long distinctTenants = subscriptionRepository.countDistinctActiveTenants();

        // Hitung estimasi MRR add-on dari seluruh langganan aktif RECURRING_MONTHLY
        BigDecimal estimatedMrr = subscriptionRepository.findAll().stream()
                .filter(s -> s.getStatus() == PackageSubscriptionStatus.ACTIVE)
                .filter(s -> s.getPlatformPackage().getBillingType() == PackageBillingType.RECURRING_MONTHLY)
                .map(s -> s.getPlatformPackage().getPriceMonthly())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PackageKpiOverviewDto.builder()
                .totalPackages(totalPackages)
                .publishedPackages(publishedPackages)
                .activeSubscriptions(activeSubscriptions)
                .distinctSubscribedTenants(distinctTenants)
                .estimatedAddonMrr(estimatedMrr)
                .build();
    }

    @Transactional
    public PackageResponseDto createPackage(CreatePackageRequest request) {
        if (packageRepository.existsByCode(request.getCode().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kode paket '" + request.getCode() + "' sudah terdaftar.");
        }

        String prereqJson = writeJson(request.getPrerequisiteCodes());
        String conflictJson = writeJson(request.getConflictCodes());

        PlatformPackage pkg = PlatformPackage.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .category(request.getCategory())
                .billingType(request.getBillingType() != null ? request.getBillingType() : PackageBillingType.RECURRING_MONTHLY)
                .priceMonthly(request.getPriceMonthly())
                .minPlanTier(request.getMinPlanTier() != null ? request.getMinPlanTier().toUpperCase() : "FREE")
                .prerequisiteCodes(prereqJson)
                .conflictCodes(conflictJson)
                .featureKey(request.getFeatureKey() != null ? request.getFeatureKey().trim() : null)
                .quotaDeltaJson(request.getQuotaDeltaJson() != null ? request.getQuotaDeltaJson().trim() : "{}")
                .metadataJson(request.getMetadataJson() != null ? request.getMetadataJson().trim() : "{}")
                .isPublished(request.isPublished())
                .iconName(request.getIconName() != null ? request.getIconName().trim() : "Package")
                .badgeLabel(request.getBadgeLabel() != null ? request.getBadgeLabel().trim() : null)
                .sortOrder(request.getSortOrder())
                .build();

        PlatformPackage saved = packageRepository.save(pkg);
        log.info("📦 PACKAGE CREATED: Code '{}' [{}] oleh sistem", saved.getCode(), saved.getName());
        return mapToDto(saved);
    }

    @Transactional
    public PackageResponseDto updatePackage(UUID id, UpdatePackageRequest request) {
        PlatformPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paket tidak ditemukan."));

        pkg.setName(request.getName().trim());
        pkg.setCategory(request.getCategory());
        if (request.getBillingType() != null) pkg.setBillingType(request.getBillingType());
        if (request.getPriceMonthly() != null) pkg.setPriceMonthly(request.getPriceMonthly());
        if (request.getMinPlanTier() != null) pkg.setMinPlanTier(request.getMinPlanTier().toUpperCase());
        if (request.getPrerequisiteCodes() != null) pkg.setPrerequisiteCodes(writeJson(request.getPrerequisiteCodes()));
        if (request.getConflictCodes() != null) pkg.setConflictCodes(writeJson(request.getConflictCodes()));
        if (request.getFeatureKey() != null) pkg.setFeatureKey(request.getFeatureKey().trim());
        if (request.getQuotaDeltaJson() != null) pkg.setQuotaDeltaJson(request.getQuotaDeltaJson().trim());
        if (request.getMetadataJson() != null) pkg.setMetadataJson(request.getMetadataJson().trim());
        if (request.getIsPublished() != null) pkg.setPublished(request.getIsPublished());
        if (request.getIconName() != null) pkg.setIconName(request.getIconName().trim());
        if (request.getBadgeLabel() != null) pkg.setBadgeLabel(request.getBadgeLabel().trim());
        if (request.getSortOrder() != null) pkg.setSortOrder(request.getSortOrder());

        PlatformPackage updated = packageRepository.save(pkg);
        log.info("📦 PACKAGE UPDATED: Code '{}' [{}]", updated.getCode(), updated.getName());
        return mapToDto(updated);
    }

    @Transactional
    public PackageResponseDto togglePublish(UUID id) {
        PlatformPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paket tidak ditemukan."));

        pkg.setPublished(!pkg.isPublished());
        PlatformPackage updated = packageRepository.save(pkg);
        log.info("📦 PACKAGE TOGGLED: Code '{}' published={}", updated.getCode(), updated.isPublished());
        return mapToDto(updated);
    }

    @Transactional
    public void deletePackage(UUID id) {
        PlatformPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paket tidak ditemukan."));

        long activeSubs = subscriptionRepository.countByPlatformPackageIdAndStatus(id, PackageSubscriptionStatus.ACTIVE);
        if (activeSubs > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Paket tidak dapat dihapus karena masih memiliki " + activeSubs + " langganan aktif. Silakan unpublish paket.");
        }

        packageRepository.delete(pkg);
        log.info("📦 PACKAGE DELETED: Code '{}'", pkg.getCode());
    }

    public PackageResponseDto mapToDto(PlatformPackage pkg) {
        return PackageResponseDto.builder()
                .id(pkg.getId())
                .code(pkg.getCode())
                .name(pkg.getName())
                .category(pkg.getCategory())
                .billingType(pkg.getBillingType())
                .priceMonthly(pkg.getPriceMonthly())
                .minPlanTier(pkg.getMinPlanTier())
                .prerequisiteCodes(eligibilityService.parseJsonStringList(pkg.getPrerequisiteCodes()))
                .conflictCodes(eligibilityService.parseJsonStringList(pkg.getConflictCodes()))
                .featureKey(pkg.getFeatureKey())
                .quotaDeltaJson(pkg.getQuotaDeltaJson())
                .metadataJson(pkg.getMetadataJson())
                .isPublished(pkg.isPublished())
                .iconName(pkg.getIconName())
                .badgeLabel(pkg.getBadgeLabel())
                .sortOrder(pkg.getSortOrder())
                .createdAt(pkg.getCreatedAt())
                .updatedAt(pkg.getUpdatedAt())
                .build();
    }

    private String writeJson(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
