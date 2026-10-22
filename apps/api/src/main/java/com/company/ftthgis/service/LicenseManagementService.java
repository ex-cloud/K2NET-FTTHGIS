package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.CreateBillingInvoiceRequest;
import com.company.ftthgis.api.system.dto.LicenseOverviewKpiDto;
import com.company.ftthgis.api.system.dto.UpdateSubscriptionPlanRequest;
import com.company.ftthgis.api.system.dto.UpdateTenantLicenseRequest;
import com.company.ftthgis.api.tenant.dto.BillingInvoiceResponseDto;
import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.api.tenant.dto.LicenseIssueRequest;
import com.company.ftthgis.api.tenant.dto.LicenseResponseDto;
import com.company.ftthgis.api.tenant.dto.ProrateEstimateResponseDto;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.BillingInvoiceRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Layanan manajemen siklus hidup lisensi runtime & kuota teknis organisasi tenant.
 *
 * <p>Memisahkan dimensi finansial (Billing) dan dimensi otorisasi teknis (License),
 * mendukung penerbitan online, manual override B2B, aktivasi mandiri kode lisensi,
 * dan sertifikat air-gapped on-premise.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LicenseManagementService {

    private final TenantLicenseRepository tenantLicenseRepository;
    private final BillingInvoiceRepository billingInvoiceRepository;
    private final OrganizationRepository organizationRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final com.company.ftthgis.domain.tenant.repository.TenantSubscriptionRepository tenantSubscriptionRepository;
    private final com.company.ftthgis.domain.tenant.repository.BillingPolicyRepository billingPolicyRepository;
    private final com.company.ftthgis.domain.tenant.repository.PlanVersionRepository planVersionRepository;
    private final com.company.ftthgis.domain.tenant.repository.MessageTemplateRepository messageTemplateRepository;
    private final LicenseCryptoService licenseCryptoService;
    private final AuditLoggingService auditLoggingService;
    private final EntityManager entityManager;

    private void unwrapAndDisableOrgFilter() {
        OrganizationContext.setFilterBypassed(true);
        if (entityManager != null) {
            try {
                Session session = entityManager.unwrap(Session.class);
                if (session != null && session.getEnabledFilter("organizationFilter") != null) {
                    session.disableFilter("organizationFilter");
                }
            } catch (Exception ignored) {}
        }
    }

    /**
     * Menerbitkan lisensi online baru untuk organisasi tenant (saat registrasi / pembayaran).
     */
    @Transactional
    public TenantLicense issueOnlineLicense(
            Organization org,
            SubscriptionPlan plan,
            int durationMonths,
            String issuedBy
    ) {
        LocalDateTime now = LocalDateTime.now();
        String tier = plan != null ? plan.getName() : "PRO";
        LocalDateTime validUntil = "FREE".equalsIgnoreCase(tier)
                ? now.plusDays(14)
                : now.plusMonths(Math.max(1, durationMonths));

        String licenseKey = licenseCryptoService.generateLicenseKey(tier);
        String signature = licenseCryptoService.signLicenseMetadata(
                org.getId(),
                tier,
                licenseKey,
                now,
                validUntil,
                null
        );

        boolean isEnt = plan != null && "ENTERPRISE".equalsIgnoreCase(plan.getName());
        com.company.ftthgis.domain.tenant.entity.TenantSubscription activeSub = tenantSubscriptionRepository != null
                ? tenantSubscriptionRepository.findActiveSubscriptionByOrganizationId(org.getId()).orElse(null)
                : null;
        TenantLicense license = TenantLicense.builder()
                .organization(org)
                .subscription(activeSub)
                .subscriptionPlan(plan)
                .licenseKey(licenseKey)
                .licenseSignature(signature)
                .status(LicenseStatus.ACTIVE)
                .activationType("ONLINE")
                .validFrom(now)
                .validUntil(validUntil)
                .issuedBy(issuedBy != null ? issuedBy : "SYSTEM_BILLING")
                .featureSsoEnabled(isEnt || (plan != null && plan.isHasSso()))
                .featureApiEnabled(isEnt || (plan != null && plan.isHasApiAccess()))
                .featureAiCopilotEnabled(isEnt)
                .featureCustomDomainEnabled(isEnt)
                .notes("FREE".equalsIgnoreCase(tier) ? "14-Day Free Trial Online License" : "Online subscription license issued automatically")
                .build();

        TenantLicense saved = tenantLicenseRepository.save(license);
        log.info("🔑 LICENSE ISSUED: Created online license '{}' for org '{}' (valid until {})",
                licenseKey, org.getSlug(), validUntil);

        auditLog(org.getSlug(), "LICENSE_ISSUED", org.getId().toString(),
                "Issued online license key " + maskKey(licenseKey) + " for plan " + tier);

        return saved;
    }

    /**
     * Menerbitkan lisensi kontrak B2B manual dengan batas kuota khusus oleh Super Admin.
     */
    @Transactional
    public TenantLicense issueManualLicenseWithOverrides(
            UUID orgId,
            LicenseIssueRequest request,
            String issuedBy
    ) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + orgId));

        SubscriptionPlan plan = subscriptionPlanRepository.findByName(request.getPlanName().toUpperCase(Locale.ROOT))
                .orElseGet(() -> {
                    log.warn("Subscription plan '{}' not found, defaulting to PRO", request.getPlanName());
                    return subscriptionPlanRepository.findByName("PRO")
                            .orElse(org.getSubscriptionPlan());
                });

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime validUntil = now.plusMonths(Math.max(1, request.getDurationMonths()));

        String tier = plan != null ? plan.getName() : request.getPlanName();
        String licenseKey = licenseCryptoService.generateLicenseKey(tier);
        String signature = licenseCryptoService.signLicenseMetadata(
                org.getId(),
                tier,
                licenseKey,
                now,
                validUntil,
                request.getMachineFingerprint()
        );

        com.company.ftthgis.domain.tenant.entity.TenantSubscription activeSub = tenantSubscriptionRepository != null
                ? tenantSubscriptionRepository.findActiveSubscriptionByOrganizationId(org.getId()).orElse(null)
                : null;

        TenantLicense license = TenantLicense.builder()
                .organization(org)
                .subscription(activeSub)
                .subscriptionPlan(plan)
                .licenseKey(licenseKey)
                .licenseSignature(signature)
                .status(LicenseStatus.ACTIVE)
                .activationType(request.getActivationType() != null ? request.getActivationType() : "ENTERPRISE_PO")
                .validFrom(now)
                .validUntil(validUntil)
                .overrideMaxProjects(request.getOverrideMaxProjects())
                .overrideMaxOlts(request.getOverrideMaxOlts())
                .overrideMaxOdps(request.getOverrideMaxOdps())
                .overrideMaxOdcs(request.getOverrideMaxOdcs())
                .overrideMaxCustomers(request.getOverrideMaxCustomers())
                .overrideMaxStorageGb(request.getOverrideMaxStorageGb())
                .featureSsoEnabled(Boolean.TRUE.equals(request.getFeatureSsoEnabled()) || (plan != null && plan.isHasSso()) || (plan != null && "ENTERPRISE".equalsIgnoreCase(plan.getName())))
                .featureApiEnabled(Boolean.TRUE.equals(request.getFeatureApiEnabled()) || (plan != null && plan.isHasApiAccess()) || (plan != null && "ENTERPRISE".equalsIgnoreCase(plan.getName())))
                .featureAiCopilotEnabled(Boolean.TRUE.equals(request.getFeatureAiCopilotEnabled()) || (plan != null && "ENTERPRISE".equalsIgnoreCase(plan.getName())))
                .featureCustomDomainEnabled(Boolean.TRUE.equals(request.getFeatureCustomDomainEnabled()) || (plan != null && "ENTERPRISE".equalsIgnoreCase(plan.getName())))
                .machineFingerprint(request.getMachineFingerprint())
                .issuedBy(issuedBy != null ? issuedBy : "SUPER_ADMIN")
                .notes(request.getNotes())
                .build();

        TenantLicense saved = tenantLicenseRepository.save(license);

        // Pulihkan status organisasi ke ACTIVE
        if (org.getStatus() != Organization.OrganizationStatus.ACTIVE) {
            org.setStatus(Organization.OrganizationStatus.ACTIVE);
            org.setDunningLevel(0);
            org.setOverQuotaMode(false);
            organizationRepository.save(org);
        }

        log.info("🔑 MANUAL LICENSE GRANTED: Org '{}' received manual license '{}' with custom overrides (OLT: {}, ODP: {})",
                org.getSlug(), licenseKey, request.getOverrideMaxProjects(), request.getOverrideMaxOdps());

        auditLog(org.getSlug(), "MANUAL_LICENSE_GRANTED", org.getId().toString(),
                "Super Admin issued manual license " + maskKey(licenseKey) + " with custom quota overrides");

        return saved;
    }

    /**
     * Mengaktivasi kunci lisensi mandiri oleh administrator tenant.
     */
    @Transactional
    public TenantLicense activateLicenseKey(
            UUID orgId,
            String licenseKey,
            String machineFingerprint,
            String activatedBy
    ) {
        if (!licenseCryptoService.verifyLicenseChecksum(licenseKey)) {
            throw new IllegalArgumentException("Kode lisensi tidak valid: format atau checksum keliru.");
        }

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + orgId));

        // Cari apakah ada lisensi yang sudah didaftarkan sebelumnya dengan kunci ini
        Optional<TenantLicense> existingOpt = tenantLicenseRepository.findByLicenseKey(licenseKey.trim().toUpperCase(Locale.ROOT));

        TenantLicense license;
        if (existingOpt.isPresent()) {
            license = existingOpt.get();
            // Validasi kepemilikan organisasi jika sudah terikat
            if (!license.getOrganization().getId().equals(orgId)) {
                throw new IllegalStateException("Kode lisensi ini sudah terdaftar untuk organisasi lain.");
            }
            if (license.isExpired()) {
                throw new IllegalStateException("Kode lisensi ini sudah kedaluwarsa pada " + license.getValidUntil());
            }

            // Validasi Hardware Fingerprint jika lisensi dikunci untuk mesin tertentu (Air-Gapped)
            if (license.getMachineFingerprint() != null && !license.getMachineFingerprint().isBlank()) {
                if (!licenseCryptoService.verifyMachineFingerprint(license.getMachineFingerprint(), machineFingerprint)) {
                    log.warn("🚨 HARDWARE SPOOFING REJECTED: Org '{}' attempted activating license '{}' with mismatched fingerprint '{}' (expected: '{}')",
                            orgId, licenseKey, machineFingerprint, license.getMachineFingerprint());
                    throw new IllegalArgumentException("Sidik jari perangkat keras (Hardware Fingerprint) tidak cocok dengan lisensi ini. " +
                            "Lisensi dikunci khusus untuk mesin dengan sidik jari: " + license.getMachineFingerprint());
                }
            } else if (machineFingerprint != null && !machineFingerprint.isBlank()) {
                // Jika lisensi belum di-bind ke hardware tertentu, bind sekarang saat aktivasi
                license.setMachineFingerprint(machineFingerprint.trim().toLowerCase(Locale.ROOT));
            }

            license.setStatus(LicenseStatus.ACTIVE);
            license.setGracePeriodUntil(null);
        } else {
            // Aktivasi kode baru dari kontrak offline PO yang diterbitkan tanpa bind awal
            String[] parts = licenseKey.trim().toUpperCase(Locale.ROOT).split("-");
            String tierCode = parts.length >= 2 ? parts[1] : "PRO";
            SubscriptionPlan plan = subscriptionPlanRepository.findByName(tierCode)
                    .orElseGet(() -> subscriptionPlanRepository.findByName("PRO")
                            .orElse(org.getSubscriptionPlan()));

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime validUntil = now.plusYears(1);

            String sig = licenseCryptoService.signLicenseMetadata(
                    org.getId(),
                    plan != null ? plan.getName() : tierCode,
                    licenseKey,
                    now,
                    validUntil,
                    machineFingerprint
            );

            boolean isEnt = plan != null && "ENTERPRISE".equalsIgnoreCase(plan.getName());
            boolean isProOrEnt = plan != null && ("PRO".equalsIgnoreCase(plan.getName()) || isEnt);
            license = TenantLicense.builder()
                    .organization(org)
                    .subscriptionPlan(plan)
                    .licenseKey(licenseKey.trim().toUpperCase(Locale.ROOT))
                    .licenseSignature(sig)
                    .status(LicenseStatus.ACTIVE)
                    .activationType("OFFLINE_KEY")
                    .validFrom(now)
                    .validUntil(validUntil)
                    .featureSsoEnabled(isEnt || (plan != null && plan.isHasSso()))
                    .featureApiEnabled(isProOrEnt || (plan != null && plan.isHasApiAccess()))
                    .featureAiCopilotEnabled(isEnt)
                    .featureCustomDomainEnabled(isEnt)
                    .machineFingerprint(machineFingerprint != null ? machineFingerprint.trim().toLowerCase(Locale.ROOT) : null)
                    .issuedBy("SELF_ACTIVATION")
                    .notes("Activated by tenant user: " + activatedBy)
                    .build();
        }

        // Simpan lisensi dan pulihkan status operasional akun
        TenantLicense saved = tenantLicenseRepository.save(license);
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        org.setDunningLevel(0);
        org.setOverQuotaMode(false);
        if (saved.getSubscriptionPlan() != null) {
            org.setSubscriptionPlan(saved.getSubscriptionPlan());
        }
        organizationRepository.save(org);

        log.info("🎉 LICENSE ACTIVATED: Tenant '{}' successfully activated license '{}' (HW: {})",
                org.getSlug(), licenseKey, saved.getMachineFingerprint());

        auditLog(org.getSlug(), "LICENSE_ACTIVATED", org.getId().toString(),
                "Tenant activated license key " + maskKey(licenseKey));

        return saved;
    }

    /**
     * Mengaktivasi lisensi secara offline melalui konten berkas sertifikat kriptografis bertanda tangan digital (.lic).
     * Dirancang khusus untuk instalasi server on-premise / intranet tertutup (Air-Gapped) tanpa koneksi internet.
     *
     * @param orgId ID organisasi tenant
     * @param certificateContent Konten berkas sertifikat (.lic)
     * @param machineFingerprint Sidik jari hardware mesin pelaksana saat aktivasi
     * @param activatedBy Identitas admin/user pengaktivasi
     * @return Entitas lisensi aktif tersimpan
     */
    @Transactional
    public TenantLicense activateOfflineCertificate(
            UUID orgId,
            String certificateContent,
            String machineFingerprint,
            String activatedBy
    ) {
        if (certificateContent == null || certificateContent.isBlank()) {
            throw new IllegalArgumentException("Konten berkas sertifikat lisensi tidak boleh kosong.");
        }

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + orgId));

        // 1. Parsing dan verifikasi integritas kriptografis HMAC-SHA256 dari sertifikat .lic
        LicenseCryptoService.OfflineLicensePayload payload = licenseCryptoService.parseAndVerifyOfflineCertificate(certificateContent);

        // 2. Verifikasi kepemilikan tenant: sertifikat harus diterbitkan untuk organisasi pemanggil
        if (!org.getId().toString().equalsIgnoreCase(payload.getOrganizationId()) &&
            !org.getSlug().equalsIgnoreCase(payload.getOrganizationSlug())) {
            throw new IllegalStateException("Sertifikat lisensi ini diterbitkan untuk organisasi lain: " +
                    payload.getOrganizationName() + " (" + payload.getOrganizationSlug() + ").");
        }

        // 3. Verifikasi hardware fingerprint jika sertifikat mengikat hardware spesifik (Air-Gapped Node Lock)
        if (payload.getMachineFingerprint() != null && !payload.getMachineFingerprint().isBlank()) {
            if (!licenseCryptoService.verifyMachineFingerprint(payload.getMachineFingerprint(), machineFingerprint)) {
                log.warn("🚨 AIR-GAPPED HARDWARE MISMATCH: Org '{}' certificate expects '{}' but got '{}'",
                        orgId, payload.getMachineFingerprint(), machineFingerprint);
                throw new IllegalArgumentException("Sidik jari perangkat keras (Hardware Fingerprint) tidak cocok dengan sertifikat lisensi ini. " +
                        "Sertifikat dikunci khusus untuk mesin dengan sidik jari: " + payload.getMachineFingerprint());
            }
        }

        // 4. Periksa masa berlaku sertifikat
        LocalDateTime validUntil = LocalDateTime.parse(payload.getValidUntil(), DateTimeFormatter.ISO_DATE_TIME);
        LocalDateTime validFrom = LocalDateTime.parse(payload.getValidFrom(), DateTimeFormatter.ISO_DATE_TIME);
        if (LocalDateTime.now().isAfter(validUntil)) {
            throw new IllegalStateException("Sertifikat lisensi offline ini sudah kedaluwarsa pada " + validUntil);
        }

        // 5. Muat atau buat entitas lisensi
        SubscriptionPlan plan = subscriptionPlanRepository.findByName(payload.getPlanName())
                .orElseGet(() -> subscriptionPlanRepository.findByName("PRO")
                        .orElse(org.getSubscriptionPlan()));

        Optional<TenantLicense> existingOpt = tenantLicenseRepository.findByLicenseKey(payload.getLicenseKey().trim().toUpperCase(Locale.ROOT));
        TenantLicense license;
        if (existingOpt.isPresent()) {
            license = existingOpt.get();
            license.setStatus(LicenseStatus.ACTIVE);
            license.setGracePeriodUntil(null);
            license.setValidFrom(validFrom);
            license.setValidUntil(validUntil);
            license.setActivationType("OFFLINE_CERT");
            license.setLicenseSignature(payload.getSignature());
        } else {
            license = TenantLicense.builder()
                    .organization(org)
                    .subscriptionPlan(plan)
                    .licenseKey(payload.getLicenseKey().trim().toUpperCase(Locale.ROOT))
                    .licenseSignature(payload.getSignature())
                    .status(LicenseStatus.ACTIVE)
                    .activationType("OFFLINE_CERT")
                    .validFrom(validFrom)
                    .validUntil(validUntil)
                    .issuedBy("AIRGAP_IMPORT")
                    .notes("Activated via offline certificate file by: " + activatedBy)
                    .build();
        }

        // Aplikasikan overrides kuota hardware dan feature flags dari sertifikat
        license.setOverrideMaxProjects(payload.getMaxProjects());
        license.setOverrideMaxOdps(payload.getMaxOdps());
        license.setOverrideMaxOdcs(payload.getMaxOdcs());
        license.setOverrideMaxCustomers(payload.getMaxCustomers());
        license.setOverrideMaxStorageGb(payload.getMaxStorageGb());
        license.setFeatureSsoEnabled(payload.isFeatureSsoEnabled());
        license.setFeatureApiEnabled(payload.isFeatureApiEnabled());
        license.setFeatureAiCopilotEnabled(payload.isFeatureAiCopilotEnabled());
        license.setFeatureCustomDomainEnabled(payload.isFeatureCustomDomainEnabled());

        if (payload.getMachineFingerprint() != null && !payload.getMachineFingerprint().isBlank()) {
            license.setMachineFingerprint(payload.getMachineFingerprint().trim().toLowerCase(Locale.ROOT));
        } else if (machineFingerprint != null && !machineFingerprint.isBlank()) {
            license.setMachineFingerprint(machineFingerprint.trim().toLowerCase(Locale.ROOT));
        }

        TenantLicense saved = tenantLicenseRepository.save(license);

        // Pulihkan status operasional akun organisasi
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        org.setDunningLevel(0);
        org.setOverQuotaMode(false);
        if (plan != null) {
            org.setSubscriptionPlan(plan);
        }
        organizationRepository.save(org);

        log.info("🛡️ OFFLINE LICENSE CERTIFICATE ACTIVATED: Tenant '{}' activated cert for key '{}' (HW: {})",
                org.getSlug(), payload.getLicenseKey(), license.getMachineFingerprint());

        auditLog(org.getSlug(), "OFFLINE_LICENSE_ACTIVATED", org.getId().toString(),
                "Tenant activated offline certificate for " + maskKey(payload.getLicenseKey()));

        return saved;
    }

    /**
     * Menghitung kuota hardware dan hak fitur efektif berdasarkan hirarki Master Blueprint:
     * Custom Overrides > Emergency Booster > Base Subscription Plan.
     */
    @Transactional(readOnly = true)
    public LicenseEntitlementsDto getEffectiveLicenseEntitlements(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + orgId));

        SubscriptionPlan plan = org.getSubscriptionPlan();
        Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE);

        // Jika tidak ada ACTIVE murni, cari yang GRACE_PERIOD atau RESTRICTED_READ_ONLY
        if (activeLicenseOpt.isEmpty()) {
            activeLicenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdOrderByCreatedAtDesc(orgId);
        }

        int baseProjects = plan != null && plan.getMaxProjects() != null ? plan.getMaxProjects() : 6;
        int baseOlts = plan != null && plan.getMaxOlts() != null ? plan.getMaxOlts() : 12;
        int baseOdps = plan != null && plan.getMaxOdps() != null ? plan.getMaxOdps() : 2500;
        int baseOdcs = plan != null && plan.getMaxOdcs() != null ? plan.getMaxOdcs() : 500;
        int baseCustomers = plan != null && plan.getMaxCustomers() != null ? plan.getMaxCustomers() : 5000;
        int baseStorage = (plan != null && plan.getMaxStorageGb() != null) ? plan.getMaxStorageGb() : 2;

        boolean isBooster = org.isBoosterActive();
        int boosterOlts = (isBooster && org.getBoosterOlts() != null) ? org.getBoosterOlts() : 0;
        int boosterOdps = (isBooster && org.getBoosterOdps() != null) ? org.getBoosterOdps() : 0;

        int effectiveProjects;
        int effectiveOlts = baseOlts;
        int effectiveOdps;
        int effectiveOdcs = baseOdcs;
        int effectiveCustomers = baseCustomers;
        int effectiveStorage = baseStorage;
        String source = "BASE_PLAN";

        boolean sso = plan != null && plan.isHasSso();
        boolean api = plan != null && plan.isHasApiAccess();
        boolean ai = false;
        boolean customDomain = false;

        if (activeLicenseOpt.isPresent()) {
            TenantLicense lic = activeLicenseOpt.get();
            if (lic.getOverrideMaxProjects() != null) {
                effectiveProjects = lic.getOverrideMaxProjects();
                source = "LICENSE_OVERRIDE";
            } else {
                effectiveProjects = baseProjects + boosterOlts;
                if (boosterOlts > 0) source = "EMERGENCY_BOOSTER";
            }

            if (lic.getOverrideMaxOlts() != null) {
                effectiveOlts = lic.getOverrideMaxOlts();
                source = "LICENSE_OVERRIDE";
            } else if (boosterOlts > 0) {
                effectiveOlts = baseOlts + boosterOlts;
            }

            if (lic.getOverrideMaxOdps() != null) {
                effectiveOdps = lic.getOverrideMaxOdps();
                source = "LICENSE_OVERRIDE";
            } else {
                effectiveOdps = baseOdps + boosterOdps;
                if (boosterOdps > 0 && !"LICENSE_OVERRIDE".equals(source)) source = "EMERGENCY_BOOSTER";
            }

            if (lic.getOverrideMaxOdcs() != null) effectiveOdcs = lic.getOverrideMaxOdcs();
            if (lic.getOverrideMaxCustomers() != null) effectiveCustomers = lic.getOverrideMaxCustomers();
            if (lic.getOverrideMaxStorageGb() != null) effectiveStorage = lic.getOverrideMaxStorageGb();

            boolean isEnt = "ENTERPRISE".equalsIgnoreCase(plan != null ? plan.getName() : "");
            sso = lic.isFeatureSsoEnabled() || sso || isEnt;
            api = lic.isFeatureApiEnabled() || api || isEnt;
            ai = lic.isFeatureAiCopilotEnabled() || isEnt;
            customDomain = lic.isFeatureCustomDomainEnabled() || isEnt;
        } else {
            effectiveProjects = baseProjects + boosterOlts;
            effectiveOlts = baseOlts + boosterOlts;
            effectiveOdps = baseOdps + boosterOdps;
            if (boosterOlts > 0 || boosterOdps > 0) {
                source = "EMERGENCY_BOOSTER";
            }
        }

        return LicenseEntitlementsDto.builder()
                .maxProjects(effectiveProjects)
                .maxOlts(effectiveOlts)
                .maxOdps(effectiveOdps)
                .maxOdcs(effectiveOdcs)
                .maxCustomers(effectiveCustomers)
                .maxStorageGb(effectiveStorage)
                .ssoEnabled(sso)
                .apiEnabled(api)
                .aiCopilotEnabled(ai)
                .customDomainEnabled(customDomain)
                .calculationSource(source)
                .build();
    }

    /**
     * Mengambil detail lisensi aktif organisasi tenant untuk tampilan portal.
     */
    @Transactional(readOnly = true)
    public Optional<LicenseResponseDto> getCurrentLicense(UUID orgId) {
        unwrapAndDisableOrgFilter();
        try {
            Organization org = organizationRepository.findById(orgId).orElse(null);
            if (org == null) return Optional.empty();

            Optional<TenantLicense> licenseOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE);

            if (licenseOpt.isEmpty()) {
                licenseOpt = tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(orgId);
            }

            return licenseOpt.map(lic -> mapToResponseDto(lic, org));
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    /**
     * Mengambil seluruh lisensi tenant untuk dasbor Super Admin platform.
     */
    @Transactional(readOnly = true)
    public List<LicenseResponseDto> getAllLicenses() {
        unwrapAndDisableOrgFilter();
        try {
            List<TenantLicense> licenses = tenantLicenseRepository.findAll();
            List<LicenseResponseDto> dtos = new ArrayList<>();
            for (TenantLicense lic : licenses) {
                Organization org = lic.getOrganization();
                dtos.add(mapToResponseDto(lic, org));
            }
            return dtos;
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    /**
     * Memperpanjang masa aktif lisensi (Extend duration).
     */
    @Transactional
    public TenantLicense extendLicense(UUID licenseId, int additionalMonths, String extendedBy) {
        unwrapAndDisableOrgFilter();
        try {
            TenantLicense license = tenantLicenseRepository.findById(licenseId)
                    .orElseThrow(() -> new NoSuchElementException("Lisensi tidak ditemukan: " + licenseId));

            LocalDateTime currentValidUntil = license.getValidUntil();
            LocalDateTime baseDate = (currentValidUntil != null && currentValidUntil.isAfter(LocalDateTime.now()))
                    ? currentValidUntil
                    : LocalDateTime.now();

            LocalDateTime newValidUntil = baseDate.plusMonths(Math.max(1, additionalMonths));
            license.setValidUntil(newValidUntil);
            license.setStatus(LicenseStatus.ACTIVE);
            license.setGracePeriodUntil(null);

            // Perbarui signature digital
            String newSig = licenseCryptoService.signLicenseMetadata(
                    license.getOrganization().getId(),
                    license.getSubscriptionPlan() != null ? license.getSubscriptionPlan().getName() : "PRO",
                    license.getLicenseKey(),
                    license.getValidFrom(),
                    newValidUntil,
                    license.getMachineFingerprint()
            );
            license.setLicenseSignature(newSig);

            TenantLicense saved = tenantLicenseRepository.save(license);
            log.info("⏰ LICENSE EXTENDED: License '{}' extended by {} months until {}",
                    license.getLicenseKey(), additionalMonths, newValidUntil);

            auditLog(license.getOrganization().getSlug(), "LICENSE_EXTENDED", license.getOrganization().getId().toString(),
                    "License " + maskKey(license.getLicenseKey()) + " extended by " + additionalMonths + " months by " + extendedBy);

            return saved;
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    /**
     * Mencabut lisensi secara permanen (Kill Switch) oleh Super Admin.
     */
    @Transactional
    public void revokeLicense(UUID licenseId, String reason, String revokedBy) {
        unwrapAndDisableOrgFilter();
        try {
            TenantLicense license = tenantLicenseRepository.findById(licenseId)
                    .orElseThrow(() -> new NoSuchElementException("Lisensi tidak ditemukan: " + licenseId));

            license.setStatus(LicenseStatus.REVOKED);
            license.setNotes((license.getNotes() != null ? license.getNotes() + "\n" : "") +
                    "REVOKED by " + revokedBy + ": " + reason + " at " + LocalDateTime.now());

            tenantLicenseRepository.save(license);
            log.warn("🚨 LICENSE REVOKED: License '{}' revoked by {}: {}",
                    license.getLicenseKey(), revokedBy, reason);

            auditLog(license.getOrganization().getSlug(), "LICENSE_REVOKED", license.getOrganization().getId().toString(),
                    "License " + maskKey(license.getLicenseKey()) + " revoked: " + reason);
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    /**
     * Mengambil riwayat seluruh lisensi milik suatu organisasi tenant.
     */
    @Transactional(readOnly = true)
    public List<LicenseResponseDto> getLicensesByOrganization(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + orgId));
        unwrapAndDisableOrgFilter();
        try {
            return tenantLicenseRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                    .map(lic -> mapToResponseDto(lic, org))
                    .toList();
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    /**
     * Mengambil detail satu lisensi spesifik berdasarkan ID.
     */
    @Transactional(readOnly = true)
    public Optional<LicenseResponseDto> getLicenseById(UUID licenseId) {
        unwrapAndDisableOrgFilter();
        try {
            return tenantLicenseRepository.findById(licenseId)
                    .map(lic -> mapToResponseDto(lic, lic.getOrganization()));
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    /**
     * Mengekspor sertifikat lisensi offline bertanda tangan digital (.lic).
     */
    @Transactional(readOnly = true)
    public String exportOfflineCertificate(UUID licenseId) {
        unwrapAndDisableOrgFilter();
        try {
            TenantLicense license = tenantLicenseRepository.findById(licenseId)
                    .orElseThrow(() -> new NoSuchElementException("Lisensi tidak ditemukan: " + licenseId));
            return licenseCryptoService.generateOfflineCertificate(license, license.getOrganization());
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    /**
     * Menghasilkan agregasi ringkasan metrik KPI lisensi seluruh platform untuk Super Admin.
     */
    @Transactional(readOnly = true)
    public LicenseOverviewKpiDto getLicensesOverview() {
        unwrapAndDisableOrgFilter();
        try {
            List<TenantLicense> all = tenantLicenseRepository.findAll();
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime in30Days = now.plusDays(30);
            LocalDateTime in7Days = now.plusDays(7);

            long total = all.size();
            long active = 0;
            long grace = 0;
            long readOnly = 0;
            long suspended = 0;
            long expiringIn30Days = 0;
            long expiringIn7Days = 0;
            double mrr = 0.0;
            Map<String, Long> tierDistribution = new HashMap<>();

            for (TenantLicense lic : all) {
                LicenseStatus status = lic.getStatus();
                if (status == LicenseStatus.ACTIVE) {
                    active++;
                    if (lic.getValidUntil() != null && lic.getValidUntil().isAfter(now)) {
                        if (!lic.getValidUntil().isAfter(in30Days)) {
                            expiringIn30Days++;
                        }
                        if (!lic.getValidUntil().isAfter(in7Days)) {
                            expiringIn7Days++;
                        }
                    }
                    boolean isInternal = lic.getOrganization() != null && "default".equalsIgnoreCase(lic.getOrganization().getSlug());
                    boolean isTestTenant = (lic.getSubscription() != null && lic.getSubscription().isTest())
                            || (lic.getOrganization() != null && lic.getOrganization().getName() != null && lic.getOrganization().getName().toLowerCase().contains("uji coba"));
                    boolean isPaying = lic.getSubscriptionPlan() != null && lic.getSubscriptionPlan().getPrice() != null && lic.getSubscriptionPlan().getPrice().doubleValue() > 0.0;
                    if (!isTestTenant && !isInternal && isPaying) {
                        mrr += lic.getSubscriptionPlan().getPrice().doubleValue();
                    }
                    if (!isInternal && !isTestTenant) {
                        String tier = lic.getSubscriptionPlan() != null ? lic.getSubscriptionPlan().getName() : "PRO";
                        tierDistribution.put(tier, tierDistribution.getOrDefault(tier, 0L) + 1);
                    }
                } else if (status == LicenseStatus.GRACE_PERIOD) {
                    grace++;
                    boolean isInternal = lic.getOrganization() != null && "default".equalsIgnoreCase(lic.getOrganization().getSlug());
                    boolean isTestTenant = (lic.getSubscription() != null && lic.getSubscription().isTest())
                            || (lic.getOrganization() != null && lic.getOrganization().getName() != null && lic.getOrganization().getName().toLowerCase().contains("uji coba"));
                    if (!isInternal && !isTestTenant) {
                        String tier = lic.getSubscriptionPlan() != null ? lic.getSubscriptionPlan().getName() : "PRO";
                        tierDistribution.put(tier, tierDistribution.getOrDefault(tier, 0L) + 1);
                    }
                } else if (status == LicenseStatus.RESTRICTED_READ_ONLY) {
                    readOnly++;
                } else if (status == LicenseStatus.SUSPENDED || status == LicenseStatus.REVOKED) {
                    suspended++;
                }
            }

            return LicenseOverviewKpiDto.builder()
                    .totalLicenses(total)
                    .activeLicenses(active)
                    .gracePeriodLicenses(grace)
                    .readOnlyLicenses(readOnly)
                    .suspendedLicenses(suspended)
                    .expiringIn30Days(expiringIn30Days)
                    .expiringIn7Days(expiringIn7Days)
                    .monthlyRecurringRevenue(mrr)
                    .tierDistribution(tierDistribution)
                    .build();
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    /**
     * Otomasi perpanjangan / penerbitan lisensi saat webhook pembayaran Xendit berstatus PAID.
     */
    @Transactional
    public TenantLicense issueOrRenewFromPayment(
            String orgSlug,
            String planName,
            String paymentMethod,
            String paymentChannel,
            BigDecimal amount,
            String externalReferenceId
    ) {
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan untuk slug: " + orgSlug));

        SubscriptionPlan plan = subscriptionPlanRepository.findByName(planName != null ? planName.toUpperCase(Locale.ROOT) : "PRO")
                .orElse(org.getSubscriptionPlan());

        Optional<TenantLicense> currentLicenseOpt = tenantLicenseRepository
                .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);

        TenantLicense license;
        if (currentLicenseOpt.isPresent()) {
            license = extendLicense(currentLicenseOpt.get().getId(), 1, "PAYMENT_GATEWAY_WEBHOOK");
        } else {
            license = issueOnlineLicense(org, plan, 1, "PAYMENT_GATEWAY_WEBHOOK");
        }

        // Catat faktur penagihan resmi berstatus PAID
        String invNumber = "INV/" + LocalDateTime.now().getYear() + "/" +
                String.format("%02d", LocalDateTime.now().getMonthValue()) + "/K2-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);

        BillingInvoice invoice = BillingInvoice.builder()
                .organization(org)
                .license(license)
                .invoiceNumber(invNumber)
                .description("Monthly Subscription Renewal - Plan " + (plan != null ? plan.getName() : planName))
                .amount(amount != null ? amount : BigDecimal.valueOf(3900000))
                .currency("IDR")
                .status(InvoiceStatus.PAID)
                .dueDate(LocalDateTime.now())
                .paidAt(LocalDateTime.now())
                .paymentMethod(paymentMethod != null ? paymentMethod : "XENDIT_VA")
                .paymentChannel(paymentChannel != null ? paymentChannel : "BCA")
                .externalReferenceId(externalReferenceId)
                .build();

        billingInvoiceRepository.save(invoice);

        // Pulihkan status organisasi
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        org.setDunningLevel(0);
        org.setOverQuotaMode(false);
        if (plan != null) {
            org.setSubscriptionPlan(plan);
        }
        organizationRepository.save(org);

        log.info("💰 PAYMENT SYNC COMPLETE: Org '{}' renewed via invoice '{}', license active until {}",
                orgSlug, invNumber, license.getValidUntil());

        return license;
    }

    // ── Helper Mappers ──────────────────────────────────────────────────────

    private LicenseResponseDto mapToResponseDto(TenantLicense lic, Organization org) {
        LocalDateTime now = LocalDateTime.now();
        long daysRemaining = (lic.getValidUntil() != null && lic.getValidUntil().isAfter(now))
                ? Duration.between(now, lic.getValidUntil()).toDays() : 0;
        long graceDaysRemaining = (lic.getGracePeriodUntil() != null && lic.getGracePeriodUntil().isAfter(now))
                ? Duration.between(now, lic.getGracePeriodUntil()).toDays() : 0;

        SubscriptionPlan plan = lic.getSubscriptionPlan();
        boolean isCustom = isQuotaCustom(
                lic.getOverrideMaxProjects(), plan != null ? plan.getMaxProjects() : null,
                lic.getOverrideMaxOlts(), plan != null ? plan.getMaxOlts() : null,
                lic.getOverrideMaxOdps(), plan != null ? plan.getMaxOdps() : null,
                lic.getOverrideMaxOdcs(), plan != null ? plan.getMaxOdcs() : null,
                lic.getOverrideMaxCustomers(), plan != null ? plan.getMaxCustomers() : null,
                lic.getOverrideMaxStorageGb(), plan != null ? plan.getMaxStorageGb() : null
        );

        return LicenseResponseDto.builder()
                .id(lic.getId())
                .organizationId(org != null ? org.getId() : null)
                .organizationSlug(org != null ? org.getSlug() : null)
                .organizationName(org != null ? org.getName() : null)
                .planName(lic.getSubscriptionPlan() != null ? lic.getSubscriptionPlan().getName() : "PRO")
                .licenseKey(lic.getLicenseKey())
                .maskedLicenseKey(maskKey(lic.getLicenseKey()))
                .status(lic.getStatus())
                .activationType(lic.getActivationType())
                .validFrom(lic.getValidFrom())
                .validUntil(lic.getValidUntil())
                .gracePeriodUntil(lic.getGracePeriodUntil())
                .daysRemaining(daysRemaining)
                .graceDaysRemaining(graceDaysRemaining)
                .machineFingerprint(lic.getMachineFingerprint())
                .issuedBy(lic.getIssuedBy())
                .notes(lic.getNotes())
                .entitlements(getEffectiveLicenseEntitlements(org != null ? org.getId() : lic.getOrganization().getId()))
                .overrideMaxProjects(lic.getOverrideMaxProjects())
                .overrideMaxOlts(lic.getOverrideMaxOlts())
                .overrideMaxOdps(lic.getOverrideMaxOdps())
                .overrideMaxOdcs(lic.getOverrideMaxOdcs())
                .overrideMaxCustomers(lic.getOverrideMaxCustomers())
                .overrideMaxStorageGb(lic.getOverrideMaxStorageGb())
                .custom(isCustom)
                .featureSsoEnabled(lic.isFeatureSsoEnabled())
                .featureApiEnabled(lic.isFeatureApiEnabled())
                .featureAiCopilotEnabled(lic.isFeatureAiCopilotEnabled())
                .featureCustomDomainEnabled(lic.isFeatureCustomDomainEnabled())
                .billingContactName(lic.getBillingContactName())
                .billingContactEmail(lic.getBillingContactEmail())
                .billingContactPhone(lic.getBillingContactPhone())
                .notifyEmailEnabled(lic.isNotifyEmailEnabled())
                .notifyWhatsappEnabled(lic.isNotifyWhatsappEnabled())
                .createdAt(lic.getCreatedAt())
                .build();
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 12) return "K2NET-****-****-****";
        String[] parts = key.split("-");
        if (parts.length == 4) {
            return parts[0] + "-" + parts[1] + "-****-" + parts[3];
        }
        return key.substring(0, 8) + "-****-" + key.substring(key.length() - 4);
    }

    /**
     * Menghitung estimasi prorata penyesuaian biaya upgrade paket langganan
     * di tengah periode siklus berjalan (Mid-Cycle Upgrade).
     */
    @Transactional(readOnly = true)
    public ProrateEstimateResponseDto calculateProrateEstimate(UUID orgId, String targetPlanName) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + orgId));

        if (targetPlanName == null || targetPlanName.trim().isEmpty()) {
            throw new IllegalArgumentException("Nama target paket langganan wajib disertakan.");
        }

        String normalizedTargetPlan = targetPlanName.trim().toUpperCase(Locale.ROOT);
        SubscriptionPlan targetPlan = subscriptionPlanRepository.findByName(normalizedTargetPlan)
                .orElseThrow(() -> new NoSuchElementException("Paket langganan target tidak ditemukan: " + targetPlanName));

        // Dapatkan lisensi aktif tenant saat ini
        Optional<TenantLicense> activeLicenseOpt = tenantLicenseRepository
                .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE);

        SubscriptionPlan currentPlan = activeLicenseOpt.map(TenantLicense::getSubscriptionPlan)
                .orElse(org.getSubscriptionPlan());

        String currentPlanName = currentPlan != null ? currentPlan.getName() : "FREE";
        BigDecimal currentPlanPrice = currentPlan != null && currentPlan.getPrice() != null
                ? currentPlan.getPrice()
                : BigDecimal.ZERO;
        BigDecimal targetPlanPrice = targetPlan.getPrice() != null ? targetPlan.getPrice() : BigDecimal.ZERO;

        long daysRemaining = 0;
        int totalCycleDays = 30;
        BigDecimal dailyRateOld = BigDecimal.ZERO;
        BigDecimal proratedCredit = BigDecimal.ZERO;
        boolean isUpgrade = targetPlanPrice.compareTo(currentPlanPrice) > 0;

        if (activeLicenseOpt.isPresent() && activeLicenseOpt.get().getValidUntil() != null) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime validUntil = activeLicenseOpt.get().getValidUntil();
            if (validUntil.isAfter(now)) {
                daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(now.toLocalDate(), validUntil.toLocalDate());
                if (daysRemaining <= 0 && validUntil.isAfter(now)) {
                    daysRemaining = 1;
                }
                if (daysRemaining > 0 && currentPlanPrice.compareTo(BigDecimal.ZERO) > 0 && isUpgrade) {
                    dailyRateOld = currentPlanPrice.divide(BigDecimal.valueOf(totalCycleDays), 2, RoundingMode.HALF_UP);
                    long creditDays = Math.min(totalCycleDays, daysRemaining);
                    proratedCredit = dailyRateOld.multiply(BigDecimal.valueOf(creditDays));
                    if (proratedCredit.compareTo(currentPlanPrice) > 0) {
                        proratedCredit = currentPlanPrice;
                    }
                }
            }
        }

        BigDecimal netDueAmount = targetPlanPrice.subtract(proratedCredit);
        if (netDueAmount.compareTo(BigDecimal.ZERO) < 0) {
            netDueAmount = BigDecimal.ZERO;
        }

        String summary = isUpgrade
                ? String.format("Upgrade from %s to %s with %d days remaining credited.", currentPlanName, normalizedTargetPlan, daysRemaining)
                : String.format("Direct subscription to %s.", normalizedTargetPlan);

        return ProrateEstimateResponseDto.builder()
                .currentPlan(currentPlanName)
                .targetPlan(normalizedTargetPlan)
                .currentPlanPrice(currentPlanPrice)
                .targetPlanPrice(targetPlanPrice)
                .daysRemaining(daysRemaining)
                .totalCycleDays(totalCycleDays)
                .dailyRateOld(dailyRateOld)
                .proratedCredit(proratedCredit)
                .netDueAmount(netDueAmount)
                .currency("IDR")
                .isUpgradeEligible(isUpgrade)
                .calculationSummary(summary)
                .build();
    }

    /**
     * Mengambil seluruh katalog paket langganan master untuk tata kelola Super Admin.
     */
    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllSubscriptionPlans() {
        return subscriptionPlanRepository.findAll();
    }

    /**
     * Memperbarui informasi harga, kuota dasar bawaan, dan kapabilitas paket langganan master (Super Admin).
     */
    @Transactional
    public SubscriptionPlan updateSubscriptionPlan(UUID planId, UpdateSubscriptionPlanRequest request, String actor) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new NoSuchElementException("Paket langganan tidak ditemukan: " + planId));

        if (request.getDescription() != null) plan.setDescription(request.getDescription());
        if (request.getPrice() != null) plan.setPrice(request.getPrice());
        if (request.getMaxProjects() != null) plan.setMaxProjects(request.getMaxProjects());
        if (request.getMaxArchivedProjects() != null) plan.setMaxArchivedProjects(request.getMaxArchivedProjects());
        if (request.getMaxOdcs() != null) plan.setMaxOdcs(request.getMaxOdcs());
        if (request.getMaxOdps() != null) plan.setMaxOdps(request.getMaxOdps());
        if (request.getMaxCustomers() != null) plan.setMaxCustomers(request.getMaxCustomers());
        if (request.getMaxOlts() != null) plan.setMaxOlts(request.getMaxOlts());
        if (request.getMaxStorageGb() != null) plan.setMaxStorageGb(request.getMaxStorageGb());
        if (request.getApiRateLimitRpm() != null) plan.setApiRateLimitRpm(request.getApiRateLimitRpm());
        if (request.getHasSso() != null) plan.setHasSso(request.getHasSso());
        if (request.getHasApiAccess() != null) plan.setHasApiAccess(request.getHasApiAccess());

        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);

        auditLog("system", "SUBSCRIPTION_PLAN_UPDATED", planId.toString(),
                "Super Admin '" + actor + "' updated plan '" + plan.getName() + "' (Price: " + plan.getPrice() + ")");

        log.info("💎 SUBSCRIPTION PLAN UPDATED: Plan '{}' (ID: {}) updated by '{}'",
                saved.getName(), planId, actor);

        return saved;
    }

    /**
     * Memperbarui detail lisensi spesifik organisasi tenant (Super Admin).
     * Mendukung kustomisasi kuota overrides, masa aktif/grace, hardware fingerprint,
     * feature entitlements, dan kontak penagihan.
     */
    @Transactional
    public TenantLicense updateTenantLicense(UUID licenseId, UpdateTenantLicenseRequest request, String actor) {
        unwrapAndDisableOrgFilter();
        try {
            TenantLicense lic = tenantLicenseRepository.findById(licenseId)
                    .orElseThrow(() -> new NoSuchElementException("Lisensi tidak ditemukan: " + licenseId));

            if (request.getStatus() != null) {
                lic.setStatus(request.getStatus());
            }
            if (request.getValidUntil() != null) {
                lic.setValidUntil(request.getValidUntil());
            }
            if (request.getGracePeriodUntil() != null) {
                lic.setGracePeriodUntil(request.getGracePeriodUntil());
            }

            // Custom Quota Overrides
            if (request.getOverrideMaxProjects() != null) lic.setOverrideMaxProjects(request.getOverrideMaxProjects());
            if (request.getOverrideMaxOlts() != null) lic.setOverrideMaxOlts(request.getOverrideMaxOlts());
            if (request.getOverrideMaxOdps() != null) lic.setOverrideMaxOdps(request.getOverrideMaxOdps());
            if (request.getOverrideMaxOdcs() != null) lic.setOverrideMaxOdcs(request.getOverrideMaxOdcs());
            if (request.getOverrideMaxCustomers() != null) lic.setOverrideMaxCustomers(request.getOverrideMaxCustomers());
            if (request.getOverrideMaxStorageGb() != null) lic.setOverrideMaxStorageGb(request.getOverrideMaxStorageGb());

            // Feature Entitlements
            if (request.getFeatureSsoEnabled() != null) lic.setFeatureSsoEnabled(request.getFeatureSsoEnabled());
            if (request.getFeatureApiEnabled() != null) lic.setFeatureApiEnabled(request.getFeatureApiEnabled());
            if (request.getFeatureAiCopilotEnabled() != null) lic.setFeatureAiCopilotEnabled(request.getFeatureAiCopilotEnabled());
            if (request.getFeatureCustomDomainEnabled() != null) lic.setFeatureCustomDomainEnabled(request.getFeatureCustomDomainEnabled());

            // Hardware Binding & Notes
            if (request.getMachineFingerprint() != null) lic.setMachineFingerprint(request.getMachineFingerprint().trim());
            if (request.getNotes() != null) lic.setNotes(request.getNotes());

            // Billing Contacts
            if (request.getBillingContactName() != null) lic.setBillingContactName(request.getBillingContactName().trim());
            if (request.getBillingContactEmail() != null) lic.setBillingContactEmail(request.getBillingContactEmail().trim());
            if (request.getBillingContactPhone() != null) lic.setBillingContactPhone(request.getBillingContactPhone().trim());
            if (request.getNotifyEmailEnabled() != null) lic.setNotifyEmailEnabled(request.getNotifyEmailEnabled());
            if (request.getNotifyWhatsappEnabled() != null) lic.setNotifyWhatsappEnabled(request.getNotifyWhatsappEnabled());

            // Perbarui tanda tangan kriptografis Ed25519 jika masa aktif atau hardware fingerprint berubah
            if (request.getValidUntil() != null || request.getMachineFingerprint() != null) {
                String tier = lic.getSubscriptionPlan() != null ? lic.getSubscriptionPlan().getName() : "PRO";
                String newSig = licenseCryptoService.signLicenseMetadata(
                        lic.getOrganization().getId(),
                        tier,
                        lic.getLicenseKey(),
                        lic.getValidFrom(),
                        lic.getValidUntil(),
                        lic.getMachineFingerprint()
                );
                lic.setLicenseSignature(newSig);
            }

            TenantLicense saved = tenantLicenseRepository.save(lic);

            auditLog(lic.getOrganization() != null ? lic.getOrganization().getSlug() : "system",
                    "LICENSE_UPDATED", licenseId.toString(),
                    "Super Admin '" + actor + "' updated license details and quota overrides.");

            log.info("🔑 LICENSE UPDATED: License '{}' (ID: {}) for org '{}' updated by '{}'",
                    lic.getLicenseKey(), licenseId,
                    lic.getOrganization() != null ? lic.getOrganization().getSlug() : "unknown",
                    actor);

            return saved;
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    private void auditLog(String tenantSlug, String action, String orgId, String details) {
        try {
            auditLoggingService.logEvent(
                    tenantSlug,
                    action,
                    "ORGANIZATION",
                    orgId,
                    null,
                    null,
                    Map.of("details", details)
            );
        } catch (Exception e) {
            log.warn("Non-critical audit log failure: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<com.company.ftthgis.api.system.dto.TenantSubscriptionResponseDto> getAllTenantSubscriptions() {
        unwrapAndDisableOrgFilter();
        try {
            return tenantSubscriptionRepository.findAll().stream()
                    .map(this::mapToSubscriptionDto)
                    .toList();
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    @Transactional(readOnly = true)
    public Optional<com.company.ftthgis.api.system.dto.TenantSubscriptionResponseDto> getTenantSubscriptionById(UUID id) {
        unwrapAndDisableOrgFilter();
        try {
            return tenantSubscriptionRepository.findById(id).map(this::mapToSubscriptionDto);
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }

    @Transactional(readOnly = true)
    public List<BillingPolicy> getAllBillingPolicies() {
        return billingPolicyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<PlanVersion> getPlanVersions(UUID planId) {
        return planVersionRepository.findByPlanIdOrderByCreatedAtDesc(planId);
    }

    @Transactional
    public PlanVersion createPlanVersion(UUID planId, com.company.ftthgis.api.system.dto.CreatePlanVersionRequest req, String actor) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Subscription plan not found: " + planId));

        planVersionRepository.findByPlanIdAndVersion(planId, req.getVersion()).ifPresent(v -> {
            throw new IllegalArgumentException("Version '" + req.getVersion() + "' already exists for plan: " + plan.getName());
        });

        BigDecimal priceYearly = req.getPriceYearly() != null
                ? req.getPriceYearly()
                : req.getPriceMonthly().multiply(BigDecimal.valueOf(10));

        PlanVersion version = PlanVersion.builder()
                .plan(plan)
                .version(req.getVersion())
                .status(req.getStatus() != null ? req.getStatus() : "DRAFT")
                .priceMonthly(req.getPriceMonthly())
                .priceYearly(priceYearly)
                .currency(req.getCurrency() != null ? req.getCurrency() : "IDR")
                .maxProjects(req.getMaxProjects() != null ? req.getMaxProjects() : plan.getMaxProjects())
                .maxArchivedProjects(req.getMaxArchivedProjects() != null ? req.getMaxArchivedProjects() : plan.getMaxArchivedProjects())
                .maxOlts(req.getMaxOlts() != null ? req.getMaxOlts() : plan.getMaxOlts())
                .maxOdcs(req.getMaxOdcs() != null ? req.getMaxOdcs() : plan.getMaxOdcs())
                .maxOdps(req.getMaxOdps() != null ? req.getMaxOdps() : plan.getMaxOdps())
                .maxCustomers(req.getMaxCustomers() != null ? req.getMaxCustomers() : plan.getMaxCustomers())
                .maxStorageGb(req.getMaxStorageGb() != null ? req.getMaxStorageGb() : plan.getMaxStorageGb())
                .apiRateLimitRpm(req.getApiRateLimitRpm() != null ? req.getApiRateLimitRpm() : plan.getApiRateLimitRpm())
                .hasSso(req.getHasSso() != null ? req.getHasSso() : plan.isHasSso())
                .hasApiAccess(req.getHasApiAccess() != null ? req.getHasApiAccess() : plan.isHasApiAccess())
                .hasAiCopilot(req.getHasAiCopilot() != null ? req.getHasAiCopilot() : false)
                .hasCustomDomain(req.getHasCustomDomain() != null ? req.getHasCustomDomain() : false)
                .graceDays(req.getGraceDays() != null ? req.getGraceDays() : 14)
                .readonlyDays(req.getReadonlyDays() != null ? req.getReadonlyDays() : 14)
                .publishedBy(actor)
                .changelog(req.getChangelog())
                .build();

        PlanVersion saved = planVersionRepository.save(version);
        log.info("📦 PLAN VERSION CREATED: '{}' ({}) for plan '{}' by '{}'",
                saved.getVersion(), saved.getStatus(), plan.getName(), actor);
        return saved;
    }

    @Transactional
    public PlanVersion publishPlanVersion(UUID planId, UUID versionId, String actor) {
        PlanVersion version = planVersionRepository.findById(versionId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Plan version not found: " + versionId));

        if (!version.getPlan().getId().equals(planId)) {
            throw new IllegalArgumentException("Version does not belong to specified plan: " + planId);
        }

        // Archive previous active version if any
        planVersionRepository.findByPlanIdOrderByCreatedAtDesc(planId).stream()
                .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()) && !v.getId().equals(versionId))
                .forEach(oldActive -> {
                    oldActive.setStatus("ARCHIVED");
                    oldActive.setEffectiveTo(LocalDateTime.now());
                    planVersionRepository.save(oldActive);
                });

        version.setStatus("ACTIVE");
        version.setEffectiveFrom(LocalDateTime.now());
        version.setPublishedBy(actor);
        PlanVersion published = planVersionRepository.save(version);

        // Update baseline master plan price and quota references
        SubscriptionPlan plan = version.getPlan();
        if (plan != null) {
            plan.setPrice(version.getPriceMonthly());
            plan.setMaxProjects(version.getMaxProjects());
            plan.setMaxArchivedProjects(version.getMaxArchivedProjects());
            plan.setMaxOlts(version.getMaxOlts());
            plan.setMaxOdcs(version.getMaxOdcs());
            plan.setMaxOdps(version.getMaxOdps());
            plan.setMaxCustomers(version.getMaxCustomers());
            plan.setMaxStorageGb(version.getMaxStorageGb());
            plan.setHasSso(version.isHasSso());
            plan.setHasApiAccess(version.isHasApiAccess());
            subscriptionPlanRepository.save(plan);
        }

        log.info("🚀 PLAN VERSION PUBLISHED: '{}' for plan '{}' by '{}' - Baseline price & quotas synced",
                published.getVersion(), plan != null ? plan.getName() : "Unknown", actor);
        return published;
    }

    // ── Message Templates Management (Domain: Catalog / C4) ─────────────────

    public List<MessageTemplate> getAllMessageTemplates() {
        return messageTemplateRepository.findAllByOrderByCreatedAtDesc();
    }

    public MessageTemplate getMessageTemplateById(UUID id) {
        return messageTemplateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Message template not found: " + id));
    }

    @Transactional
    public MessageTemplate createMessageTemplate(com.company.ftthgis.api.system.dto.CreateMessageTemplateRequest req, String actor) {
        messageTemplateRepository.findByCode(req.getCode().toUpperCase().trim()).ifPresent(t -> {
            throw new IllegalArgumentException("Template with code '" + req.getCode() + "' already exists");
        });

        MessageTemplate template = MessageTemplate.builder()
                .code(req.getCode().toUpperCase().trim())
                .name(req.getName().trim())
                .channel(req.getChannel().toUpperCase().trim())
                .category(req.getCategory() != null ? req.getCategory().toUpperCase().trim() : "DUNNING")
                .subjectTemplate(req.getSubjectTemplate())
                .bodyTemplate(req.getBodyTemplate())
                .variablesDescription(req.getVariablesDescription())
                .active(req.getActive() != null ? req.getActive() : true)
                .build();

        MessageTemplate saved = messageTemplateRepository.save(template);
        log.info("📝 MESSAGE TEMPLATE CREATED: '{}' ({}) by '{}'", saved.getCode(), saved.getName(), actor);
        return saved;
    }

    @Transactional
    public MessageTemplate updateMessageTemplate(UUID id, com.company.ftthgis.api.system.dto.UpdateMessageTemplateRequest req, String actor) {
        MessageTemplate template = getMessageTemplateById(id);

        template.setName(req.getName().trim());
        template.setChannel(req.getChannel().toUpperCase().trim());
        if (req.getCategory() != null) {
            template.setCategory(req.getCategory().toUpperCase().trim());
        }
        template.setSubjectTemplate(req.getSubjectTemplate());
        template.setBodyTemplate(req.getBodyTemplate());
        template.setVariablesDescription(req.getVariablesDescription());
        if (req.getActive() != null) {
            template.setActive(req.getActive());
        }

        MessageTemplate saved = messageTemplateRepository.save(template);
        log.info("📝 MESSAGE TEMPLATE UPDATED: '{}' by '{}'", saved.getCode(), actor);
        return saved;
    }

    @Transactional
    public void deleteMessageTemplate(UUID id, String actor) {
        MessageTemplate template = getMessageTemplateById(id);
        messageTemplateRepository.delete(template);
        log.info("🗑️ MESSAGE TEMPLATE DELETED: '{}' by '{}'", template.getCode(), actor);
    }

    public com.company.ftthgis.api.system.dto.PreviewMessageTemplateResponse previewMessageTemplate(com.company.ftthgis.api.system.dto.PreviewMessageTemplateRequest req) {
        Map<String, String> vars = new LinkedHashMap<>();

        if (req.getVariables() != null && !req.getVariables().isEmpty()) {
            vars.putAll(req.getVariables());
        } else {
            // Ambil sample dinamis dari tenant & lisensi aktif yang ada di live database
            unwrapAndDisableOrgFilter();
            TenantLicense sampleLic = tenantLicenseRepository.findAll().stream()
                    .filter(l -> l.getStatus() == LicenseStatus.ACTIVE || l.getStatus() == LicenseStatus.GRACE_PERIOD)
                    .findFirst()
                    .orElseGet(() -> tenantLicenseRepository.findAll().stream().findFirst().orElse(null));

            Organization sampleOrg = (sampleLic != null && sampleLic.getOrganization() != null)
                    ? sampleLic.getOrganization()
                    : organizationRepository.findAll().stream().findFirst().orElse(null);

            SubscriptionPlan samplePlan = (sampleLic != null && sampleLic.getSubscriptionPlan() != null)
                    ? sampleLic.getSubscriptionPlan()
                    : subscriptionPlanRepository.findAll().stream().findFirst().orElse(null);

            String tenantName = sampleOrg != null ? sampleOrg.getName() : "Tenant FTTH";
            String planName = samplePlan != null ? samplePlan.getName() : "Standard";
            String dueDate = (sampleLic != null && sampleLic.getValidUntil() != null)
                    ? sampleLic.getValidUntil().format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
                    : LocalDateTime.now().plusDays(7).format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
            String licenseKey = (sampleLic != null && sampleLic.getLicenseKey() != null)
                    ? sampleLic.getLicenseKey()
                    : "K2NET-ACTIVE-KEY";
            String invoiceNumber = "INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-0001";
            String invoiceAmount = samplePlan != null ? formatCurrencyIdr(samplePlan.getPrice()) : "Rp 0";
            String paymentLink = sampleOrg != null
                    ? "https://" + sampleOrg.getSlug() + ".kdua.net/billing/invoices"
                    : "https://app.kdua.net/billing";
            String graceDays = "14";

            if (sampleOrg != null) {
                billingInvoiceRepository.findByOrganizationIdOrderByCreatedAtDesc(sampleOrg.getId())
                        .stream()
                        .findFirst()
                        .ifPresent(inv -> {
                            vars.put("invoice_number", inv.getInvoiceNumber());
                            vars.put("invoice_amount", formatCurrencyIdr(inv.getAmount()));
                            if (inv.getExternalInvoiceUrl() != null && !inv.getExternalInvoiceUrl().isBlank()) {
                                vars.put("payment_link", inv.getExternalInvoiceUrl());
                            }
                        });
            }

            // Ambil toleransi grace period dari kebijakan aktif di DB
            billingPolicyRepository.findByPolicyKey("grace_period_days")
                    .ifPresent(p -> vars.put("grace_days_remaining", p.getPolicyValue()));

            vars.putIfAbsent("tenant_name", tenantName);
            vars.putIfAbsent("plan_name", planName);
            vars.putIfAbsent("due_date", dueDate);
            vars.putIfAbsent("license_key", licenseKey);
            vars.putIfAbsent("invoice_number", invoiceNumber);
            vars.putIfAbsent("invoice_amount", invoiceAmount);
            vars.putIfAbsent("payment_link", paymentLink);
            vars.putIfAbsent("grace_days_remaining", graceDays);
        }

        String renderedSubject = req.getSubjectTemplate();
        String renderedBody = req.getBodyTemplate();

        for (Map.Entry<String, String> entry : vars.entrySet()) {
            String keyDouble = "{{" + entry.getKey() + "}}";
            String keySingle = "{" + entry.getKey() + "}";
            if (renderedSubject != null) {
                renderedSubject = renderedSubject.replace(keyDouble, entry.getValue()).replace(keySingle, entry.getValue());
            }
            if (renderedBody != null) {
                renderedBody = renderedBody.replace(keyDouble, entry.getValue()).replace(keySingle, entry.getValue());
            }
        }

        return com.company.ftthgis.api.system.dto.PreviewMessageTemplateResponse.builder()
                .subject(renderedSubject != null ? renderedSubject : "")
                .body(renderedBody != null ? renderedBody : "")
                .appliedVariables(vars)
                .build();
    }

    private String formatCurrencyIdr(BigDecimal amount) {
        if (amount == null) return "Rp 0";
        return "Rp " + java.text.NumberFormat.getNumberInstance(java.util.Locale.forLanguageTag("id-ID")).format(amount);
    }

    private com.company.ftthgis.api.system.dto.TenantSubscriptionResponseDto mapToSubscriptionDto(TenantSubscription sub) {
        SubscriptionPlan basePlan = sub.getPlanVersion() != null ? sub.getPlanVersion().getPlan() : null;
        boolean isCustom = isQuotaCustom(
                sub.getOverrideMaxProjects(), basePlan != null ? basePlan.getMaxProjects() : null,
                sub.getOverrideMaxOlts(), basePlan != null ? basePlan.getMaxOlts() : null,
                sub.getOverrideMaxOdps(), basePlan != null ? basePlan.getMaxOdps() : null,
                sub.getOverrideMaxOdcs(), basePlan != null ? basePlan.getMaxOdcs() : null,
                sub.getOverrideMaxCustomers(), basePlan != null ? basePlan.getMaxCustomers() : null,
                sub.getOverrideMaxStorageGb(), basePlan != null ? basePlan.getMaxStorageGb() : null
        );

        return com.company.ftthgis.api.system.dto.TenantSubscriptionResponseDto.builder()
                .id(sub.getId())
                .organizationId(sub.getOrganization() != null ? sub.getOrganization().getId() : null)
                .organizationName(sub.getOrganization() != null ? sub.getOrganization().getName() : null)
                .organizationSlug(sub.getOrganization() != null ? sub.getOrganization().getSlug() : null)
                .planVersionId(sub.getPlanVersion() != null ? sub.getPlanVersion().getId() : null)
                .planName(sub.getPlanVersion() != null && sub.getPlanVersion().getPlan() != null ? sub.getPlanVersion().getPlan().getName() : null)
                .version(sub.getPlanVersion() != null ? sub.getPlanVersion().getVersion() : null)
                .status(sub.getStatus())
                .billingCycle(sub.getBillingCycle())
                .currentPeriodStart(sub.getCurrentPeriodStart())
                .currentPeriodEnd(sub.getCurrentPeriodEnd())
                .gracePeriodEnd(sub.getGracePeriodEnd())
                .test(sub.isTest())
                .priceMonthly(sub.getPlanVersion() != null ? sub.getPlanVersion().getPriceMonthly() : null)
                .priceYearly(sub.getPlanVersion() != null ? sub.getPlanVersion().getPriceYearly() : null)
                .currency(sub.getPlanVersion() != null ? sub.getPlanVersion().getCurrency() : "IDR")
                .billingContactName(sub.getBillingContactName())
                .billingContactEmail(sub.getBillingContactEmail())
                .billingContactPhone(sub.getBillingContactPhone())
                .overrideMaxProjects(sub.getOverrideMaxProjects())
                .overrideMaxArchivedProjects(sub.getOverrideMaxArchivedProjects())
                .overrideMaxOlts(sub.getOverrideMaxOlts())
                .overrideMaxOdcs(sub.getOverrideMaxOdcs())
                .overrideMaxOdps(sub.getOverrideMaxOdps())
                .overrideMaxCustomers(sub.getOverrideMaxCustomers())
                .overrideMaxStorageGb(sub.getOverrideMaxStorageGb())
                .overrideApiRateLimitRpm(sub.getOverrideApiRateLimitRpm())
                .custom(isCustom)
                .featureSsoEnabled(sub.isFeatureSsoEnabled())
                .featureApiEnabled(sub.isFeatureApiEnabled())
                .featureAiCopilotEnabled(sub.isFeatureAiCopilotEnabled())
                .featureCustomDomainEnabled(sub.isFeatureCustomDomainEnabled())
                .notes(sub.getNotes())
                .createdAt(sub.getCreatedAt())
                .updatedAt(sub.getUpdatedAt())
                .build();
    }

    private boolean isQuotaCustom(
            Integer ovProjects, Integer baseProjects,
            Integer ovOlts, Integer baseOlts,
            Integer ovOdps, Integer baseOdps,
            Integer ovOdcs, Integer baseOdcs,
            Integer ovCust, Integer baseCust,
            Integer ovStorage, Integer baseStorage
    ) {
        if (ovProjects != null && baseProjects != null && !ovProjects.equals(baseProjects)) return true;
        if (ovOlts != null && baseOlts != null && !ovOlts.equals(baseOlts)) return true;
        if (ovOdps != null && baseOdps != null && !ovOdps.equals(baseOdps)) return true;
        if (ovOdcs != null && baseOdcs != null && !ovOdcs.equals(baseOdcs)) return true;
        if (ovCust != null && baseCust != null && !ovCust.equals(baseCust)) return true;
        if (ovStorage != null && baseStorage != null && !ovStorage.equals(baseStorage)) return true;
        return false;
    }

    // ── Billing Invoices (Commercial Domain) ────────────────────────────────

    public List<BillingInvoiceResponseDto> getAllBillingInvoices() {
        return billingInvoiceRepository.findAllWithOrganizationOrderByCreatedAtDesc().stream()
                .map(this::mapToInvoiceDto)
                .toList();
    }

    public Optional<BillingInvoiceResponseDto> getBillingInvoiceById(UUID id) {
        return billingInvoiceRepository.findById(id).map(this::mapToInvoiceDto);
    }

    @Transactional
    public BillingInvoiceResponseDto createManualInvoice(CreateBillingInvoiceRequest req, String actor) {
        Organization org = organizationRepository.findById(req.getOrganizationId())
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan untuk ID: " + req.getOrganizationId()));

        TenantSubscription subscription = null;
        if (req.getSubscriptionId() != null) {
            subscription = tenantSubscriptionRepository.findById(req.getSubscriptionId()).orElse(null);
        } else {
            subscription = tenantSubscriptionRepository.findActiveSubscriptionByOrganizationId(org.getId()).orElse(null);
        }

        long count = billingInvoiceRepository.count() + 1;
        String invNumber = String.format("INV/%d/%02d/%05d",
                LocalDateTime.now().getYear(),
                LocalDateTime.now().getMonthValue(),
                count
        );

        int dueDays = req.getDueDays() != null && req.getDueDays() > 0 ? req.getDueDays() : 14;

        BillingInvoice invoice = BillingInvoice.builder()
                .organization(org)
                .subscription(subscription)
                .invoiceNumber(invNumber)
                .description(req.getDescription())
                .amount(req.getAmount())
                .currency("IDR")
                .status(InvoiceStatus.PENDING)
                .dueDate(LocalDateTime.now().plusDays(dueDays))
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "XENDIT_VA")
                .paymentChannel("BCA")
                .createdBy(actor)
                .build();

        BillingInvoice saved = billingInvoiceRepository.save(invoice);
        log.info("🧾 INVOICE CREATED: '{}' for tenant '{}' ({}) by '{}', amount={}",
                invNumber, org.getName(), org.getSlug(), actor, req.getAmount());

        return mapToInvoiceDto(saved);
    }

    @Transactional
    public BillingInvoiceResponseDto settleInvoiceManually(UUID id, String actor, String paymentMethod, String paymentChannel) {
        BillingInvoice inv = billingInvoiceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Faktur tagihan tidak ditemukan: " + id));

        inv.setStatus(InvoiceStatus.PAID);
        inv.setPaidAt(LocalDateTime.now());
        if (paymentMethod != null && !paymentMethod.isBlank()) inv.setPaymentMethod(paymentMethod);
        if (paymentChannel != null && !paymentChannel.isBlank()) inv.setPaymentChannel(paymentChannel);
        inv.setUpdatedBy(actor);

        BillingInvoice saved = billingInvoiceRepository.save(inv);

        Organization org = inv.getOrganization();
        if (org != null) {
            org.setStatus(Organization.OrganizationStatus.ACTIVE);
            org.setDunningLevel(0);
            org.setOverQuotaMode(false);
            organizationRepository.save(org);

            tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE)
                    .ifPresent(lic -> extendLicense(lic.getId(), 1, "MANUAL_INVOICE_SETTLEMENT:" + actor));
        }

        log.info("✅ INVOICE SETTLED: '{}' manually marked as PAID by '{}'", inv.getInvoiceNumber(), actor);
        return mapToInvoiceDto(saved);
    }

    @Transactional
    public BillingInvoiceResponseDto cancelInvoice(UUID id, String actor, String reason) {
        BillingInvoice inv = billingInvoiceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Faktur tagihan tidak ditemukan: " + id));

        inv.setStatus(InvoiceStatus.CANCELLED);
        inv.setUpdatedBy(actor);
        BillingInvoice saved = billingInvoiceRepository.save(inv);

        log.info("🚫 INVOICE CANCELLED: '{}' by '{}', reason: {}", inv.getInvoiceNumber(), actor, reason);
        return mapToInvoiceDto(saved);
    }

    public BillingInvoiceResponseDto mapToInvoiceDto(BillingInvoice inv) {
        if (inv == null) return null;
        Organization org = inv.getOrganization();
        return BillingInvoiceResponseDto.builder()
                .id(inv.getId())
                .organizationId(org != null ? org.getId() : null)
                .organizationName(org != null ? org.getName() : null)
                .organizationSlug(org != null ? org.getSlug() : null)
                .subscriptionId(inv.getSubscription() != null ? inv.getSubscription().getId() : null)
                .invoiceNumber(inv.getInvoiceNumber())
                .description(inv.getDescription())
                .amount(inv.getAmount())
                .currency(inv.getCurrency())
                .status(inv.getStatus())
                .dueDate(inv.getDueDate())
                .paidAt(inv.getPaidAt())
                .paymentMethod(inv.getPaymentMethod())
                .paymentChannel(inv.getPaymentChannel())
                .externalInvoiceUrl(inv.getExternalInvoiceUrl())
                .externalReferenceId(inv.getExternalReferenceId())
                .createdAt(inv.getCreatedAt())
                .build();
    }
}
