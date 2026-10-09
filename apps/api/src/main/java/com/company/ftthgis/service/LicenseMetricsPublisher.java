package com.company.ftthgis.service;

import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.MultiGauge;
import io.micrometer.core.instrument.Tags;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service publikasi telemetri & metrik lisensi platform secara real-time ke Prometheus via Micrometer.
 *
 * <p>Mengekspos metrik:
 * <ul>
 *   <li>{@code ftth_license_days_remaining{tenant_slug="...", plan="..."}}: Jumlah hari tersisa masa aktif lisensi</li>
 *   <li>{@code ftth_license_status{tenant_slug="...", status="..."}}: Status aktual lisensi per organisasi</li>
 *   <li>{@code ftth_hardware_quota_utilization_ratio{tenant_slug="...", resource="..."}}: Rasio konsumsi kuota (OLT, ODP, Storage)</li>
 *   <li>{@code ftth_platform_licenses_total{status="..."}}: Total lisensi platform terpartisi per status</li>
 *   <li>{@code ftth_platform_licenses_expiring_soon_count}: Lisensi yang akan kedaluwarsa dalam &le; 7 hari</li>
 *   <li>{@code ftth_platform_monthly_recurring_revenue_idr}: Estimasi MRR aktif platform dalam Rupiah</li>
 * </ul>
 */
@Service
@Slf4j
public class LicenseMetricsPublisher {

    private final TenantLicenseRepository tenantLicenseRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final ProjectQuotaService projectQuotaService;
    private final NetworkNodeRepository networkNodeRepository;

    private final MultiGauge daysRemainingGauge;
    private final MultiGauge licenseStatusGauge;
    private final MultiGauge quotaUtilizationGauge;
    private final MultiGauge platformTotalsGauge;
    private final AtomicLong expiringSoonGauge;
    private final AtomicLong mrrGauge;

    public LicenseMetricsPublisher(
            MeterRegistry meterRegistry,
            TenantLicenseRepository tenantLicenseRepository,
            OrganizationRepository organizationRepository,
            OrganizationConfigRepository organizationConfigRepository,
            ProjectQuotaService projectQuotaService,
            NetworkNodeRepository networkNodeRepository
    ) {
        this.tenantLicenseRepository = tenantLicenseRepository;
        this.organizationRepository = organizationRepository;
        this.organizationConfigRepository = organizationConfigRepository;
        this.projectQuotaService = projectQuotaService;
        this.networkNodeRepository = networkNodeRepository;

        this.daysRemainingGauge = MultiGauge.builder("ftth_license_days_remaining")
                .description("Remaining validity days for active/grace licenses")
                .baseUnit("days")
                .register(meterRegistry);

        this.licenseStatusGauge = MultiGauge.builder("ftth_license_status")
                .description("License status flag indicator (1.0 for active status)")
                .register(meterRegistry);

        this.quotaUtilizationGauge = MultiGauge.builder("ftth_hardware_quota_utilization_ratio")
                .description("Hardware quota utilization ratio (used / max) per tenant and resource")
                .register(meterRegistry);

        this.platformTotalsGauge = MultiGauge.builder("ftth_platform_licenses_total")
                .description("Platform total licenses partitioned by status")
                .register(meterRegistry);

        this.expiringSoonGauge = new AtomicLong(0);
        meterRegistry.gauge("ftth_platform_licenses_expiring_soon_count", this.expiringSoonGauge);

        this.mrrGauge = new AtomicLong(0);
        meterRegistry.gauge("ftth_platform_monthly_recurring_revenue_idr", this.mrrGauge);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("📊 LICENSE TELEMETRY: Initializing Micrometer gauges on application startup...");
        publishMetrics();
    }

