package com.company.ftthgis.api.system;

import com.company.ftthgis.service.system.KeycloakObservabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Keycloak IAM Observability.
 * Acts as a Thin Delegator (<50 lines) dispatching requests to KeycloakObservabilityService.
 */
@RestController
@RequestMapping("/api/v1/system/keycloak")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('system.observability.view')")
public class KeycloakObservabilityController {

    private final KeycloakObservabilityService keycloakObservabilityService;

    @GetMapping("/events")
    public ResponseEntity<List<Map<String, Object>>> getKeycloakEvents() {
        return ResponseEntity.ok(keycloakObservabilityService.getKeycloakEvents());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getKeycloakStats() {
        return ResponseEntity.ok(keycloakObservabilityService.getKeycloakStats());
    }
}
