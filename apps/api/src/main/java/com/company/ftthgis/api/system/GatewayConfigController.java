package com.company.ftthgis.api.system;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * GatewayConfigController — Secure server-side proxy for all gateway /api/v1/config operations.
 *
 * Security Contract:
 *  - Browser SPA authenticates via Keycloak JWT (validated by Kong → Spring Security).
 *  - This controller injects GATEWAY_TOKEN internally from env before calling each gateway.
 *  - GATEWAY_TOKEN is NEVER sent to or from the browser — strictly internal to the gateway mesh.
 *  - Compliant with architecture rule (frontend-architecture-summary.md §8):
 *    "GATEWAY_TOKEN hanya pernah hidup di dalam gateway mesh, tidak pernah menyentuh browser."
 *
 * Endpoints:
 *  GET  /api/v1/system/gateway-config/{gatewayKey}                — read config (censored)
 *  POST /api/v1/system/gateway-config/{gatewayKey}                — update config keys
 *
 * Valid gatewayKey values: notification, payment, map, storage, whatsapp, scheduler, export, olt, audit
 */
@RestController
@RequestMapping("/api/v1/system/gateway-config")
@Slf4j
@PreAuthorize("isAuthenticated()")
public class GatewayConfigController {

    @Value("${app.gateway.token:}")
    private String gatewayToken;

    // --- Gateway URLs (injected from environment, never exposed to browser) ---
    @Value("${app.gateway.notification-url:http://ftth-notification-gateway:5001}")
    private String notificationUrl;

    @Value("${app.gateway.payment-url:http://ftth-payment-gateway:5002}")
    private String paymentUrl;

    @Value("${app.gateway.map-url:http://ftth-map-gateway:5003}")
    private String mapUrl;

    @Value("${app.gateway.storage-url:http://ftth-storage-gateway:5004}")
    private String storageUrl;

    @Value("${app.gateway.whatsapp-url:http://ftth-whatsapp-gateway:5005}")
    private String whatsappUrl;

    @Value("${app.gateway.scheduler-url:http://ftth-scheduler-gateway:5006}")
    private String schedulerUrl;

    @Value("${app.gateway.export-url:http://ftth-export-gateway:5007}")
    private String exportUrl;

    @Value("${app.gateway.olt-url:http://ftth-olt-gateway:5008}")
    private String oltUrl;

    @Value("${app.gateway.audit-url:http://ftth-audit-gateway:5009}")
    private String auditUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Maps a public-facing gateway key to its internal Docker service URL.
     * Keys must match what the frontend sends (e.g. "notification", "payment", etc.)
     */
    private String resolveGatewayUrl(String gatewayKey) {
        return switch (gatewayKey.toLowerCase()) {
            case "notification" -> notificationUrl;
            case "payment"      -> paymentUrl;
            case "map"          -> mapUrl;
            case "storage"      -> storageUrl;
            case "whatsapp"     -> whatsappUrl;
            case "scheduler"    -> schedulerUrl;
            case "export"       -> exportUrl;
            case "olt"          -> oltUrl;
            case "audit"        -> auditUrl;
            default             -> null;
        };
    }

    /**
     * GET /api/v1/system/gateway-config/{gatewayKey}
     * Fetches the (censored) .env config from the specified gateway.
     */
    @GetMapping("/{gatewayKey}")
    public ResponseEntity<?> getConfig(@PathVariable String gatewayKey) {
        String baseUrl = resolveGatewayUrl(gatewayKey);
        if (baseUrl == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Unknown gateway key: " + gatewayKey));
        }

        String url = baseUrl + "/api/v1/config";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Gateway-Token", gatewayToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return ResponseEntity.ok(response.getBody());
            }
            log.warn("GatewayConfig GET [{}]: upstream returned {}", gatewayKey, response.getStatusCode());
            return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", "Gateway returned non-2xx response"));
        } catch (ResourceAccessException e) {
            log.error("GatewayConfig GET [{}]: connection failed — {}", gatewayKey, e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Gateway unreachable: " + gatewayKey));
        } catch (Exception e) {
            log.error("GatewayConfig GET [{}]: unexpected error — {}", gatewayKey, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal error fetching gateway config"));
        }
    }

    /**
     * POST /api/v1/system/gateway-config/{gatewayKey}
     * Updates config keys in the specified gateway's .env file.
     * Body: { "updates": { "KEY": "value", ... } }
     */
    @PostMapping("/{gatewayKey}")
    public ResponseEntity<?> updateConfig(
            @PathVariable String gatewayKey,
            @RequestBody Map<String, Object> body
    ) {
        String baseUrl = resolveGatewayUrl(gatewayKey);
        if (baseUrl == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Unknown gateway key: " + gatewayKey));
        }

        // Validate that the request body has an "updates" map
        if (!body.containsKey("updates") || !(body.get("updates") instanceof Map)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Request body must contain an 'updates' object"));
        }

        String url = baseUrl + "/api/v1/config";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Gateway-Token", gatewayToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return ResponseEntity.ok(response.getBody());
            }
            log.warn("GatewayConfig POST [{}]: upstream returned {}", gatewayKey, response.getStatusCode());
            return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("error", "Gateway returned non-2xx response"));
        } catch (ResourceAccessException e) {
            log.error("GatewayConfig POST [{}]: connection failed — {}", gatewayKey, e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Gateway unreachable: " + gatewayKey));
        } catch (Exception e) {
            log.error("GatewayConfig POST [{}]: unexpected error — {}", gatewayKey, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal error updating gateway config"));
        }
    }
}
