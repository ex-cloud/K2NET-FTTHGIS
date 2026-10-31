package com.company.ftthgis.service;

import com.company.ftthgis.domain.common.SystemSetting;
import com.company.ftthgis.domain.common.repository.SystemSettingRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class SystemSettingServiceTest {

    private SystemSettingRepository settingRepository;
    private KeycloakAdminService keycloakAdminService;
    private OrganizationRepository organizationRepository;
    private com.company.ftthgis.util.SecretEncryptionUtil encryptionUtil;
    private SystemSettingService settingService;

    @BeforeEach
    void setUp() {
        settingRepository = mock(SystemSettingRepository.class);
        keycloakAdminService = mock(KeycloakAdminService.class);
        organizationRepository = mock(OrganizationRepository.class);
        encryptionUtil = new com.company.ftthgis.util.SecretEncryptionUtil("test-encryption-secret-key-32-chars!");
        settingService = new SystemSettingService(settingRepository, keycloakAdminService, organizationRepository, encryptionUtil, new com.fasterxml.jackson.databind.ObjectMapper());
    }

    @Test
    void testInitDefaultSettings_SeedsPasswordPolicies() {
        when(settingRepository.existsById(anyString())).thenReturn(false);

        settingService.initDefaultSettings();

        // Capture calls to save to verify settings are seeded
        ArgumentCaptor<SystemSetting> captor = ArgumentCaptor.forClass(SystemSetting.class);
        verify(settingRepository, atLeastOnce()).save(captor.capture());

        boolean hasMinLength = false;
        boolean hasRequireUppercase = false;
        for (SystemSetting setting : captor.getAllValues()) {
            if ("password_min_length".equals(setting.getKey())) {
                hasMinLength = true;
                assertEquals("8", setting.getValue());
                assertEquals("SECURITY", setting.getCategory());
            }
            if ("password_require_uppercase".equals(setting.getKey())) {
                hasRequireUppercase = true;
                assertEquals("true", setting.getValue());
            }
        }

        assertTrue(hasMinLength, "Should seed password_min_length");
        assertTrue(hasRequireUppercase, "Should seed password_require_uppercase");
    }

    @Test
    void testUpdateSettings_TriggersSync() {
        SystemSetting existingSetting = SystemSetting.builder()
                .key("password_min_length")
                .value("8")
                .category("SECURITY")
                .build();
        when(settingRepository.findById("password_min_length")).thenReturn(Optional.of(existingSetting));
        when(settingRepository.findById("password_require_uppercase")).thenReturn(Optional.empty());

        Map<String, String> updates = new HashMap<>();
        updates.put("password_min_length", "10");
        updates.put("password_require_uppercase", "false");

        settingService.updateSettings(updates);

        // Verify save was called
        verify(settingRepository, times(2)).save(any(SystemSetting.class));
        
        // Verify Keycloak sync is triggered
        verify(keycloakAdminService, atLeastOnce()).syncPasswordPolicyToRealm(eq("ftth-realm"), anyString());
    }

    @Test
    void testGetAllSettings_MasksSensitiveKeys() {
        String encryptedPass = encryptionUtil.encrypt("super-secret-brevo-key");
        SystemSetting secretSetting = SystemSetting.builder()
                .key("smtp_password")
                .value(encryptedPass)
                .category("SMTP")
                .build();
        SystemSetting normalSetting = SystemSetting.builder()
                .key("app_name")
                .value("FTTH GIS")
                .category("BRANDING")
                .build();

        when(settingRepository.findAll()).thenReturn(java.util.List.of(secretSetting, normalSetting));

        java.util.List<SystemSetting> all = settingService.getAllSettings();
        assertEquals(2, all.size());

        SystemSetting masked = all.stream().filter(s -> "smtp_password".equals(s.getKey())).findFirst().orElseThrow();
        assertEquals("********", masked.getValue(), "Sensitive settings must be masked with ********");

        SystemSetting plain = all.stream().filter(s -> "app_name".equals(s.getKey())).findFirst().orElseThrow();
        assertEquals("FTTH GIS", plain.getValue());
    }

    @Test
    void testUpdateSettings_EncryptsSensitiveAndPreservesMasked() {
        String originalEncrypted = encryptionUtil.encrypt("original-real-password");
        SystemSetting existing = SystemSetting.builder()
                .key("smtp_password")
                .value(originalEncrypted)
                .category("SMTP")
                .build();
        when(settingRepository.findById("smtp_password")).thenReturn(Optional.of(existing));

        // 1. Submit mask placeholder "********" -> must not overwrite
        Map<String, String> updatesWithMask = new HashMap<>();
        updatesWithMask.put("smtp_password", "********");
        settingService.updateSettings(updatesWithMask);

        // Verify save was not called with mask
        verify(settingRepository, never()).save(argThat(s -> "********".equals(s.getValue())));

        // 2. Submit new real password -> must encrypt before saving
        Map<String, String> updatesNewPass = new HashMap<>();
        updatesNewPass.put("smtp_password", "my-new-brevo-key");
        settingService.updateSettings(updatesNewPass);

        ArgumentCaptor<SystemSetting> captor = ArgumentCaptor.forClass(SystemSetting.class);
        verify(settingRepository).save(captor.capture());
        assertNotEquals("my-new-brevo-key", captor.getValue().getValue(), "Must not save plaintext password");
        assertEquals("my-new-brevo-key", encryptionUtil.decrypt(captor.getValue().getValue()), "Saved ciphertext must decrypt to plaintext");
    }

    @Test
    void testGetSettingValue_DecryptsSensitiveKey() {
        String cipher = encryptionUtil.encrypt("decrypted-plain-password");
        SystemSetting setting = SystemSetting.builder()
                .key("smtp_password")
                .value(cipher)
                .category("SMTP")
                .build();
        when(settingRepository.findById("smtp_password")).thenReturn(Optional.of(setting));

        String resolved = settingService.getSettingValue("smtp_password", "default");
        assertEquals("decrypted-plain-password", resolved, "Must transparently decrypt sensitive settings");
    }

    @Test
    void testUpdateSettings_SmtpSyncsToKeycloak() {
        Map<String, String> updates = new HashMap<>();
        updates.put("smtp_host", "mail.kdua.net");
        updates.put("smtp_port", "587");
        updates.put("smtp_username", "notify@kdua.net");

        settingService.updateSettings(updates);

        // Verify KeycloakAdminService was called to sync SMTP settings to realms
        verify(keycloakAdminService).syncSmtpServerToRealm(eq("ftth-realm"), anyMap());
        verify(keycloakAdminService).syncSmtpServerToRealm(eq("k2net-tenants"), anyMap());
    }
}
