package com.company.ftthgis.api.auth;

import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.KeycloakAdminService;
import com.company.ftthgis.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Internal API used by NextAuth's signIn callback (server-side only)
 * to validate OAuth users before granting a session.
 * 
 * Protected by X-Internal-Secret header to prevent external access.
 */
@RestController
@RequestMapping("/api/v1/auth/oauth-gate")
@RequiredArgsConstructor
@Slf4j
public class OAuthGateController {

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final SystemSettingService settingsService;

    @Value("${app.internal-api-secret:ftth-internal-secret-2026}")
    private String internalApiSecret;

    // Thread-safe in-memory cache to track failures and suspensions
    private static class SuspensionInfo {
        int attempts = 0;
        long suspendedUntil = 0;
    }
    private final Map<String, SuspensionInfo> tracker = new java.util.concurrent.ConcurrentHashMap<>();

    private boolean isSuspended(String ip, String userAgent, String deviceId) {
        long now = System.currentTimeMillis();
        
        if (ip != null && !ip.isBlank()) {
            SuspensionInfo info = tracker.get("ip:" + ip);
            if (info != null && info.suspendedUntil > now) return true;
        }
        if (deviceId != null && !deviceId.isBlank() && !deviceId.equals("unknown")) {
            SuspensionInfo info = tracker.get("device:" + deviceId);
            if (info != null && info.suspendedUntil > now) return true;
        }
        if (ip != null && !ip.isBlank() && userAgent != null && !userAgent.isBlank()) {
            SuspensionInfo info = tracker.get("ip_ua:" + ip + ":" + userAgent);
            if (info != null && info.suspendedUntil > now) return true;
        }
        return false;
    }

    private long getRemainingSuspensionTime(String ip, String userAgent, String deviceId) {
        long now = System.currentTimeMillis();
        long maxSuspendedUntil = 0;

        if (ip != null && !ip.isBlank()) {
            SuspensionInfo info = tracker.get("ip:" + ip);
            if (info != null && info.suspendedUntil > now) {
                maxSuspendedUntil = Math.max(maxSuspendedUntil, info.suspendedUntil);
            }
        }
        if (deviceId != null && !deviceId.isBlank() && !deviceId.equals("unknown")) {
            SuspensionInfo info = tracker.get("device:" + deviceId);
            if (info != null && info.suspendedUntil > now) {
                maxSuspendedUntil = Math.max(maxSuspendedUntil, info.suspendedUntil);
            }
        }
        if (ip != null && !ip.isBlank() && userAgent != null && !userAgent.isBlank()) {
            SuspensionInfo info = tracker.get("ip_ua:" + ip + ":" + userAgent);
            if (info != null && info.suspendedUntil > now) {
                maxSuspendedUntil = Math.max(maxSuspendedUntil, info.suspendedUntil);
            }
        }
        return maxSuspendedUntil > now ? (maxSuspendedUntil - now) / 1000 : 0;
    }

    private void recordFailure(String ip, String userAgent, String deviceId) {
        long now = System.currentTimeMillis();
        long lockDuration = 24L * 60 * 60 * 1000; // 24 hours

        if (ip != null && !ip.isBlank()) {
            tracker.compute("ip:" + ip, (key, info) -> {
                if (info == null) info = new SuspensionInfo();
                info.attempts++;
                if (info.attempts >= 3) {
                    info.suspendedUntil = now + lockDuration;
                    log.warn("🚨 IP {} has been suspended for 24h due to 3 failed attempts.", ip);
                }
                return info;
            });
        }
        if (deviceId != null && !deviceId.isBlank() && !deviceId.equals("unknown")) {
            tracker.compute("device:" + deviceId, (key, info) -> {
                if (info == null) info = new SuspensionInfo();
                info.attempts++;
                if (info.attempts >= 3) {
                    info.suspendedUntil = now + lockDuration;
                    log.warn("🚨 Device ID {} has been suspended for 24h due to 3 failed attempts.", deviceId);
                }
                return info;
            });
        }
        if (ip != null && !ip.isBlank() && userAgent != null && !userAgent.isBlank()) {
            tracker.compute("ip_ua:" + ip + ":" + userAgent, (key, info) -> {
                if (info == null) info = new SuspensionInfo();
                info.attempts++;
                if (info.attempts >= 3) {
                    info.suspendedUntil = now + lockDuration;
                    log.warn("🚨 IP+UA combination {}:{} has been suspended for 24h.", ip, userAgent);
                }
                return info;
            });
        }
    }

