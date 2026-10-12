package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.GrantPackageRequest;
import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Service Tata Kelola Langganan Add-on Marketplace Tenant (Application Plane / Self-Service).
 *
 * <p>Mencakup:
 * <ul>
 *   <li>Katalog marketplace dengan status kelayakan 3-lapis dinamis</li>
 *   <li>Pemesanan paket dengan kalkulasi pro-rata co-termed dan dukungan auto-bundle prasyarat</li>
 *   <li>Pemberian hak akses POC/Trial gratis oleh Super Admin</li>
 *   <li>Sinkronisasi dan invalidasi Redis cache performa tinggi (<20ms)</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantPackageSubscriptionService {

    private static final String REDIS_KEY_PREFIX = "tenant:packages:";
    private static final long CACHE_TTL_HOURS = 1;

    private final PlatformPackageRepository packageRepository;
    private final TenantPackageSubscriptionRepository subscriptionRepository;
    private final OrganizationRepository organizationRepository;
    private final TenantLicenseRepository tenantLicenseRepository;
    private final BillingInvoiceRepository billingInvoiceRepository;
    private final PackageEligibilityService eligibilityService;
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Mengambil katalog marketplace lengkap beserta evaluasi status kelayakan tenant pemanggil.
     */
    @Transactional(readOnly = true)
    public List<PackageResponseDto> getMarketplaceCatalog(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organisasi tenant tidak ditemukan."));

        LocalDateTime now = LocalDateTime.now();
        List<TenantPackageSubscription> activeSubs = subscriptionRepository
                .findActiveSubscriptionsByOrganizationId(orgId, now);

        Map<UUID, TenantPackageSubscription> activeMap = activeSubs.stream()
                .collect(Collectors.toMap(s -> s.getPlatformPackage().getId(), s -> s, (a, b) -> a));

        List<PlatformPackage> allPackages = packageRepository.findByIsPublishedTrueOrderBySortOrderAsc();

        return allPackages.stream().map(pkg -> {
            PackageResponseDto dto = mapToPackageDto(pkg);
            boolean isSubscribed = activeMap.containsKey(pkg.getId());
            dto.setSubscribed(isSubscribed);

            if (isSubscribed) {
                dto.setCurrentExpiresAt(activeMap.get(pkg.getId()).getExpiresAt());
                dto.setEligibility(PackageEligibilityDto.builder()
                        .isEligible(false)
                        .eligibilityState("ALREADY_ACTIVE")
                        .message("Paket ini sedang aktif.")
                        .build());
            } else {
                PackageEligibilityDto eligibility = eligibilityService.evaluateEligibility(org, pkg);
                dto.setEligibility(eligibility);
            }
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Mengambil daftar seluruh langganan paket aktif milik tenant.
     */
    @Transactional(readOnly = true)
    public List<TenantPackageSubscriptionDto> getActiveSubscriptions(UUID orgId) {
        LocalDateTime now = LocalDateTime.now();
        return subscriptionRepository.findActiveSubscriptionsByOrganizationId(orgId, now).stream()
                .map(this::mapToSubscriptionDto)
                .collect(Collectors.toList());
    }

    /**
     * Memproses pesanan paket add-on dengan validasi 3 lapis, pro-rata co-termed, dan faktur penagihan.
     */
    @Transactional
    public OrderPackageResponseDto orderPackage(UUID orgId, OrderPackageRequest request, String callerUser) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organisasi tenant tidak ditemukan."));

        PlatformPackage targetPackage = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paket add-on tidak ditemukan."));

        LocalDateTime now = LocalDateTime.now();

        // 1. Evaluasi Kelayakan
        PackageEligibilityDto eligibility = eligibilityService.evaluateEligibility(org, targetPackage);
        List<PlatformPackage> packagesToActivate = new ArrayList<>();
        packagesToActivate.add(targetPackage);

        if (!eligibility.isEligible()) {
            // Auto-bundle handling
            if ("PREREQUISITE_REQUIRED".equals(eligibility.getEligibilityState()) && request.isIncludePrerequisites()) {
                List<String> missingPrereqs = eligibility.getMissingPrerequisites();
                for (String code : missingPrereqs) {
                    PlatformPackage prereqPkg = packageRepository.findByCode(code)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                    "Paket prasyarat " + code + " tidak ditemukan di katalog master."));
                    packagesToActivate.add(prereqPkg);
                }
                log.info("📦 AUTO-BUNDLE: Menambahkan {} paket prasyarat ke pesanan org '{}'",
                        missingPrereqs.size(), org.getSlug());
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, eligibility.getMessage());
            }
        }

        // 2. Dapatkan Lisensi Aktif untuk Co-Terming
        Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE);

        LocalDateTime renewalExpiryDate = null;
        BigDecimal baseSum = BigDecimal.ZERO;

        for (PlatformPackage pkg : packagesToActivate) {
            BigDecimal pkgCost = pkg.getPriceMonthly();

            // Hitung pro-rata jika paket recurring dan lisensi memiliki tanggal jatuh tempo
            if (pkg.getBillingType() == PackageBillingType.RECURRING_MONTHLY && activeLicenseOpt.isPresent()) {
                TenantLicense lic = activeLicenseOpt.get();
                renewalExpiryDate = lic.getValidUntil();
                long daysRemaining = Duration.between(now, lic.getValidUntil()).toDays();
                if (daysRemaining > 0 && daysRemaining < 30) {
                    BigDecimal proRataRatio = BigDecimal.valueOf(daysRemaining)
                            .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
                    pkgCost = pkgCost.multiply(proRataRatio).setScale(2, RoundingMode.HALF_UP);
                }
            } else if (pkg.getBillingType() == PackageBillingType.ONE_TIME) {
                renewalExpiryDate = null; // Permanen
            } else {
                renewalExpiryDate = now.plusMonths(1);
            }
            baseSum = baseSum.add(pkgCost);
        }

        // PPN 11%
        BigDecimal taxAmount = baseSum.multiply(new BigDecimal("0.11")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = baseSum.add(taxAmount);

        // 3. Buat Faktur Penagihan BillingInvoice
        String invNumber = "INV/" + LocalDate.now().getYear() + "/PKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String description = "Add-on Subscription: " + packagesToActivate.stream()
                .map(PlatformPackage::getName)
                .collect(Collectors.joining(" + "));

        BillingInvoice invoice = BillingInvoice.builder()
                .organization(org)
                .license(activeLicenseOpt.orElse(null))
                .invoiceNumber(invNumber)
                .description(description)
                .amount(totalAmount)
                .currency("IDR")
                .status(InvoiceStatus.PAID) // Sandbox / instant activation
                .dueDate(now.plusDays(3))
                .paidAt(now)
                .paymentMethod(request.getPaymentMethod())
                .paymentChannel("QRIS")
                .externalInvoiceUrl("https://checkout.xendit.co/web/" + UUID.randomUUID())
                .externalReferenceId("REF-" + invNumber)
                .build();

        BillingInvoice savedInvoice = billingInvoiceRepository.save(invoice);

        // 4. Buat / Perbarui Langganan Paket
        List<TenantPackageSubscriptionDto> activatedDtos = new ArrayList<>();
        for (PlatformPackage pkg : packagesToActivate) {
            Optional<TenantPackageSubscription> existingSubOpt = subscriptionRepository
                    .findByOrganizationIdAndPlatformPackageId(orgId, pkg.getId());

            TenantPackageSubscription sub;
            if (existingSubOpt.isPresent()) {
                sub = existingSubOpt.get();
                sub.setStatus(PackageSubscriptionStatus.ACTIVE);
                sub.setActivatedAt(now);
                sub.setExpiresAt(renewalExpiryDate);
                sub.setAutoRenew(true);
                sub.setLastInvoice(savedInvoice);
            } else {
                sub = TenantPackageSubscription.builder()
                        .organization(org)
                        .platformPackage(pkg)
                        .status(PackageSubscriptionStatus.ACTIVE)
                        .grantedBy("PAYMENT_GATEWAY")
                        .grantNotes("Pembelian mandiri via marketplace oleh " + callerUser)
                        .activatedAt(now)
                        .expiresAt(renewalExpiryDate)
                        .autoRenew(true)
                        .lastInvoice(savedInvoice)
                        .build();
            }
            TenantPackageSubscription savedSub = subscriptionRepository.save(sub);
            activatedDtos.add(mapToSubscriptionDto(savedSub));
        }

        // 5. Invalidate Redis Cache
        evictTenantPackagesCache(orgId);

        log.info("🛒 PACKAGE ORDER COMPLETED: Org '{}' mengaktifkan {} paket add-on (Total: Rp {})",
                org.getSlug(), packagesToActivate.size(), totalAmount);

        return OrderPackageResponseDto.builder()
                .success(true)
                .message("Paket add-on berhasil diaktifkan.")
                .invoiceId(savedInvoice.getId())
                .invoiceNumber(savedInvoice.getInvoiceNumber())
                .baseAmount(baseSum)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .currency("IDR")
                .paymentUrl(savedInvoice.getExternalInvoiceUrl())
                .dueDate(savedInvoice.getDueDate())
                .activatedSubscriptions(activatedDtos)
                .isImmediateActivation(true)
                .build();
    }

    /**
     * Memberikan paket gratis / POC uji coba kepada tenant oleh Super Admin.
     */
    @Transactional
    public TenantPackageSubscriptionDto grantPackageManually(UUID orgId, GrantPackageRequest request, String adminActor) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organisasi tenant tidak ditemukan."));

        PlatformPackage pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paket platform tidak ditemukan."));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusDays(request.getDurationDays());

        Optional<TenantPackageSubscription> existingSubOpt = subscriptionRepository
                .findByOrganizationIdAndPlatformPackageId(orgId, pkg.getId());

        TenantPackageSubscription sub;
        if (existingSubOpt.isPresent()) {
            sub = existingSubOpt.get();
            sub.setStatus(PackageSubscriptionStatus.ACTIVE);
            sub.setGrantedBy("ADMIN_MANUAL");
            sub.setGrantNotes(request.getGrantNotes() + " (Diberikan oleh: " + adminActor + ")");
            sub.setActivatedAt(now);
            sub.setExpiresAt(expiresAt);
            sub.setAutoRenew(false);
        } else {
            sub = TenantPackageSubscription.builder()
                    .organization(org)
                    .platformPackage(pkg)
                    .status(PackageSubscriptionStatus.ACTIVE)
                    .grantedBy("ADMIN_MANUAL")
                    .grantNotes(request.getGrantNotes() + " (Diberikan oleh: " + adminActor + ")")
                    .activatedAt(now)
                    .expiresAt(expiresAt)
                    .autoRenew(false)
                    .build();
        }

        TenantPackageSubscription saved = subscriptionRepository.save(sub);
        evictTenantPackagesCache(orgId);

        log.info("🎁 PACKAGE MANUAL GRANT: Org '{}' menerima paket '{}' selama {} hari oleh Admin '{}'",
                org.getSlug(), pkg.getCode(), request.getDurationDays(), adminActor);

        return mapToSubscriptionDto(saved);
    }

    /**
     * Membatalkan perpanjangan otomatis (*auto-renew*) paket oleh tenant.
     */
    @Transactional
    public TenantPackageSubscriptionDto cancelAutoRenew(UUID subscriptionId, UUID orgId) {
        TenantPackageSubscription sub = subscriptionRepository.findById(subscriptionId)
                .filter(s -> s.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Langganan paket tidak ditemukan."));

        sub.setAutoRenew(false);
        TenantPackageSubscription updated = subscriptionRepository.save(sub);
        log.info("🚫 AUTO-RENEW CANCELLED: Sub ID '{}' org '{}'", subscriptionId, orgId);
        return mapToSubscriptionDto(updated);
    }

    /**
     * Mengambil seluruh langganan paket tenant untuk kebutuhan Super Admin.
     */
    @Transactional(readOnly = true)
    public List<TenantPackageSubscriptionDto> getAllSubscriptionsAdmin() {
        return subscriptionRepository.findAll().stream()
                .map(this::mapToSubscriptionDto)
                .collect(Collectors.toList());
    }

    /**
     * Memeriksa apakah suatu organisasi memiliki paket aktif tertentu dengan Redis Caching.
     */
    public boolean hasActivePackage(UUID orgId, String packageCode) {
        if (orgId == null || packageCode == null) return false;

        String cacheKey = REDIS_KEY_PREFIX + orgId;
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached instanceof Set<?> set) {
                return set.contains(packageCode.toUpperCase());
            }
        } catch (Exception e) {
            log.warn("Redis lookup failed for key '{}': {}", cacheKey, e.getMessage());
        }

        // Cache miss -> Query DB
        LocalDateTime now = LocalDateTime.now();
        List<TenantPackageSubscription> activeSubs = subscriptionRepository
                .findActiveSubscriptionsByOrganizationId(orgId, now);

        Set<String> activeCodes = activeSubs.stream()
                .map(s -> s.getPlatformPackage().getCode().toUpperCase())
                .collect(Collectors.toSet());

        try {
            redisTemplate.opsForValue().set(cacheKey, activeCodes, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed caching packages for key '{}': {}", cacheKey, e.getMessage());
        }

        return activeCodes.contains(packageCode.toUpperCase());
    }

    /**
     * Menghapus cache paket in-memory Redis tenant.
     */
    public void evictTenantPackagesCache(UUID orgId) {
        if (orgId == null) return;
        String cacheKey = REDIS_KEY_PREFIX + orgId;
        try {
            redisTemplate.delete(cacheKey);
            log.debug("🧹 REDIS EVICTION: Kunci '{}' berhasil dihapus.", cacheKey);
        } catch (Exception e) {
            log.warn("Gagal evict Redis key '{}': {}", cacheKey, e.getMessage());
        }
    }

    public TenantPackageSubscriptionDto mapToSubscriptionDto(TenantPackageSubscription sub) {
        PlatformPackage pkg = sub.getPlatformPackage();
        return TenantPackageSubscriptionDto.builder()
                .id(sub.getId())
                .organizationId(sub.getOrganization() != null ? sub.getOrganization().getId() : null)
                .organizationName(sub.getOrganization() != null ? sub.getOrganization().getName() : null)
                .packageId(pkg.getId())
                .packageCode(pkg.getCode())
                .packageName(pkg.getName())
                .packageCategory(pkg.getCategory())
                .billingType(pkg.getBillingType())
                .priceMonthly(pkg.getPriceMonthly())
                .iconName(pkg.getIconName())
                .badgeLabel(pkg.getBadgeLabel())
                .featureKey(pkg.getFeatureKey())
                .quotaDeltaJson(pkg.getQuotaDeltaJson())
                .status(sub.getStatus())
                .grantedBy(sub.getGrantedBy())
                .grantNotes(sub.getGrantNotes())
                .activatedAt(sub.getActivatedAt())
                .expiresAt(sub.getExpiresAt())
                .autoRenew(sub.isAutoRenew())
                .isActive(sub.isActive())
                .lastInvoiceId(sub.getLastInvoice() != null ? sub.getLastInvoice().getId() : null)
                .lastInvoiceNumber(sub.getLastInvoice() != null ? sub.getLastInvoice().getInvoiceNumber() : null)
                .createdAt(sub.getCreatedAt())
                .updatedAt(sub.getUpdatedAt())
                .build();
    }

    private PackageResponseDto mapToPackageDto(PlatformPackage pkg) {
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
}
