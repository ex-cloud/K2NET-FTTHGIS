package com.company.ftthgis.api.user;

import com.company.ftthgis.api.security.dto.EffectiveSecurityPolicyDto;
import com.company.ftthgis.api.system.DeviceVerificationController.TrustDevicePayload;
import com.company.ftthgis.api.system.DeviceVerificationController.UserDeviceDto;
import com.company.ftthgis.api.user.dto.PersonalSecuritySummaryDto;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.entity.UserDevice;
import com.company.ftthgis.domain.user.repository.UserDeviceRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.DeviceVerificationService;
import com.company.ftthgis.service.KeycloakAdminService;
import com.company.ftthgis.service.SecurityPolicyService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class PersonalSecurityControllerTest {

    private UserDeviceRepository userDeviceRepository;
    private DeviceVerificationService deviceVerificationService;
    private UserRepository userRepository;
    private SecurityPolicyService securityPolicyService;
    private KeycloakAdminService keycloakAdminService;

    private PersonalSecurityController controller;

    private UUID userId;
    private Jwt jwt;
    private User testUser;
    private Organization testOrg;

    @BeforeEach
    void setUp() {
        userDeviceRepository = mock(UserDeviceRepository.class);
        deviceVerificationService = mock(DeviceVerificationService.class);
        userRepository = mock(UserRepository.class);
        securityPolicyService = mock(SecurityPolicyService.class);
        keycloakAdminService = mock(KeycloakAdminService.class);

        controller = new PersonalSecurityController(
                userDeviceRepository,
                deviceVerificationService,
                userRepository,
                securityPolicyService,
                keycloakAdminService
        );

        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
        when(jwt.getClaimAsString("email")).thenReturn("operator@k2net.id");
        when(jwt.getClaimAsString("preferred_username")).thenReturn("operator");

        testOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Acme ISP")
                .slug("acme-isp")
                .build();

        testUser = User.builder()
                .id(userId)
                .username("operator")
                .email("operator@k2net.id")
                .phone("+628123456789")
                .organization(testOrg)
                .mfaEnabled(false)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    }

    @Test
    @DisplayName("P1: getDevices should return all devices belonging to caller")
    void testGetDevices() {
        UserDevice dev = UserDevice.builder()
                .id(101L)
                .user(testUser)
                .deviceFingerprint("fp-12345")
                .browser("Chrome 130")
                .os("macOS Sequoia")
                .ipAddress("103.10.20.30")
                .verified(true)
                .lastUsedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        when(userDeviceRepository.findAllByUserId(userId)).thenReturn(List.of(dev));

        ResponseEntity<List<UserDeviceDto>> response = controller.getDevices(jwt);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("fp-12345", response.getBody().get(0).deviceFingerprint());
        assertEquals("Chrome 130", response.getBody().get(0).browser());
    }

    @Test
    @DisplayName("P2: revokeDevice should delete device when caller is the owner")
    void testRevokeDevice_WhenOwner_Success() {
        UserDevice dev = UserDevice.builder()
                .id(202L)
                .user(testUser)
                .build();

        when(userDeviceRepository.findById(202L)).thenReturn(Optional.of(dev));

        ResponseEntity<?> response = controller.revokeDevice(jwt, 202L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userDeviceRepository, times(1)).delete(dev);
    }

    @Test
    @DisplayName("P3: revokeDevice should return 403 Forbidden when caller tries to revoke another user's device (Anti-IDOR)")
    void testRevokeDevice_WhenNotOwner_Forbidden() {
        User otherUser = User.builder()
                .id(UUID.randomUUID())
                .username("other_user")
                .build();

        UserDevice dev = UserDevice.builder()
                .id(303L)
                .user(otherUser)
                .build();

        when(userDeviceRepository.findById(303L)).thenReturn(Optional.of(dev));

        ResponseEntity<?> response = controller.revokeDevice(jwt, 303L);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(userDeviceRepository, never()).delete(any());
    }

    @Test
    @DisplayName("P4: trustCurrentDevice should validate payload and call service")
    void testTrustCurrentDevice_Success() {
        TrustDevicePayload payload = new TrustDevicePayload("fp-client-999", "Firefox 132", "Linux x86_64");
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("192.168.1.50");

        when(deviceVerificationService.trustDeviceDirectly(
                eq(userId), eq("fp-client-999"), eq("Firefox 132"), eq("Linux x86_64"), eq("192.168.1.50")
        )).thenReturn(true);

        ResponseEntity<?> response = controller.trustCurrentDevice(jwt, payload, request);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("P5: trustCurrentDevice with empty fingerprint should return 400 Bad Request")
    void testTrustCurrentDevice_EmptyFingerprint_BadRequest() {
        TrustDevicePayload payload = new TrustDevicePayload("", "Firefox", "Linux");
        HttpServletRequest request = mock(HttpServletRequest.class);

        ResponseEntity<?> response = controller.trustCurrentDevice(jwt, payload, request);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(deviceVerificationService, never()).trustDeviceDirectly(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("P6: getSecuritySummary should return resolved policy and live MFA status")
    void testGetSecuritySummary() {
        EffectiveSecurityPolicyDto effectivePolicy = EffectiveSecurityPolicyDto.builder()
                .organizationSlug("acme-isp")
                .mfaRequired(true)
                .effectiveSource("TENANT")
                .sessionIdleMinutes(30)
                .build();

        when(securityPolicyService.resolveEffectivePolicy("acme-isp")).thenReturn(effectivePolicy);
        when(keycloakAdminService.hasMfaConfigured("k2net-tenants", "operator@k2net.id")).thenReturn(true);
        when(userDeviceRepository.findAllByUserId(userId)).thenReturn(List.of(mock(UserDevice.class)));

        ResponseEntity<PersonalSecuritySummaryDto> response = controller.getSecuritySummary(jwt);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        PersonalSecuritySummaryDto summary = response.getBody();
        assertNotNull(summary);
        assertEquals("operator@k2net.id", summary.getEmail());
        assertTrue(summary.isMfaEnabled());
        assertTrue(summary.isMfaEnforced());
        assertEquals("TENANT", summary.getMfaEnforcementSource());
        assertEquals(1, summary.getTrustedDevicesCount());
    }
}
