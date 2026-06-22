package com.company.ftthgis.controller.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.company.ftthgis.config.tenant.KeycloakService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final KeycloakService keycloakService;

    /**
     * Verifies the current user's password before sensitive operations.
     */
    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> request) {
        
        String username = jwt.getClaimAsString("preferred_username");
        String password = request.get("password");
        
        if (password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password is required"));
        }

        log.info("🔐 Security challenge for user: {}", username);
        
        // Extract realm from issuer URL (e.g., http://.../realms/ftth-realm)
        String issuer = jwt.getIssuer().toString();
        String userRealm = issuer.substring(issuer.lastIndexOf("/") + 1);
        
        boolean isValid = keycloakService.verifyUserPassword(username, password, userRealm);
        
        if (isValid) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Verification successful"));
        } else {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid password"));
        }
    }
}
