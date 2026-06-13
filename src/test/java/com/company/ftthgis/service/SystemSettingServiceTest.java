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
    private SystemSettingService settingService;

    @BeforeEach
    void setUp() {
        settingRepository = mock(SystemSettingRepository.class);
        keycloakAdminService = mock(KeycloakAdminService.class);
        organizationRepository = mock(OrganizationRepository.class);
        settingService = new SystemSettingService(settingRepository, keycloakAdminService, organizationRepository);
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
}
