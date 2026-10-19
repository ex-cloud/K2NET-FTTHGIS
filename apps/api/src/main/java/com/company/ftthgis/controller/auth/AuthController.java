package com.company.ftthgis.controller.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final com.company.ftthgis.service.auth.StreamTicketService streamTicketService;

    /**
     * Issues a short-lived (30s) single-use stream ticket for establishing SSE connections.
     * Prevents long-lived JWTs from leaking into HTTP proxy/access logs as query strings.
     */
    @PostMapping("/stream-ticket")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createStreamTicket(
            @AuthenticationPrincipal Jwt jwt,
            jakarta.servlet.http.HttpServletRequest request) {
        String tokenValue = jwt != null ? jwt.getTokenValue() : null;
        if (tokenValue == null || tokenValue.isBlank()) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                tokenValue = authHeader.substring(7);
            }
        }
        if (tokenValue == null || tokenValue.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No valid authentication token found"));
        }

        String ticket = streamTicketService.createTicket(tokenValue);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "ticket", ticket,
                "expiresIn", 30
        ));
    }

    /**
     * Verifies the current user's password before sensitive operations.
     */
    @PostMapping("/verify-password")
    @PreAuthorize("isAuthenticated()")
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
