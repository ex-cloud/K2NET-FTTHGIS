package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.LicenseNotificationLogDto;
import com.company.ftthgis.api.tenant.dto.BillingContactsDto;
import com.company.ftthgis.domain.tenant.entity.LicenseNotificationLog;
import com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.LicenseNotificationLogRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LicenseNotificationServiceTest {

    @Mock
    private EmailService emailService;

    @Mock
    private WhatsAppService whatsAppService;

    @Mock
    private LicenseNotificationLogRepository logRepository;

    @Mock
    private TenantLicenseRepository licenseRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private LicenseNotificationService notificationService;

    private Organization testOrg;
    private TenantLicense testLicense;
    private final UUID orgId = UUID.randomUUID();
    private final UUID licenseId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        testOrg = Organization.builder()
                .id(orgId)
                .name("Fiber Indo Nusantara")
                .slug("fiber-indo")
                .subscriptionPlan(SubscriptionPlan.builder().name("ENTERPRISE").build())
                .build();

        testLicense = TenantLicense.builder()
                .id(licenseId)
                .organization(testOrg)
                .licenseKey("K2NET-ENT-12345678-ABCD")
                .validUntil(LocalDateTime.now().plusDays(5))
                .billingContactEmail("billing@fiberindo.id")
                .billingContactPhone("+6281234567890")
                .notifyEmailEnabled(true)
                .notifyWhatsappEnabled(true)
                .lastNotifiedStage(LicenseNotificationStage.NONE)
                .build();
    }

    @Test
    @DisplayName("dispatchLicenseReminder: Mengirim email dan WhatsApp serta mencatat log audit")
    void testDispatchLicenseReminder_Success() {
        when(emailService.sendEmail(anyString(), anyString(), anyString())).thenReturn(true);
        when(whatsAppService.sendMessage(anyString(), anyString())).thenReturn(true);

        notificationService.dispatchLicenseReminder(testLicense, LicenseNotificationStage.EXPIRING_7D, "JANITOR_JOB");

        verify(emailService).sendEmail(eq("billing@fiberindo.id"), contains("Pengingat H-7"), anyString());
        verify(whatsAppService).sendMessage(eq("+6281234567890"), contains("PENGINGAT H-7"));
        verify(logRepository, times(2)).save(any(LicenseNotificationLog.class));
        verify(licenseRepository).save(testLicense);

        assertEquals(LicenseNotificationStage.EXPIRING_7D, testLicense.getLastNotifiedStage());
        assertNotNull(testLicense.getLastNotifiedAt());
    }

    @Test
    @DisplayName("dispatchLicenseReminder: Menghormati preferensi tenant saat WhatsApp dinonaktifkan")
    void testDispatchLicenseReminder_HonorDisabledPreferences() {
        testLicense.setNotifyWhatsappEnabled(false);
        when(emailService.sendEmail(anyString(), anyString(), anyString())).thenReturn(true);

        notificationService.dispatchLicenseReminder(testLicense, LicenseNotificationStage.GRACE_PERIOD, "JANITOR_JOB");

        verify(emailService).sendEmail(eq("billing@fiberindo.id"), contains("Masa Tenggang"), anyString());
        verify(whatsAppService, never()).sendMessage(anyString(), anyString());
        verify(logRepository, times(1)).save(any(LicenseNotificationLog.class));
    }

    @Test
    @DisplayName("getBillingContacts: Mengembalikan kontak penagihan dari lisensi aktif")
    void testGetBillingContacts_Success() {
        when(licenseRepository.findFirstByOrganizationIdAndStatusInOrderByCreatedAtDesc(eq(orgId), anyList()))
                .thenReturn(Optional.of(testLicense));

        BillingContactsDto contacts = notificationService.getBillingContacts(orgId);

        assertNotNull(contacts);
        assertEquals("billing@fiberindo.id", contacts.getBillingContactEmail());
        assertEquals("+6281234567890", contacts.getBillingContactPhone());
        assertTrue(contacts.getNotifyEmailEnabled());
        assertTrue(contacts.getNotifyWhatsappEnabled());
    }

    @Test
    @DisplayName("updateBillingContacts: Sukses memperbarui data kontak dan preferensi")
    void testUpdateBillingContacts_Success() {
        when(licenseRepository.findFirstByOrganizationIdAndStatusInOrderByCreatedAtDesc(eq(orgId), anyList()))
                .thenReturn(Optional.of(testLicense));

        BillingContactsDto updateRequest = BillingContactsDto.builder()
                .billingContactName("Budi Santoso")
                .billingContactEmail("budi@fiberindo.id")
                .billingContactPhone("+628999888777")
                .notifyEmailEnabled(true)
                .notifyWhatsappEnabled(false)
                .build();

        BillingContactsDto result = notificationService.updateBillingContacts(orgId, updateRequest);

        verify(licenseRepository).save(testLicense);
        assertEquals("budi@fiberindo.id", testLicense.getBillingContactEmail());
        assertEquals("+628999888777", testLicense.getBillingContactPhone());
        assertEquals("Budi Santoso", testLicense.getBillingContactName());
        assertFalse(testLicense.isNotifyWhatsappEnabled());
    }

    @Test
    @DisplayName("getNotificationLogs: Mengambil riwayat log berurutan descending")
    void testGetNotificationLogs_Success() {
        LicenseNotificationLog logItem = LicenseNotificationLog.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .license(testLicense)
                .channel("EMAIL")
                .stage(LicenseNotificationStage.EXPIRING_7D)
                .recipient("billing@fiberindo.id")
                .status("SENT")
                .sentAt(LocalDateTime.now())
                .build();

        when(logRepository.findByOrganizationIdAndLicenseIdOrderBySentAtDesc(orgId, licenseId))
                .thenReturn(List.of(logItem));

        List<LicenseNotificationLogDto> logs = notificationService.getNotificationLogs(orgId, licenseId);

        assertNotNull(logs);
        assertEquals(1, logs.size());
        assertEquals("EMAIL", logs.get(0).getChannel());
        assertEquals(LicenseNotificationStage.EXPIRING_7D, logs.get(0).getStage());
    }
}
