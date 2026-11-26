package com.company.ftthgis.service.tenantapi;

import com.company.ftthgis.api.tenant.dto.SimulateEventRequest;
import com.company.ftthgis.config.security.SSRFSafeHttpClient;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantApiTokenRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookEndpointRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookLogRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantWebhookDispatcherServiceTest {

    @Mock private OrganizationRepository organizationRepository;
    @Mock private TenantApiTokenRepository tokenRepository;
    @Mock private TenantWebhookEndpointRepository endpointRepository;
    @Mock private TenantWebhookLogRepository logRepository;
    @Mock private WebhookSecurityValidator securityValidator;
    @Mock private SecretEncryptionUtil encryptionUtil;
    @Mock private ObjectMapper objectMapper;
    @Mock private SSRFSafeHttpClient ssrfSafeHttpClient;

    @InjectMocks
    private TenantWebhookDispatcherService dispatcherService;

    @Test
    @DisplayName("BUG-SIEM-04: Rejects cross-tenant endpoint ID during simulation (anti-IDOR)")
    void testSimulateEventDispatchBlocksCrossTenantEndpointIdor() {
        UUID orgAId = UUID.randomUUID();
        UUID foreignEndpointId = UUID.randomUUID();
        Organization orgA = Organization.builder().id(orgAId).slug("tenant-a").build();

        when(organizationRepository.findBySlug("tenant-a")).thenReturn(Optional.of(orgA));
        when(endpointRepository.findByIdAndOrganizationIdNative(orgAId, foreignEndpointId)).thenReturn(Optional.empty());

        SimulateEventRequest req = SimulateEventRequest.builder()
                .endpointId(foreignEndpointId)
                .eventType("cable.fiber_cut")
                .build();

        assertThrows(IllegalArgumentException.class, () -> dispatcherService.simulateEventDispatch("tenant-a", req));
        verify(endpointRepository, never()).findById(any());
        verify(ssrfSafeHttpClient, never()).executePost(anyString(), anyString(), anyMap());
    }
}
