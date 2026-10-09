package com.company.ftthgis.config.tenant;

import com.company.ftthgis.api.exception.LicenseReadOnlyException;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LicenseEnforcementAspectTest {

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @Mock
    private JoinPoint joinPoint;

    @InjectMocks
    private LicenseEnforcementAspect aspect;

    private UUID testOrgId;

    @BeforeEach
    void setUp() {
        testOrgId = UUID.randomUUID();
        OrganizationContext.setOrganizationId(testOrgId);
    }

    @AfterEach
    void tearDown() {
        OrganizationContext.clear();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    @DisplayName("GET request should always be permitted even if tenant license is RESTRICTED_READ_ONLY")
    void testSafeMethodGetIsAllowedEvenIfReadOnly() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/network/nodes");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        assertDoesNotThrow(() -> aspect.enforceLicenseReadOnlyGuard(joinPoint));
        verifyNoInteractions(tenantLicenseRepository);
    }

    @Test
    @DisplayName("POST mutation on network assets must throw LicenseReadOnlyException when license is RESTRICTED_READ_ONLY")
    void testMutatingPostBlockedWhenReadOnly() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/network/nodes");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        TenantLicense readOnlyLicense = TenantLicense.builder()
                .status(LicenseStatus.RESTRICTED_READ_ONLY)
                .build();

        when(tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(testOrgId))
                .thenReturn(Optional.of(readOnlyLicense));

        LicenseReadOnlyException ex = assertThrows(LicenseReadOnlyException.class, () ->
                aspect.enforceLicenseReadOnlyGuard(joinPoint)
        );

        assertEquals("LICENSE_READ_ONLY", ex.getErrorCode());
        assertEquals("RESTRICTED_READ_ONLY", ex.getReason());
    }

    @Test
    @DisplayName("POST request to payment endpoints must be allowed even if license is RESTRICTED_READ_ONLY")
    void testPaymentEndpointAllowedEvenIfReadOnly() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/payments/subscribe");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        assertDoesNotThrow(() -> aspect.enforceLicenseReadOnlyGuard(joinPoint));
        verifyNoInteractions(tenantLicenseRepository);
    }

    @Test
    @DisplayName("POST mutation must succeed when tenant license is ACTIVE")
    void testMutatingPostAllowedWhenLicenseActive() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/network/cables");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        TenantLicense activeLicense = TenantLicense.builder()
                .status(LicenseStatus.ACTIVE)
                .build();

        when(tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(testOrgId))
                .thenReturn(Optional.of(activeLicense));

        assertDoesNotThrow(() -> aspect.enforceLicenseReadOnlyGuard(joinPoint));
    }

    @Test
    @DisplayName("POST mutation must be blocked when tenant license is SUSPENDED")
    void testSuspendedLicenseBlocksMutation() {
        MockHttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/v1/network/nodes/123");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        TenantLicense suspendedLicense = TenantLicense.builder()
                .status(LicenseStatus.SUSPENDED)
                .build();

        when(tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(testOrgId))
                .thenReturn(Optional.of(suspendedLicense));

        LicenseReadOnlyException ex = assertThrows(LicenseReadOnlyException.class, () ->
                aspect.enforceLicenseReadOnlyGuard(joinPoint)
        );

        assertEquals("SUSPENDED", ex.getReason());
    }
}
