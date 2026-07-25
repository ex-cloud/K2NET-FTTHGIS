package com.company.ftthgis.api.system;

import com.company.ftthgis.service.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.RealmRepresentation;
import org.keycloak.representations.idm.UserSessionRepresentation;
import org.keycloak.representations.idm.IdentityProviderRepresentation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.company.ftthgis.domain.user.entity.SecurityEvent;
import com.company.ftthgis.domain.user.repository.SecurityEventRepository;
import com.company.ftthgis.domain.user.entity.BlockedIp;
import com.company.ftthgis.domain.user.repository.BlockedIpRepository;
import com.company.ftthgis.config.security.IpBlockingFilter;
import com.company.ftthgis.service.GeoIpService;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/system/security")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class SecurityController {

    private final KeycloakAdminService keycloakAdminService;
    private final SecurityEventRepository securityEventRepository;
    private final GeoIpService geoIpService;
    private final BlockedIpRepository blockedIpRepository;
    private final IpBlockingFilter ipBlockingFilter;

    // --- Realm Config Endpoints ---

    @GetMapping("/realm-config")
    public ResponseEntity<RealmConfigDto> getRealmConfig() {
        try {
            RealmRepresentation realm = keycloakAdminService.getRealmConfig();
            RealmConfigDto dto = new RealmConfigDto(
                    realm.isRegistrationAllowed(),
                    realm.isVerifyEmail(),
                    realm.isResetPasswordAllowed()
            );
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Failed to fetch Realm configuration: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/realm-config")
    public ResponseEntity<?> updateRealmConfig(@RequestBody RealmConfigDto dto) {
        try {
            keycloakAdminService.updateRealmConfig(
                    dto.registrationAllowed(),
                    dto.verifyEmail(),
                    dto.resetPasswordAllowed()
            );
            return ResponseEntity.ok(Map.of("success", true, "message", "Realm configuration updated successfully!"));
        } catch (Exception e) {
            log.error("Failed to update Realm configuration: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // --- Active Session Endpoints ---

    @GetMapping("/sessions")
    public ResponseEntity<List<ActiveSessionDto>> getActiveSessions() {
        try {
            List<KeycloakAdminService.RealmUserSession> sessions = keycloakAdminService.getActiveSessions();
            List<ActiveSessionDto> dtos = sessions.stream()
                    .map(this::mapToActiveSessionDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Failed to fetch active sessions: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> revokeSession(@PathVariable String sessionId) {
        try {
            keycloakAdminService.revokeSession(sessionId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Session revoked successfully!"));
        } catch (Exception e) {
            log.error("Failed to revoke session {}: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // --- SSO Provider Endpoints ---

    @GetMapping("/sso-providers")
    public ResponseEntity<List<SsoProviderResponse>> getSsoProviders() {
        try {
            List<IdentityProviderRepresentation> providers = keycloakAdminService.getIdentityProviders();
            List<SsoProviderResponse> dtos = providers.stream()
                    .map(idp -> new SsoProviderResponse(
                            idp.getAlias(),
                            idp.getProviderId(),
                            idp.isEnabled(),
                            idp.getConfig() != null ? idp.getConfig().get("clientId") : ""
                    ))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Failed to fetch SSO Providers: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/sso-providers")
    public ResponseEntity<?> updateSsoProvider(@RequestBody SsoProviderRequest request) {
        try {
            keycloakAdminService.updateOrCreateIdentityProvider(
                    request.providerId(),
                    request.clientId(),
                    request.clientSecret()
            );
            return ResponseEntity.ok(Map.of("success", true, "message", "SSO Provider " + request.providerId() + " updated successfully!"));
        } catch (Exception e) {
            log.error("Failed to configure SSO Provider: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // --- Security Event / Anomaly Alerts Endpoints ---

    @GetMapping("/alerts")
    public ResponseEntity<List<SecurityEvent>> getSecurityAlerts() {
        try {
            return ResponseEntity.ok(securityEventRepository.findTop100ByOrderByCreatedAtDesc());
        } catch (Exception e) {
            log.error("Failed to fetch security events: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/alerts/simulate-travel")
    public ResponseEntity<?> simulateImpossibleTravel(
            @RequestParam String userId,
            @RequestParam String username,
            @RequestParam String ipAddress) {
        try {
            UUID userUuid = UUID.fromString(userId);
            boolean triggered = geoIpService.checkImpossibleTravel(userUuid, ipAddress, username);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "triggeredAnomaly", triggered,
                    "message", triggered ? "CRITICAL: Impossible travel anomaly triggered!" : "Travel looks plausible and safe."
            ));
        } catch (Exception e) {
            log.error("Failed to simulate travel: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/alerts/simulate-fail")
    public ResponseEntity<?> simulateFailedLogin(
            @RequestParam String username,
            @RequestParam String ipAddress,
            @RequestParam(defaultValue = "1") int count) {
        try {
            GeoIpService.Geolocation loc = geoIpService.lookup(ipAddress);
            for (int i = 0; i < count; i++) {
                SecurityEvent event = SecurityEvent.builder()
                        .eventType("LOGIN_FAILED")
                        .severity(count >= 3 ? "WARNING" : "INFO")
                        .username(username)
                        .ipAddress(ipAddress)
                        .location(loc.getCity() + ", " + loc.getCountry())
                        .details("Simulation: Failed login attempt (Invalid credentials)")
                        .createdAt(LocalDateTime.now().minusSeconds((count - i) * 2))
                        .build();
                securityEventRepository.save(event);
            }
            
            if (count >= 5) {
                // Also trigger brute force alert
                SecurityEvent brute = SecurityEvent.builder()
                        .eventType("BRUTE_FORCE_ATTEMPT")
                        .severity("CRITICAL")
                        .username(username)
                        .ipAddress(ipAddress)
                        .location(loc.getCity() + ", " + loc.getCountry())
                        .details(String.format("Simulation: Suspicious brute force activity. Detected %d failed attempts within a short interval.", count))
                        .createdAt(LocalDateTime.now())
                        .build();
                securityEventRepository.save(brute);
            }
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Simulation records populated successfully!"));
        } catch (Exception e) {
            log.error("Failed to simulate failed login: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/alerts")
    public ResponseEntity<?> clearAlerts() {
        try {
            securityEventRepository.deleteAll();
            return ResponseEntity.ok(Map.of("success", true, "message", "Security logs cleared successfully!"));
        } catch (Exception e) {
            log.error("Failed to clear security events: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // --- Helper Mappers ---

    private ActiveSessionDto mapToActiveSessionDto(KeycloakAdminService.RealmUserSession realmSession) {
        UserSessionRepresentation session = realmSession.session();
        List<String> clients = new java.util.ArrayList<>();
        if (session.getClients() != null) {
            clients.addAll(session.getClients().values());
        }
        return new ActiveSessionDto(
                session.getId(),
                session.getUsername(),
                session.getIpAddress(),
                session.getStart(),
                session.getLastAccess(),
                clients,
                realmSession.tenantName()
        );
    }

    // --- DTO Records ---

    public record RealmConfigDto(
            boolean registrationAllowed,
            boolean verifyEmail,
            boolean resetPasswordAllowed
    ) {}

    public record ActiveSessionDto(
            String id,
            String username,
            String ipAddress,
            long start,
            long lastAccess,
            List<String> clients,
            String tenant
    ) {}

    public record SsoProviderResponse(
            String alias,
            String providerId,
            boolean enabled,
            String clientId
    ) {}

    public record SsoProviderRequest(
            String providerId,
            String clientId,
            String clientSecret
    ) {}

    // --- IP Blocking Endpoints ---

    @GetMapping("/blocked-ips")
    public ResponseEntity<List<BlockedIp>> getBlockedIps() {
        try {
            return ResponseEntity.ok(blockedIpRepository.findAll());
        } catch (Exception e) {
            log.error("Failed to fetch blocked IPs: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/blocked-ips")
    public ResponseEntity<?> blockIp(@RequestBody BlockedIpRequest request) {
        try {
            if (request.ipAddressOrCidr() == null || request.ipAddressOrCidr().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "IP address or CIDR range is required."));
            }
            
            // Check if already blocked
            var existing = blockedIpRepository.findByIpAddressOrCidr(request.ipAddressOrCidr().trim());
            if (existing.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "This IP or CIDR range is already blocked."));
            }

            BlockedIp blocked = BlockedIp.builder()
                    .ipAddressOrCidr(request.ipAddressOrCidr().trim())
                    .reason(request.reason() != null && !request.reason().trim().isEmpty() ? request.reason() : "Manual block by Administrator")
                    .createdAt(LocalDateTime.now())
                    .build();
            
            blockedIpRepository.save(blocked);
            
            // Refresh the low-level security filter cache dynamically
            ipBlockingFilter.reloadBlockedIps();

            return ResponseEntity.ok(Map.of("success", true, "message", "IP/CIDR blocked successfully!"));
        } catch (Exception e) {
            log.error("Failed to block IP: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/blocked-ips/{id}")
    public ResponseEntity<?> unblockIp(@PathVariable Long id) {
        try {
            if (!blockedIpRepository.existsById(id)) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Blocked IP record not found."));
            }
            
            blockedIpRepository.deleteById(id);
            
            // Refresh the low-level security filter cache dynamically
            ipBlockingFilter.reloadBlockedIps();

            return ResponseEntity.ok(Map.of("success", true, "message", "IP/CIDR unblocked successfully!"));
        } catch (Exception e) {
            log.error("Failed to unblock IP: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    public record BlockedIpRequest(
            String ipAddressOrCidr,
            String reason
    ) {}
}
