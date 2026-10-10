package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.LicenseOverviewKpiDto;
import com.company.ftthgis.api.system.dto.UpdateSubscriptionPlanRequest;
import com.company.ftthgis.api.system.dto.UpdateTenantLicenseRequest;
import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.api.tenant.dto.LicenseIssueRequest;
import com.company.ftthgis.api.tenant.dto.LicenseResponseDto;
import com.company.ftthgis.api.tenant.dto.ProrateEstimateResponseDto;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.BillingInvoiceRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final LicenseCryptoService licenseCryptoService;
    private final AuditLoggingService auditLoggingService;

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
        LocalDateTime validUntil = now.plusMonths(Math.max(1, durationMonths));

        String tier = plan != null ? plan.getName() : "PRO";
        String licenseKey = licenseCryptoService.generateLicenseKey(tier);
        String signature = licenseCryptoService.signLicenseMetadata(
                org.getId(),
                tier,
                licenseKey,
                now,
                validUntil,
                null
        );

        TenantLicense license = TenantLicense.builder()
                .organization(org)
                .subscriptionPlan(plan)
                .licenseKey(licenseKey)
                .licenseSignature(signature)
                .status(LicenseStatus.ACTIVE)
                .activationType("ONLINE")
                .validFrom(now)
                .validUntil(validUntil)
                .issuedBy(issuedBy != null ? issuedBy : "SYSTEM_BILLING")
                .featureSsoEnabled(plan != null && plan.isHasSso())
                .featureApiEnabled(plan != null && plan.isHasApiAccess())
                .notes("Online subscription license issued automatically")
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

        TenantLicense license = TenantLicense.builder()
                .organization(org)
                .subscriptionPlan(plan)
                .licenseKey(licenseKey)
                .licenseSignature(signature)
                .status(LicenseStatus.ACTIVE)
                .activationType(request.getActivationType() != null ? request.getActivationType() : "ENTERPRISE_PO")
                .validFrom(now)
                .validUntil(validUntil)
                .overrideMaxProjects(request.getOverrideMaxProjects())
                .overrideMaxOdps(request.getOverrideMaxOdps())
                .overrideMaxOdcs(request.getOverrideMaxOdcs())
                .overrideMaxCustomers(request.getOverrideMaxCustomers())
                .overrideMaxStorageGb(request.getOverrideMaxStorageGb())
                .featureSsoEnabled(Boolean.TRUE.equals(request.getFeatureSsoEnabled()) || (plan != null && plan.isHasSso()))
                .featureApiEnabled(Boolean.TRUE.equals(request.getFeatureApiEnabled()) || (plan != null && plan.isHasApiAccess()))
                .featureAiCopilotEnabled(Boolean.TRUE.equals(request.getFeatureAiCopilotEnabled()))
                .featureCustomDomainEnabled(Boolean.TRUE.equals(request.getFeatureCustomDomainEnabled()))
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

            license = TenantLicense.builder()
                    .organization(org)
                    .subscriptionPlan(plan)
                    .licenseKey(licenseKey.trim().toUpperCase(Locale.ROOT))
                    .licenseSignature(sig)
                    .status(LicenseStatus.ACTIVE)
                    .activationType("OFFLINE_KEY")
                    .validFrom(now)
                    .validUntil(validUntil)
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
        int baseOdps = plan != null && plan.getMaxOdps() != null ? plan.getMaxOdps() : 2500;
        int baseOdcs = plan != null && plan.getMaxOdcs() != null ? plan.getMaxOdcs() : 500;
        int baseCustomers = plan != null && plan.getMaxCustomers() != null ? plan.getMaxCustomers() : 5000;
        int baseStorage = "ENTERPRISE".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 500 :
                "PRO".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 100 :
                "STARTER".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 15 : 2;

        boolean isBooster = org.isBoosterActive();
        int boosterOlts = (isBooster && org.getBoosterOlts() != null) ? org.getBoosterOlts() : 0;
        int boosterOdps = (isBooster && org.getBoosterOdps() != null) ? org.getBoosterOdps() : 0;

        int effectiveProjects;
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

            sso = lic.isFeatureSsoEnabled() || sso;
            api = lic.isFeatureApiEnabled() || api;
            ai = lic.isFeatureAiCopilotEnabled();
            customDomain = lic.isFeatureCustomDomainEnabled();
        } else {
            effectiveProjects = baseProjects + boosterOlts;
            effectiveOdps = baseOdps + boosterOdps;
            if (boosterOlts > 0 || boosterOdps > 0) {
                source = "EMERGENCY_BOOSTER";
            }
        }

        return LicenseEntitlementsDto.builder()
                .maxProjects(effectiveProjects)
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
        Organization org = organizationRepository.findById(orgId).orElse(null);
        if (org == null) return Optional.empty();

        Optional<TenantLicense> licenseOpt = tenantLicenseRepository
                .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE);

        if (licenseOpt.isEmpty()) {
            licenseOpt = tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(orgId);
        }

        return licenseOpt.map(lic -> mapToResponseDto(lic, org));
    }

    /**
     * Mengambil seluruh lisensi tenant untuk dasbor Super Admin platform.
     */
    @Transactional(readOnly = true)
    public List<LicenseResponseDto> getAllLicenses() {
        List<TenantLicense> licenses = tenantLicenseRepository.findAll();
        List<LicenseResponseDto> dtos = new ArrayList<>();
        for (TenantLicense lic : licenses) {
            Organization org = lic.getOrganization();
            dtos.add(mapToResponseDto(lic, org));
        }
        return dtos;
    }

    /**
     * Memperpanjang masa aktif lisensi (Extend duration).
     */
    @Transactional
    public TenantLicense extendLicense(UUID licenseId, int additionalMonths, String extendedBy) {
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
    }

    /**
     * Mencabut lisensi secara permanen (Kill Switch) oleh Super Admin.
     */
    @Transactional
    public void revokeLicense(UUID licenseId, String reason, String revokedBy) {
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
    }

    /**
     * Mengambil riwayat seluruh lisensi milik suatu organisasi tenant.
     */
    @Transactional(readOnly = true)
    public List<LicenseResponseDto> getLicensesByOrganization(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + orgId));
        return tenantLicenseRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(lic -> mapToResponseDto(lic, org))
                .toList();
    }

    /**
     * Mengambil detail satu lisensi spesifik berdasarkan ID.
     */
    @Transactional(readOnly = true)
    public Optional<LicenseResponseDto> getLicenseById(UUID licenseId) {
        return tenantLicenseRepository.findById(licenseId)
                .map(lic -> mapToResponseDto(lic, lic.getOrganization()));
    }

    /**
     * Mengekspor sertifikat lisensi offline bertanda tangan digital (.lic).
     */
    @Transactional(readOnly = true)
    public String exportOfflineCertificate(UUID licenseId) {
        TenantLicense license = tenantLicenseRepository.findById(licenseId)
                .orElseThrow(() -> new NoSuchElementException("Lisensi tidak ditemukan: " + licenseId));
        return licenseCryptoService.generateOfflineCertificate(license, license.getOrganization());
    }

    /**
     * Menghasilkan agregasi ringkasan metrik KPI lisensi seluruh platform untuk Super Admin.
     */
    @Transactional(readOnly = true)
    public LicenseOverviewKpiDto getLicensesOverview() {
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
                if (lic.getSubscriptionPlan() != null && lic.getSubscriptionPlan().getPrice() != null) {
                    mrr += lic.getSubscriptionPlan().getPrice().doubleValue();
                }
            } else if (status == LicenseStatus.GRACE_PERIOD) {
                grace++;
            } else if (status == LicenseStatus.RESTRICTED_READ_ONLY) {
                readOnly++;
            } else if (status == LicenseStatus.SUSPENDED || status == LicenseStatus.REVOKED) {
                suspended++;
            }

            String tier = lic.getSubscriptionPlan() != null ? lic.getSubscriptionPlan().getName() : "PRO";
            tierDistribution.put(tier, tierDistribution.getOrDefault(tier, 0L) + 1);
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
                .overrideMaxOdps(lic.getOverrideMaxOdps())
                .overrideMaxOdcs(lic.getOverrideMaxOdcs())
                .overrideMaxCustomers(lic.getOverrideMaxCustomers())
                .overrideMaxStorageGb(lic.getOverrideMaxStorageGb())
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
}