    /**
     * Memperbarui metrik Prometheus setiap 30 detik secara periodik.
     */
    @Scheduled(fixedRate = 30000)
    @Transactional(readOnly = true)
    public void publishMetrics() {
        try {
            List<TenantLicense> allLicenses = tenantLicenseRepository.findAll();
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime in7Days = now.plusDays(7);

            List<MultiGauge.Row<?>> daysRemainingRows = new ArrayList<>();
            List<MultiGauge.Row<?>> licenseStatusRows = new ArrayList<>();
            List<MultiGauge.Row<?>> quotaRows = new ArrayList<>();

            Map<LicenseStatus, Long> statusCounts = new EnumMap<>(LicenseStatus.class);
            for (LicenseStatus s : LicenseStatus.values()) {
                statusCounts.put(s, 0L);
            }

            long expiringSoonCount = 0;
            double totalMrr = 0.0;

            // Catat lisensi aktif/terbaru per organisasi
            Map<UUID, TenantLicense> primaryOrgLicense = new HashMap<>();
            for (TenantLicense lic : allLicenses) {
                LicenseStatus status = lic.getStatus();
                statusCounts.put(status, statusCounts.getOrDefault(status, 0L) + 1);

                Organization org = lic.getOrganization();
                if (org == null) continue;

                // Prioritaskan status ACTIVE, lalu GRACE_PERIOD
                TenantLicense existing = primaryOrgLicense.get(org.getId());
                if (existing == null || (existing.getStatus() != LicenseStatus.ACTIVE && status == LicenseStatus.ACTIVE)) {
                    primaryOrgLicense.put(org.getId(), lic);
                }

                if (status == LicenseStatus.ACTIVE) {
                    if (lic.getValidUntil() != null && lic.getValidUntil().isAfter(now) && !lic.getValidUntil().isAfter(in7Days)) {
                        expiringSoonCount++;
                    }
                    if (lic.getSubscriptionPlan() != null && lic.getSubscriptionPlan().getPrice() != null) {
                        totalMrr += lic.getSubscriptionPlan().getPrice().doubleValue();
                    }
                }
            }

            // Bangun baris metrik per organisasi
            for (Map.Entry<UUID, TenantLicense> entry : primaryOrgLicense.entrySet()) {
                TenantLicense lic = entry.getValue();
                Organization org = lic.getOrganization();
                String slug = org.getSlug() != null ? org.getSlug() : org.getId().toString();
                String plan = lic.getSubscriptionPlan() != null ? lic.getSubscriptionPlan().getName() : "PRO";

                // 1. Sisa Hari
                long daysRemaining = 0;
                if (lic.getValidUntil() != null && lic.getValidUntil().isAfter(now)) {
                    daysRemaining = Duration.between(now, lic.getValidUntil()).toDays();
                } else if (lic.getGracePeriodUntil() != null && lic.getGracePeriodUntil().isAfter(now)) {
                    daysRemaining = Duration.between(now, lic.getGracePeriodUntil()).toDays();
                }

                daysRemainingRows.add(MultiGauge.Row.of(
                        Tags.of("tenant_slug", slug, "plan", plan),
                        daysRemaining
                ));

                // 2. Status Flag (1.0 untuk status aktif saat ini)
                licenseStatusRows.add(MultiGauge.Row.of(
                        Tags.of("tenant_slug", slug, "status", lic.getStatus().name()),
                        1.0
                ));

                // 3. Hardware Quota Utilization
                collectHardwareQuotaMetrics(org, lic, slug, quotaRows);
            }

            // 4. Platform Status Counts
            List<MultiGauge.Row<?>> platformTotalRows = new ArrayList<>();
            for (Map.Entry<LicenseStatus, Long> countEntry : statusCounts.entrySet()) {
                platformTotalRows.add(MultiGauge.Row.of(
                        Tags.of("status", countEntry.getKey().name()),
                        countEntry.getValue()
                ));
            }

            // Overwrite gauge state
            daysRemainingGauge.register(daysRemainingRows, true);
            licenseStatusGauge.register(licenseStatusRows, true);
            quotaUtilizationGauge.register(quotaRows, true);
            platformTotalsGauge.register(platformTotalRows, true);

            expiringSoonGauge.set(expiringSoonCount);
            mrrGauge.set((long) Math.round(totalMrr));

            log.debug("📊 LICENSE TELEMETRY SYNC: Updated {} tenants, {} expiring soon, MRR: Rp {}",
                    primaryOrgLicense.size(), expiringSoonCount, totalMrr);

        } catch (Exception e) {
            log.error("❌ LICENSE TELEMETRY ERROR: Failed to publish license metrics to Micrometer: {}", e.getMessage(), e);
        }
    }

    private void collectHardwareQuotaMetrics(
            Organization org,
            TenantLicense lic,
            String slug,
            List<MultiGauge.Row<?>> quotaRows
    ) {
        SubscriptionPlan plan = lic.getSubscriptionPlan() != null ? lic.getSubscriptionPlan() : org.getSubscriptionPlan();

        // --- OLT / Projects Quota ---
        int maxOlts = lic.getOverrideMaxProjects() != null ? lic.getOverrideMaxProjects() :
                (plan != null && plan.getMaxProjects() != null ? plan.getMaxProjects() : 6);
        if (org.isBoosterActive() && org.getBoosterOlts() != null && lic.getOverrideMaxProjects() == null) {
            maxOlts += org.getBoosterOlts();
        }
        long usedOlts = 0;
        try {
            usedOlts = projectQuotaService.getUsedActiveProjects(org.getId());
        } catch (Exception ignored) {}
        double oltRatio = maxOlts > 0 ? (double) usedOlts / maxOlts : 0.0;
        quotaRows.add(MultiGauge.Row.of(
                Tags.of("tenant_slug", slug, "resource", "olt"),
                Math.round(oltRatio * 1000.0) / 1000.0
        ));

        // --- ODP Quota ---
        int maxOdps = lic.getOverrideMaxOdps() != null ? lic.getOverrideMaxOdps() :
                (plan != null && plan.getMaxOdps() != null ? plan.getMaxOdps() : 2500);
        if (org.isBoosterActive() && org.getBoosterOdps() != null && lic.getOverrideMaxOdps() == null) {
            maxOdps += org.getBoosterOdps();
        }
        long usedOdps = 0;
        try {
            usedOdps = networkNodeRepository.countBillableOdpsByOrganizationId(org.getId());
        } catch (Exception ignored) {}
        double odpRatio = maxOdps > 0 ? (double) usedOdps / maxOdps : 0.0;
        quotaRows.add(MultiGauge.Row.of(
                Tags.of("tenant_slug", slug, "resource", "odp"),
                Math.round(odpRatio * 1000.0) / 1000.0
        ));

        // --- Storage Quota ---
        int maxStorageGb = lic.getOverrideMaxStorageGb() != null ? lic.getOverrideMaxStorageGb() :
                ("ENTERPRISE".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 500 :
                        "PRO".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 100 :
                                "STARTER".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 15 : 2);
        double usedStorageGb = 0.0;
        try {
            usedStorageGb = organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(org, "used_storage_gb")
                    .map(c -> {
                        try {
                            return Double.parseDouble(c.getConfigValue());
                        } catch (Exception e) {
                            return 0.0;
                        }
                    })
                    .orElse(0.0);
        } catch (Exception ignored) {}
        double storageRatio = maxStorageGb > 0 ? usedStorageGb / maxStorageGb : 0.0;
        quotaRows.add(MultiGauge.Row.of(
                Tags.of("tenant_slug", slug, "resource", "storage"),
                Math.round(storageRatio * 1000.0) / 1000.0
        ));
    }
}
