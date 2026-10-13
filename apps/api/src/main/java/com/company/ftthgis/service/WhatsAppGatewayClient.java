package com.company.ftthgis.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * <h1>WhatsAppGatewayClient</h1>
 * Internal HTTP client for dispatching WhatsApp single and blast messages
 * to the Go-based ftth-whatsapp-gateway microservice (Port 5005).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppGatewayClient {

    private final RestTemplate restTemplate;

    @Value("${app.gateway.whatsapp-url:http://ftth-whatsapp-gateway:5005}")
    private String whatsappUrl;

    @Value("${app.gateway.token:}")
    private String gatewayToken;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlastMessageItem {
        private String phone;
        private String message;
        private String templateName;
        private String language;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlastResponse {
        private boolean success;
        private BlastResponseData data;
        private Map<String, Object> error;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlastResponseData {
        private String status;
        private int count;
    }

    /**
     * Dispatch mass WhatsApp outage notifications to ftth-whatsapp-gateway.
     * Messages are queued into Redis and dispatched asynchronously by the gateway worker.
     *
     * @param tenantSlug The unique slug realm of the tenant (e.g. mjrbxnoozcbjahhahqna)
     * @param messages List of formatted blast messages
     * @return Optional containing BlastResponseData if queued, empty otherwise
     */
    public Optional<BlastResponseData> sendBlast(String tenantSlug, List<BlastMessageItem> messages) {
        if (messages == null || messages.isEmpty()) {
            return Optional.empty();
        }

        String targetUrl = whatsappUrl + "/api/v1/wa/send/blast";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (gatewayToken != null && !gatewayToken.isBlank()) {
                headers.set("X-Gateway-Token", gatewayToken);
            }
            if (tenantSlug != null && !tenantSlug.isBlank()) {
                headers.set("X-Tenant-ID", tenantSlug);
            }
            headers.set("X-Idempotency-Key", UUID.randomUUID().toString());

            Map<String, Object> body = new HashMap<>();
            body.put("tenantSlug", tenantSlug);
            body.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            log.info("🚀 [WHATSAPP-GATEWAY] Sending blast request to {} for tenant: {} (count: {})",
                    targetUrl, tenantSlug, messages.size());

            ResponseEntity<BlastResponse> response = restTemplate.exchange(
                    targetUrl,
                    HttpMethod.POST,
                    entity,
                    BlastResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().isSuccess()) {
                BlastResponseData data = response.getBody().getData();
                log.info("✅ [WHATSAPP-GATEWAY] Blast successfully queued! Status: {}, Count: {}",
                        data != null ? data.getStatus() : "OK",
                        data != null ? data.getCount() : messages.size());
                return Optional.ofNullable(data);
            } else {
                log.warn("⚠️ [WHATSAPP-GATEWAY] Blast responded with status: {}", response.getStatusCode());
                return Optional.empty();
            }
        } catch (Exception e) {
            log.error("❌ [WHATSAPP-GATEWAY] Exception connecting to {}: {}", targetUrl, e.getMessage());
            return Optional.empty();
        }
    }
}
