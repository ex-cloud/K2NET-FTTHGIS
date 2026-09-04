package com.company.ftthgis.api.system;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * GatewayStatusController — Server-side proxy for gateway health checks.
 *
 * Security Contract:
 *  - Browser SPA authenticates via Keycloak JWT (verified by Kong → Spring Security).
 *  - This controller calls notification-gateway internally using GATEWAY_TOKEN from env.
 *  - The GATEWAY_TOKEN is NEVER sent to or from the browser. It lives only server-side.
 *  - Compliant with architecture rule: "GATEWAY_TOKEN hanya pernah hidup di dalam
 *    gateway mesh, tidak pernah menyentuh browser di frontend manapun."
 */
@RestController
@RequestMapping("/api/v1/system/gateway-status")
@Slf4j
@PreAuthorize("hasAuthority('system.observability.view')")
public class GatewayStatusController {

    @Value("${app.gateway.token:}")
    private String gatewayToken;

    @Value("${app.gateway.notification-url:http://ftth-notification-gateway:5001}")
    private String notificationGatewayUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Returns the status of all gateway services.
     *
     * Flow: Browser (JWT) → Kong → Spring Boot → notification-gateway (X-Gateway-Token) → TCP dial all peers
     */
    @GetMapping
    public ResponseEntity<?> getGatewayStatus() {
        String url = notificationGatewayUrl + "/api/v1/gateway-status";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Gateway-Token", gatewayToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return ResponseEntity.ok(response.getBody());
            }

            log.warn("GatewayStatus: notification-gateway returned non-2xx status: {}", response.getStatusCode());
            return ResponseEntity.status(response.getStatusCode())
                    .body(Map.of("status", "error", "message", "Gateway status check failed"));

        } catch (ResourceAccessException e) {
            log.error("GatewayStatus: Could not reach notification-gateway at {}: {}", url, e.getMessage());
            // Return degraded response so UI shows all services offline rather than crashing
            return ResponseEntity.ok(Map.of(
                    "status", "degraded",
                    "message", "notification-gateway unreachable",
                    "services", List.of()
            ));
        } catch (Exception e) {
            log.error("GatewayStatus: Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Internal error fetching gateway status"));
        }
    }
}
