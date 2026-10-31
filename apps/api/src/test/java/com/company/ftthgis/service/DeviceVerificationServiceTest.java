package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.entity.UserDevice;
import com.company.ftthgis.domain.user.repository.UserDeviceRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class DeviceVerificationServiceTest {

    private UserDeviceRepository userDeviceRepository;
    private UserRepository userRepository;
    private WhatsAppService whatsAppService;
    private SystemSettingService settingsService;
    private EmailService emailService;

    private DeviceVerificationService service;

    private UUID userId;
    private User testUser;

    @BeforeEach
    void setUp() {
        userDeviceRepository = mock(UserDeviceRepository.class);
        userRepository = mock(UserRepository.class);
        whatsAppService = mock(WhatsAppService.class);
        settingsService = mock(SystemSettingService.class);
        emailService = mock(EmailService.class);

        service = new DeviceVerificationService(
                userDeviceRepository,
                userRepository,
                whatsAppService,
                settingsService,
                emailService
        );

        userId = UUID.randomUUID();
        testUser = User.builder()
                .id(userId)
                .username("engineer")
                .fullName("Fiber Engineer")
                .email("engineer@k2net.id")
                .phone("+628123456789")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    }

    @Test
    @DisplayName("D1: isDeviceVerified should return true if device is verified")
    void testIsDeviceVerified_True() {
        UserDevice device = UserDevice.builder()
                .deviceFingerprint("fp-trusted-1")
                .verified(true)
                .build();
        when(userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, "fp-trusted-1")).thenReturn(Optional.of(device));

        assertTrue(service.isDeviceVerified(userId, "fp-trusted-1"));
    }

    @Test
    @DisplayName("D2: isDeviceVerified should return false if device not found or unverified")
    void testIsDeviceVerified_False() {
        when(userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, "fp-unknown")).thenReturn(Optional.empty());
        assertFalse(service.isDeviceVerified(userId, "fp-unknown"));
        assertFalse(service.isDeviceVerified(userId, ""));
        assertFalse(service.isDeviceVerified(userId, null));
    }

    @Test
    @DisplayName("D3: recordDeviceActivity for existing device updates timestamps and does NOT send alert")
    void testRecordDeviceActivity_ExistingDevice_UpdatesOnly() {
        UserDevice existing = UserDevice.builder()
                .id(10L)
                .user(testUser)
                .deviceFingerprint("fp-laptop-1")
                .browser("Chrome 129")
                .os("Windows 11")
                .ipAddress("10.0.0.1")
                .verified(true)
                .lastUsedAt(LocalDateTime.now().minusDays(2))
                .build();

        when(userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, "fp-laptop-1")).thenReturn(Optional.of(existing));

        boolean result = service.recordDeviceActivity(userId, "fp-laptop-1", "Chrome 130", "Windows 11", "10.0.0.2");
        assertTrue(result);

        verify(userDeviceRepository, times(1)).save(existing);
        assertEquals("Chrome 130", existing.getBrowser());
        assertEquals("10.0.0.2", existing.getIpAddress());
        verify(emailService, never()).sendEmail(any(), any(), any());
        verify(whatsAppService, never()).sendMessage(any(), any());
    }

    @Test
    @DisplayName("D4: recordDeviceActivity for newly encountered device saves new UserDevice and dispatches Security Alert")
    void testRecordDeviceActivity_NewDevice_DispatchesSecurityAlert() {
        when(userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, "fp-new-phone")).thenReturn(Optional.empty());
        when(settingsService.getSettingBoolean("wa_gateway_enabled", false)).thenReturn(true);

        boolean result = service.recordDeviceActivity(userId, "fp-new-phone", "Safari Mobile", "iOS 18", "103.20.10.5");
        assertTrue(result);

        ArgumentCaptor<UserDevice> captor = ArgumentCaptor.forClass(UserDevice.class);
        verify(userDeviceRepository, times(1)).save(captor.capture());
        UserDevice saved = captor.getValue();
        assertEquals("fp-new-phone", saved.getDeviceFingerprint());
        assertEquals("Safari Mobile", saved.getBrowser());
        assertEquals("iOS 18", saved.getOs());
        assertEquals("103.20.10.5", saved.getIpAddress());
        assertTrue(saved.isVerified());

        // Verify security alert email dispatched
        verify(emailService, times(1)).sendEmail(
                eq("engineer@k2net.id"),
                contains("Peringatan Keamanan K2NET"),
                contains("Safari Mobile")
        );

        // Verify security alert WhatsApp dispatched
        verify(whatsAppService, times(1)).sendMessage(
                eq("+628123456789"),
                contains("Peringatan Keamanan K2NET")
        );
    }

    @Test
    @DisplayName("D5: trustDeviceDirectly delegates to recordDeviceActivity")
    void testTrustDeviceDirectly() {
        when(userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, "fp-direct")).thenReturn(Optional.empty());
        boolean result = service.trustDeviceDirectly(userId, "fp-direct", "Firefox", "Linux", "127.0.0.1");
        assertTrue(result);
        verify(userDeviceRepository, times(1)).save(any(UserDevice.class));
    }

    @Test
    @DisplayName("D6: Legacy deprecated OTP methods return false safely")
    void testDeprecatedOtpMethods() {
        assertFalse(service.requestOtp(userId, "fp-1", "+628123"));
        assertFalse(service.verifyOtp(userId, "fp-1", "123456", "Chrome", "Linux", "127.0.0.1"));
    }
}
