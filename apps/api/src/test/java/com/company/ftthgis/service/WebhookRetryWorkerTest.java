package com.company.ftthgis.service;

import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookLog;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookLogRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebhookRetryWorkerTest {

    @Mock
    private TenantWebhookLogRepository logRepository;

    @Mock
    private WebhookSecurityValidator securityValidator;

    private SecretEncryptionUtil encryptionUtil;
    private WebhookRetryWorker retryWorker;

    @BeforeEach
    void setUp() {
        encryptionUtil = new SecretEncryptionUtil("test-encryption-secret-key-32-chars!");
        retryWorker = new WebhookRetryWorker(logRepository, securityValidator, encryptionUtil);
    }

    @Test
    @DisplayName("Should mark delivery as FAILED_DLQ if SSRF validation fails during retry")
    void testSsrfBlockedDuringRetry() {
        TenantWebhookLog item = TenantWebhookLog.builder()
                .id(UUID.randomUUID())
                .organization(Organization.builder().id(UUID.randomUUID()).slug("garut").build())
                .eventName("cable.fiber_cut")
                .targetUrl("https://localhost/internal")
                .deliveryStatus("RETRYING")
                .retryCount(1)
                .maxRetries(4)
                .build();

        doThrow(new IllegalArgumentException("SSRF Blocked")).when(securityValidator).validateUrl("https://localhost/internal");

        retryWorker.retrySingleDelivery(item);

        ArgumentCaptor<TenantWebhookLog> captor = ArgumentCaptor.forClass(TenantWebhookLog.class);
        verify(logRepository).save(captor.capture());
        TenantWebhookLog saved = captor.getValue();

        assertEquals("FAILED_DLQ", saved.getDeliveryStatus());
        assertTrue(saved.getErrorMessage().contains("SSRF Policy Violation"));
        assertNull(saved.getNextRetryAt());
    }
}
