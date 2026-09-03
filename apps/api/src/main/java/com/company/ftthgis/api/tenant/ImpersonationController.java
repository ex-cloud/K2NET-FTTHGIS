package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.domain.tenant.service.ImpersonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
public class ImpersonationController {

    private final ImpersonationService impersonationService;

    /**
     * Memulai sesi impersonasi ke tenant target.
     * Wajib memiliki role Super Admin atau authority system.support.impersonate.
     * Mewajibkan validasi kesegaran Step-Up MFA (auth_time <= 120s).
     */
    @PostMapping("/api/v1/system/tenants/{tenantId}/impersonate/start")
    @PreAuthorize("hasRole('super_admin') or hasRole('ROLE_SUPER_ADMIN') or hasAuthority('system.support.impersonate')")
    public ResponseEntity<ImpersonationSessionResponse> start(
            @PathVariable("tenantId") UUID tenantId,
            @Valid @RequestBody ImpersonationStartRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        log.info("🛡️ [ImpersonationController] Request start impersonation: targetTenant={}, caller={}",
                tenantId, jwt.getSubject());

        ImpersonationSessionResponse response = impersonationService.startSession(tenantId, request, jwt);
        return ResponseEntity.ok(response);
    }

    /**
     * Menukar kode sekali pakai (exchange code) dari tab studio-tenant
     * untuk mendapatkan kredensial sesi dan metadata tenant.
     * Endpoint ini dapat diakses secara publik (dijaga oleh single-use exchange code TTL 60s).
     */
    @PostMapping("/api/v1/system/impersonate/exchange")
    public ResponseEntity<ImpersonationExchangeResponse> exchange(
            @Valid @RequestBody ImpersonationExchangeRequest request) {

        log.info("🛡️ [ImpersonationController] Request exchange code");
        ImpersonationExchangeResponse response = impersonationService.exchangeCode(request.getCode());
        return ResponseEntity.ok(response);
    }

    /**
     * Server-Side Refresh Relay:
     * Menyegarkan access token Super Admin selama sesi impersonasi aktif 30 menit
     * tanpa mengekspos refresh_token ke browser portal tenant.
     */
    @PostMapping("/api/v1/system/impersonate/refresh-token")
    public ResponseEntity<ImpersonationRefreshResponse> refresh(
            @RequestHeader("X-Impersonation-Session-Id") UUID sessionId) {

        log.debug("🛡️ [ImpersonationController] Request refresh token for session: {}", sessionId);
        ImpersonationRefreshResponse response = impersonationService.refreshToken(sessionId);
        return ResponseEntity.ok(response);
    }

    /**
     * Mengakhiri sesi impersonasi yang sedang aktif.
     * Hanya Super Admin pembuat sesi yang dapat mengakhiri sesi miliknya.
     */
    @PostMapping("/api/v1/system/impersonate/exit")
    public ResponseEntity<?> exit(
            @RequestHeader("X-Impersonation-Session-Id") UUID sessionId,
            @AuthenticationPrincipal Jwt jwt) {

        UUID callerUserId = UUID.fromString(jwt.getSubject());
        log.info("🛡️ [ImpersonationController] Request exit session: sessionId={}, caller={}", sessionId, callerUserId);

        impersonationService.exitSession(sessionId, callerUserId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Sesi impersonasi berhasil diakhiri."
        ));
    }

    /**
     * Mengakhiri sesi impersonasi aktif milik Super Admin yang sedang login (jika ada).
     * Berguna jika tab sebelumnya tertutup atau terjadi konflik sesi 409.
     */
    @PostMapping("/api/v1/system/impersonate/exit-active")
    public ResponseEntity<?> exitActive(@AuthenticationPrincipal Jwt jwt) {
        UUID callerUserId = UUID.fromString(jwt.getSubject());
        log.info("🛡️ [ImpersonationController] Request exit active session for caller: {}", callerUserId);

        impersonationService.exitActiveSessionForActor(callerUserId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Sesi impersonasi aktif sebelumnya berhasil diakhiri."
        ));
    }

    /**
     * Memeriksa apakah Super Admin yang sedang login memiliki sesi impersonasi aktif.
     * Digunakan oleh halaman Organizations Command Center untuk menampilkan banner & badge status.
     */
    @GetMapping("/api/v1/system/impersonate/active-session")
    public ResponseEntity<?> getActiveSession(@AuthenticationPrincipal Jwt jwt) {
        UUID callerUserId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(impersonationService.getActiveSessionForActor(callerUserId));
    }

    /**
     * Memeriksa sisa TTL dan keaktifan sesi impersonasi untuk countdown banner sinkron.
     */
    @GetMapping("/api/v1/system/impersonate/status")
    public ResponseEntity<ImpersonationStatusResponse> status(
            @RequestHeader(value = "X-Impersonation-Session-Id", required = false) UUID sessionId) {

        if (sessionId == null) {
            return ResponseEntity.ok(ImpersonationStatusResponse.builder()
                    .active(false)
                    .remainingSeconds(0)
                    .build());
        }

        ImpersonationStatusResponse response = impersonationService.getStatus(sessionId);
        return ResponseEntity.ok(response);
    }
}
