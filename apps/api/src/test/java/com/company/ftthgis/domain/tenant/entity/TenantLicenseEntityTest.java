package com.company.ftthgis.domain.tenant.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TenantLicenseEntityTest {

    @Test
    @DisplayName("TenantLicense builder should assign default values properly")
    void testLicenseCreationAndDefaultValues() {
        LocalDateTime now = LocalDateTime.now();
        Organization org = Organization.builder().id(UUID.randomUUID()).slug("isp-test").name("ISP Test").build();
        SubscriptionPlan plan = SubscriptionPlan.builder().id(UUID.randomUUID()).name("PRO").build();

        TenantLicense license = TenantLicense.builder()
                .organization(org)
                .subscriptionPlan(plan)
                .licenseKey("K2NET-PRO-ABCD1234-EF90")
                .licenseSignature("mock-signature-digest")
                .validFrom(now)
                .validUntil(now.plusMonths(1))
                .build();

        assertNotNull(license);
        assertEquals(LicenseStatus.ACTIVE, license.getStatus());
        assertEquals("ONLINE", license.getActivationType());
        assertEquals("SYSTEM_BILLING", license.getIssuedBy());
        assertFalse(license.isFeatureSsoEnabled());
        assertFalse(license.isFeatureApiEnabled());
        assertTrue(license.isActive());
        assertFalse(license.isExpired());
        assertFalse(license.isReadOnly());
    }

    @Test
    @DisplayName("TenantLicense expiration logic should evaluate timestamps accurately")
    void testIsActiveAndIsExpiredLogic() {
        LocalDateTime now = LocalDateTime.now();
        TenantLicense expiredLicense = TenantLicense.builder()
                .licenseKey("K2NET-STARTER-12345678-ABCD")
                .licenseSignature("mock-sig")
                .status(LicenseStatus.ACTIVE)
                .validFrom(now.minusMonths(2))
                .validUntil(now.minusDays(1)) // Expired yesterday
                .build();

        assertTrue(expiredLicense.isExpired());
        assertFalse(expiredLicense.isActive(), "Expired license must not be active even if status is ACTIVE");
    }

    @Test
    @DisplayName("TenantLicense grace period should be detected correctly")
    void testGracePeriodLogic() {
        LocalDateTime now = LocalDateTime.now();
        TenantLicense graceLicense = TenantLicense.builder()
                .licenseKey("K2NET-PRO-11223344-5566")
                .licenseSignature("mock-sig")
                .status(LicenseStatus.GRACE_PERIOD)
                .validFrom(now.minusMonths(1))
                .validUntil(now.minusDays(2))
                .gracePeriodUntil(now.plusDays(5)) // 5 days remaining in grace
                .build();

        assertTrue(graceLicense.isGracePeriodActive());
        assertFalse(graceLicense.isReadOnly());

        TenantLicense elapsedGraceLicense = TenantLicense.builder()
                .licenseKey("K2NET-PRO-11223344-5567")
                .licenseSignature("mock-sig")
                .status(LicenseStatus.GRACE_PERIOD)
                .validFrom(now.minusMonths(1))
                .validUntil(now.minusDays(10))
                .gracePeriodUntil(now.minusDays(3)) // Grace period elapsed
                .build();

        assertFalse(elapsedGraceLicense.isGracePeriodActive());
    }

    @Test
    @DisplayName("TenantLicense read-only and suspended flags should evaluate accurately")
    void testReadOnlyAndSuspendedLogic() {
        TenantLicense readOnlyLicense = TenantLicense.builder()
                .licenseKey("K2NET-ENT-AABBCCDD-EEFF")
                .licenseSignature("mock-sig")
                .status(LicenseStatus.RESTRICTED_READ_ONLY)
                .build();

        assertTrue(readOnlyLicense.isReadOnly());
        assertFalse(readOnlyLicense.isSuspendedOrRevoked());

        TenantLicense suspendedLicense = TenantLicense.builder()
                .licenseKey("K2NET-ENT-AABBCCDD-0011")
                .licenseSignature("mock-sig")
                .status(LicenseStatus.SUSPENDED)
                .build();

        assertTrue(suspendedLicense.isSuspendedOrRevoked());
        assertFalse(suspendedLicense.isReadOnly());
    }

    @Test
    @DisplayName("BillingInvoice builder and overdue logic should work properly")
    void testBillingInvoiceCreationAndMethods() {
        LocalDateTime now = LocalDateTime.now();
        Organization org = Organization.builder().id(UUID.randomUUID()).slug("isp-alpha").name("ISP Alpha").build();

        BillingInvoice invoice = BillingInvoice.builder()
                .organization(org)
                .invoiceNumber("INV/2026/10/K2-0001")
                .description("Monthly Subscription Renewal - PRO Plan")
                .amount(new BigDecimal("3900000.00"))
                .currency("IDR")
                .status(InvoiceStatus.PENDING)
                .dueDate(now.minusDays(1)) // Due yesterday
                .build();

        assertEquals("IDR", invoice.getCurrency());
        assertEquals(InvoiceStatus.PENDING, invoice.getStatus());
        assertTrue(invoice.isOverdue(), "Pending invoice with past due date must report overdue");
        assertFalse(invoice.isPaid());

        // Mark as paid
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(now);
        assertTrue(invoice.isPaid());
        assertFalse(invoice.isOverdue());
    }
}
