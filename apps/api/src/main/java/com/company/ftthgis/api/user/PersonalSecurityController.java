package com.company.ftthgis.api.user;

import com.company.ftthgis.api.security.dto.EffectiveSecurityPolicyDto;
import com.company.ftthgis.api.system.DeviceVerificationController.TrustDevicePayload;
import com.company.ftthgis.api.system.DeviceVerificationController.UserDeviceDto;
import com.company.ftthgis.api.user.dto.PersonalSecuritySummaryDto;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.entity.UserDevice;
import com.company.ftthgis.domain.user.repository.UserDeviceRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.DeviceVerificationService;
import com.company.ftthgis.service.KeycloakAdminService;
import com.company.ftthgis.service.SecurityPolicyService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * <h1>Personal Caller Self-Service Security Controller</h1>
 * <p>
 * Canonical user-scoped security management under {@code /api/v1/me/...}.
 * Scoped strictly to the caller's JWT subject claim (Anti-IDOR).
 * </p>
 */
@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
@Slf4j
public class PersonalSecurityController {

    private final UserDeviceRepository userDeviceRepository;
    private final DeviceVerificationService deviceVerificationService;
    private final UserRepository userRepository;
    private final SecurityPolicyService securityPolicyService;
    private final KeycloakAdminService keycloakAdminService;

    @GetMapping("/devices")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserDeviceDto>> getDevices(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<UserDevice> devices = userDeviceRepository.findAllByUserId(userId);

        List<UserDeviceDto> dtos = devices.stream()
                .map(d -> new UserDeviceDto(
                        d.getId(),
                        d.getDeviceFingerprint(),
                        d.getBrowser(),
                        d.getOs(),
                        d.getIpAddress(),
                        d.isVerified(),
                        d.getLastUsedAt() != null ? d.getLastUsedAt().toString() : "",
                        d.getCreatedAt() != null ? d.getCreatedAt().toString() : ""
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @DeleteMapping("/devices/{deviceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> revokeDevice(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long deviceId) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return userDeviceRepository.findById(deviceId)
                .map(device -> {
                    if (!device.getUser().getId().equals(userId)) {
                        return ResponseEntity.status(403).body(Map.of(
                                "success", false,
                                "message", "Unauthorized to revoke this device"
                        ));
                    }
                    userDeviceRepository.delete(device);
                    log.info("🗑️ Caller {} untrusted and revoked device {}", userId, deviceId);
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "Device untrusted and deleted successfully"
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/devices/trust-current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> trustCurrentDevice(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody TrustDevicePayload payload,
            HttpServletRequest request) {

        if (payload.deviceFingerprint() == null || payload.deviceFingerprint().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "deviceFingerprint is required"
            ));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        String ipAddress = request.getRemoteAddr();

        boolean verified = deviceVerificationService.trustDeviceDirectly(
                userId,
                payload.deviceFingerprint(),
                payload.browser() != null ? payload.browser() : "Current Browser",
                payload.os() != null ? payload.os() : "Current OS",
                ipAddress
        );

        if (verified) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Perangkat berhasil diverifikasi dan ditambahkan ke daftar perangkat terpercaya."
            ));
        } else {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Gagal mendaftarkan perangkat terpercaya"
            ));
        }
    }

    @GetMapping("/security")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PersonalSecuritySummaryDto> getSecuritySummary(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        User user = userRepository.findById(userId).orElse(null);

        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        String phone = user != null ? user.getPhone() : "";

        // Resolve organization slug
        String orgSlug = "default";
        if (user != null && user.getOrganization() != null) {
            orgSlug = user.getOrganization().getSlug();
        }

        EffectiveSecurityPolicyDto effectivePolicy = securityPolicyService.resolveEffectivePolicy(orgSlug);

        // Check Keycloak credentials live
        boolean hasKeycloakMfa = keycloakAdminService.hasMfaConfigured("k2net-tenants", email != null ? email : username);
        boolean mfaActive = (user != null && user.isMfaEnabled()) || hasKeycloakMfa;

        int devicesCount = userDeviceRepository.findAllByUserId(userId).size();

        // Linked social identities
        List<String> linkedProviders = new ArrayList<>();
        try {
            var identities = keycloakAdminService.getUserFederatedIdentities("k2net-tenants", userId.toString());
            for (var idp : identities) {
                linkedProviders.add(idp.getIdentityProvider());
            }
        } catch (Exception ignored) {}

        PersonalSecuritySummaryDto summary = PersonalSecuritySummaryDto.builder()
                .email(email != null ? email : "")
                .username(username != null ? username : "")
                .phone(phone != null ? phone : "")
                .mfaEnabled(mfaActive)
                .mfaEnforced(effectivePolicy.isMfaRequired())
                .mfaEnforcementSource(effectivePolicy.getEffectiveSource())
                .trustedDevicesCount(devicesCount)
                .activeSessionsCount(1) // current session minimum
                .linkedProviders(linkedProviders)
                .build();

        return ResponseEntity.ok(summary);
    }
}

