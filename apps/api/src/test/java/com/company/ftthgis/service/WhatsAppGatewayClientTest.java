package com.company.ftthgis.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WhatsAppGatewayClientTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private WhatsAppGatewayClient client;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(client, "whatsappUrl", "http://ftth-whatsapp-gateway:5005");
        ReflectionTestUtils.setField(client, "gatewayToken", "test-secret-token");
    }

    @Test
    @DisplayName("sendBlast returns empty Optional if messages list is empty")
    void testSendBlast_EmptyMessages() {
        Optional<WhatsAppGatewayClient.BlastResponseData> result = client.sendBlast("tenant-1", List.of());
        assertTrue(result.isEmpty());
        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("sendBlast successfully posts to gateway and returns BlastResponseData")
    void testSendBlast_Success() {
        WhatsAppGatewayClient.BlastMessageItem msg = WhatsAppGatewayClient.BlastMessageItem.builder()
                .phone("+628123456789")
                .message("Test outage alert")
                .build();

        WhatsAppGatewayClient.BlastResponseData data = new WhatsAppGatewayClient.BlastResponseData("queued", 1);
        WhatsAppGatewayClient.BlastResponse resp = new WhatsAppGatewayClient.BlastResponse(true, data, null);

        ResponseEntity<WhatsAppGatewayClient.BlastResponse> responseEntity =
                new ResponseEntity<>(resp, HttpStatus.ACCEPTED);

        when(restTemplate.exchange(
                eq("http://ftth-whatsapp-gateway:5005/api/v1/wa/send/blast"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(WhatsAppGatewayClient.BlastResponse.class)
        )).thenReturn(responseEntity);

        Optional<WhatsAppGatewayClient.BlastResponseData> result = client.sendBlast("tenant-slug", List.of(msg));

        assertTrue(result.isPresent());
        assertEquals("queued", result.get().getStatus());
        assertEquals(1, result.get().getCount());

        ArgumentCaptor<HttpEntity<Map<String, Object>>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
                eq("http://ftth-whatsapp-gateway:5005/api/v1/wa/send/blast"),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(WhatsAppGatewayClient.BlastResponse.class)
        );

        HttpHeaders headers = entityCaptor.getValue().getHeaders();
        assertEquals("test-secret-token", headers.getFirst("X-Gateway-Token"));
        assertEquals("tenant-slug", headers.getFirst("X-Tenant-ID"));
        assertNotNull(headers.getFirst("X-Idempotency-Key"));

        Map<String, Object> body = entityCaptor.getValue().getBody();
        assertNotNull(body);
        assertEquals("tenant-slug", body.get("tenantSlug"));
        assertEquals(1, ((List<?>) body.get("messages")).size());
    }

    @Test
    @DisplayName("sendBlast handles exception gracefully and returns empty Optional")
    void testSendBlast_Exception() {
        WhatsAppGatewayClient.BlastMessageItem msg = WhatsAppGatewayClient.BlastMessageItem.builder()
                .phone("+628123456789")
                .message("Test outage alert")
                .build();

        when(restTemplate.exchange(anyString(), any(), any(), eq(WhatsAppGatewayClient.BlastResponse.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        Optional<WhatsAppGatewayClient.BlastResponseData> result = client.sendBlast("tenant-slug", List.of(msg));
        assertTrue(result.isEmpty());
    }
}