    private void resetFailures(String ip, String userAgent, String deviceId) {
        if (ip != null) tracker.remove("ip:" + ip);
        if (deviceId != null && !deviceId.equals("unknown")) tracker.remove("device:" + deviceId);
        if (ip != null && userAgent != null) tracker.remove("ip_ua:" + ip + ":" + userAgent);
    }

    /**
     * Check if an email is registered in the local database.
     * If not registered and self-registration is disabled, also cleanup
     * the temporary Keycloak user that was created by the first broker login flow.
     */
    @PostMapping("/check")
    public ResponseEntity<?> checkAndGate(
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret,
            @RequestBody Map<String, String> request) {

        // Verify internal secret
        if (secret == null || !secret.equals(internalApiSecret)) {
            log.warn("❌ OAuth gate check rejected: invalid or missing internal secret");
            return ResponseEntity.status(403).body(Map.of("allowed", false, "reason", "Forbidden"));
        }

        String email = request.get("email");
        String ip = request.get("ip");
        String userAgent = request.get("userAgent");
        String deviceId = request.get("deviceId");

        // Verify suspension status first
        if (isSuspended(ip, userAgent, deviceId)) {
            long remaining = getRemainingSuspensionTime(ip, userAgent, deviceId);
            log.warn("🚫 Login blocked: Client IP/Device is currently suspended. Remaining: {}s", remaining);
            return ResponseEntity.ok(Map.of(
                "allowed", false,
                "reason", "suspended",
                "remainingSeconds", remaining
            ));
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("allowed", false, "reason", "Email is required"));
        }

        boolean allowSelfReg = settingsService.getSettingBoolean("allow_self_registration", false);
        boolean userExists = userRepository.existsByEmail(email);

        log.info("🔐 OAuth gate check for email={}, exists={}, selfReg={}", email, userExists, allowSelfReg);

        if (userExists || allowSelfReg) {
            resetFailures(ip, userAgent, deviceId);
            return ResponseEntity.ok(Map.of("allowed", true));
        }

        // User not registered and self-registration is disabled → block + cleanup + record failure
        log.warn("🚫 Blocking unregistered OAuth login for: {}", email);
        recordFailure(ip, userAgent, deviceId);

        // Cleanup the temporary user created by Keycloak's first broker login flow
        try {
            boolean cleaned = keycloakAdminService.deleteUserByEmail(email);
            log.info("🧹 Keycloak cleanup for {}: {}", email, cleaned ? "SUCCESS" : "NOT_FOUND");
        } catch (Exception e) {
            log.error("Failed to cleanup Keycloak user {}: {}", email, e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "allowed", false,
                "reason", "not_registered"
        ));
    }

    /**
     * Public endpoint for the frontend to check if the user's IP or device is currently suspended.
     */
    @GetMapping("/check-suspension")
    public ResponseEntity<?> checkSuspension(
            @RequestParam(value = "ip", required = false) String ip,
            @RequestParam(value = "device_id", required = false) String deviceId,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            jakarta.servlet.http.HttpServletRequest request) {
        
        String clientIp = ip;
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = getClientIP(request);
        }
        
        boolean suspended = isSuspended(clientIp, userAgent, deviceId);
        long remainingSeconds = getRemainingSuspensionTime(clientIp, userAgent, deviceId);
        
        return ResponseEntity.ok(Map.of(
            "suspended", suspended,
            "remainingSeconds", remainingSeconds,
            "ip", clientIp
        ));
    }

    private String getClientIP(jakarta.servlet.http.HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
