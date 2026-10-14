package com.company.ftthgis.config.security;

import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.BillingInvoiceRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import com.company.ftthgis.service.LicenseCryptoService;
import com.company.ftthgis.service.ProjectQuotaService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Session;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Seeder siklus hidup lisensi runtime & rekonsiliasi faktur tagihan untuk seluruh organisasi tenant.
 *
 * <p>Menjamin ketiadaan celah (*zero gap*) antara Organisasi, Paket Langganan, dan Lisensi Kriptografis
 * sah bertanda tangan digital HMAC-SHA256 pada seluruh lingkungan (Local, Staging, Produksi).
 */
@Component
@Order(50)
@RequiredArgsConstructor
@Slf4j
public class TenantLicenseSeeder implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final TenantLicenseRepository tenantLicenseRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final LicenseCryptoService licenseCryptoService;
    private final BillingInvoiceRepository billingInvoiceRepository;
    private final ProjectQuotaService projectQuotaService;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🛡️ Starting Tenant License & Billing Reconciliation Seeder...");

        OrganizationContext.setFilterBypassed(true);
        if (entityManager != null) {
            try {
                Session session = entityManager.unwrap(Session.class);
                if (session != null && session.getEnabledFilter("organizationFilter") != null) {
                    session.disableFilter("organizationFilter");
                }
            } catch (Exception ignored) {}
        }

        try {
            List<Organization> organizations = organizationRepository.findAll();
            LocalDateTime now = LocalDateTime.now();

            for (Organization org : organizations) {
                // Periksa apakah organisasi sudah memiliki lisensi
                List<TenantLicense> existing = tenantLicenseRepository.findByOrganizationIdOrderByCreatedAtDesc(org.getId());
                if (!existing.isEmpty()) {
                    log.debug("Organization '{}' already has {} licenses. Skipping backfill.", org.getSlug(), existing.size());
                    continue;
                }

                String slug = org.getSlug();
                SubscriptionPlan plan = org.getSubscriptionPlan();
                if (plan == null) {
                    plan = subscriptionPlanRepository.findByName("default".equals(slug) ? "ENTERPRISE" : "FREE")
                            .orElse(null);
                }

                String planName = plan != null ? plan.getName().toUpperCase(Locale.ROOT) : "FREE";
                TenantLicense.TenantLicenseBuilder builder = TenantLicense.builder()
                        .organization(org)
                        .subscriptionPlan(plan)
                        .activationType("ONLINE")
                        .validFrom(now);

                String licenseKey;
                String signature;
                LocalDateTime validUntil;
                LicenseStatus status;
                String notes;

                if ("default".equals(slug)) {
                    // 1. Main Organization -> Enterprise Tier 24 Bulan
                    validUntil = now.plusMonths(24);
                    status = LicenseStatus.ACTIVE;
                    licenseKey = licenseCryptoService.generateLicenseKey("ENTERPRISE");
                    signature = licenseCryptoService.signLicenseMetadata(org.getId(), "ENTERPRISE", licenseKey, now, validUntil, null);
                    notes = "Official 24-Month Enterprise Platform Core License";

                    builder.overrideMaxProjects(25)
                            .overrideMaxOdps(12000)
                            .overrideMaxStorageGb(500)
                            .featureSsoEnabled(true)
                            .featureApiEnabled(true)
                            .featureAiCopilotEnabled(true)
                            .featureCustomDomainEnabled(true);
                } else if ("nccxxdmpnorttafohcei".equals(slug) || "STARTER".equals(planName)) {
                    // 2. PT UJI COBA -> Starter ISP Tier 12 Bulan
                    validUntil = now.plusMonths(12);
                    status = LicenseStatus.ACTIVE;
                    licenseKey = licenseCryptoService.generateLicenseKey("STARTER");
                    signature = licenseCryptoService.signLicenseMetadata(org.getId(), "STARTER", licenseKey, now, validUntil, null);
                    notes = "Official 12-Month Starter B2B Contract License";

                    builder.overrideMaxProjects(2)
                            .overrideMaxOdps(300)
                            .overrideMaxStorageGb(15)
                            .featureSsoEnabled(false)
                            .featureApiEnabled(false);
                } else if ("hrwdjkorvtwmakjkdfxd".equals(slug) || org.getStatus() == Organization.OrganizationStatus.TRIAL_EXPIRED) {
                    // 3. PT KIRCON BANDUNG -> Free Trial Expired (Restricted Read-Only)
                    validUntil = now.minusDays(5);
                    status = LicenseStatus.RESTRICTED_READ_ONLY;
                    licenseKey = licenseCryptoService.generateLicenseKey("FREE");
                    signature = licenseCryptoService.signLicenseMetadata(org.getId(), "FREE", licenseKey, now.minusDays(19), validUntil, null);
                    notes = "Expired 14-Day Free Trial License (Restricted Read-Only Mode)";
                    builder.validFrom(now.minusDays(19));
                } else {
                    // 4. PT ABC -> Free Trial Aktif (14 Hari s/d 28 Okt 2026)
                    validUntil = now.plusDays(14);
                    status = LicenseStatus.ACTIVE;
                    licenseKey = licenseCryptoService.generateLicenseKey("FREE");
                    signature = licenseCryptoService.signLicenseMetadata(org.getId(), "FREE", licenseKey, now, validUntil, null);
                    notes = "14-Day Free Trial Online License";
                }

                TenantLicense license = builder
                        .licenseKey(licenseKey)
                        .licenseSignature(signature)
                        .status(status)
                        .validUntil(validUntil)
                        .issuedBy("SYSTEM_SEEDER")
                        .notes(notes)
                        .build();

                TenantLicense savedLic = tenantLicenseRepository.save(license);
                log.info("🔑 BACKFILLED LICENSE: Created license '{}' [{}] for org '{}' (valid until {})",
                        licenseKey, status, org.getName(), validUntil);

                // Buat Welcome Billing Invoice jika belum ada
                List<BillingInvoice> existingInvoices = billingInvoiceRepository.findByOrganizationIdOrderByCreatedAtDesc(org.getId());
                if (existingInvoices.isEmpty()) {
                    boolean isFree = "FREE".equalsIgnoreCase(planName);
                    BigDecimal amount = isFree || plan == null || plan.getPrice() == null
                            ? BigDecimal.ZERO
                            : plan.getPrice().multiply(BigDecimal.valueOf("default".equals(slug) ? 24 : 12));

                    String invNumber = "INV/" + now.getYear() + "/" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
                    BillingInvoice invoice = BillingInvoice.builder()
                            .organization(org)
                            .license(savedLic)
                            .invoiceNumber(invNumber)
                            .description(isFree ? "Welcome Invoice - 14-Day Free Trial Entitlement" : "Initial Subscription Contract - " + planName)
                            .amount(amount)
                            .currency("IDR")
                            .status(InvoiceStatus.PAID)
                            .dueDate(now.plusDays(30))
                            .paidAt(now)
                            .paymentMethod(isFree ? "FREE_TRIAL" : "B2B_CONTRACT")
                            .paymentChannel("SYSTEM")
                            .build();

                    billingInvoiceRepository.save(invoice);
                    log.info("🧾 BACKFILLED INVOICE: Created invoice '{}' for org '{}' (Amount: Rp {})",
                            invNumber, org.getName(), amount);
                }

                projectQuotaService.evictQuotaCache(org.getId());
            }

            log.info("✅ Tenant License & Billing Reconciliation Seeder completed successfully.");
        } finally {
            OrganizationContext.setFilterBypassed(false);
        }
    }
}
