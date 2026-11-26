package com.company.ftthgis.service;

import com.company.ftthgis.config.security.SSRFSafeHttpClient;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookEndpoint;
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

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebhookRetryWorkerTest {

    @Mock
    private TenantWebhookLogRepository logRepository;

    @Mock
    private WebhookSecurityValidator securityValidator;

    @Mock
    private com.company.ftthgis.config.security.SSRFSafeHttpClient ssrfSafeHttpClient;

    private SecretEncryptionUtil encryptionUtil;
    private WebhookRetryWorker retryWorker;

    @BeforeEach
    void setUp() {
        encryptionUtil = new SecretEncryptionUtil("test-encryption-secret-key-32-chars!");
        retryWorker = new WebhookRetryWorker(logRepository, securityValidator, encryptionUtil, ssrfSafeHttpClient);
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

    @Test
    @DisplayName("BUG-SIEM-03: Should attach HMAC-SHA256 signatures when retrying webhook delivery")
    void testRetryAttachesHmacSignature() {
        String rawSecret = "whsec_retry_secret_123456";
        String payload = "{\"event\":\"cable.fiber_cut\"}";
        TenantWebhookEndpoint endpoint = TenantWebhookEndpoint.builder()
                .id(UUID.randomUUID())
                .targetUrl("https://httpbin.org/post")
                .webhookSecretEncrypted(encryptionUtil.encrypt(rawSecret))
                .build();
        TenantWebhookLog item = TenantWebhookLog.builder()
                .id(UUID.randomUUID())
                .organization(Organization.builder().id(UUID.randomUUID()).slug("garut").build())
                .endpoint(endpoint)
                .eventName("cable.fiber_cut")
                .targetUrl("https://httpbin.org/post")
                .requestPayload(payload)
                .deliveryStatus("RETRYING")
                .retryCount(0)
                .maxRetries(4)
                .build();

        when(ssrfSafeHttpClient.executePost(eq("https://httpbin.org/post"), eq(payload), anyMap()))
                .thenReturn(SSRFSafeHttpClient.HttpResponse.builder()
                        .statusCode(200)
                        .body("{\"ok\":true}")
                        .latencyMs(25)
                        .success(true)
                        .build());

        retryWorker.retrySingleDelivery(item);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> headersCaptor = ArgumentCaptor.forClass(Map.class);
        verify(ssrfSafeHttpClient).executePost(eq("https://httpbin.org/post"), eq(payload), headersCaptor.capture());
        String expectedSig = encryptionUtil.computeHmacSha256(rawSecret, payload);
        assertEquals(expectedSig, headersCaptor.getValue().get("X-K2NET-Signature"));
        assertEquals(expectedSig, headersCaptor.getValue().get("X-K2NET-Signature-256"));
    }
}
