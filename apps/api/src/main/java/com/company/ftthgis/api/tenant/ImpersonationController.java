package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.domain.tenant.service.ImpersonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
            @PathVariable("tenantId") String tenantId,
            @Valid @RequestBody ImpersonationStartRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        log.info("🛡️ [ImpersonationController] Request start impersonation: targetTenant={}, caller={}, autoSwitch={}",
                tenantId, jwt.getSubject(), request.getAutoSwitch());

        ImpersonationSessionResponse response = impersonationService.startSession(tenantId, request, jwt);
        return ResponseEntity.ok(response);
    }

    /**
     * Membuka kembali sesi impersonasi aktif dengan menghasilkan single-use exchange code baru.
     * Digunakan ketika Super Admin mengklik 'Buka Portal Tenant' pada sesi yang sedang aktif.
     */
    @PostMapping("/api/v1/system/impersonate/reopen")
    @PreAuthorize("hasRole('super_admin') or hasRole('ROLE_SUPER_ADMIN') or hasAuthority('system.support.impersonate')")
    public ResponseEntity<ImpersonationSessionResponse> reopen(@AuthenticationPrincipal Jwt jwt) {
        log.info("🛡️ [ImpersonationController] Request reopen active session for caller: {}", jwt.getSubject());
        ImpersonationSessionResponse response = impersonationService.reopenActiveSession(jwt);
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
            @AuthenticationPrincipal(errorOnInvalidType = false) Jwt jwt) {

        UUID callerUserId = (jwt != null && jwt.getSubject() != null) ? UUID.fromString(jwt.getSubject()) : null;
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

    /**
     * KPI ringkasan statistik sesi impersonasi untuk Support Center.
     * Dapat diakses oleh Super Admin, Support Lead, serta System Auditor untuk audit.
     */
    @GetMapping("/api/v1/system/impersonate/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ImpersonationStatsDto> getStats() {
        return ResponseEntity.ok(impersonationService.getImpersonationStats());
    }

    /**
     * Daftar seluruh sesi impersonasi yang sedang aktif di sistem secara real-time.
     * Dapat diakses oleh Super Admin, Support Lead, serta System Auditor untuk monitoring.
     */
    @GetMapping("/api/v1/system/impersonate/active-sessions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ImpersonationSessionDto>> getActiveSessions() {
        return ResponseEntity.ok(impersonationService.getActiveSessions());
    }

    /**
     * Pencarian dan riwayat audit lengkap seluruh sesi impersonasi dengan paginasi.
     * Dapat diakses oleh Super Admin, Support Lead, serta System Auditor untuk kepatuhan & forensik.
     */
    @GetMapping("/api/v1/system/impersonate/sessions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ImpersonationSessionDto>> searchSessions(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"));
        return ResponseEntity.ok(impersonationService.searchSessions(status, search, pageable));
    }

    /**
     * Emergency Kill / Putus Akses darurat sesi impersonasi oleh Super Admin.
     * Dibatasi KHUSUS untuk Super Admin / Support Lead dengan hak force-revoke (Auditor dilarang mutasi).
     */
    @PostMapping("/api/v1/system/impersonate/sessions/{sessionId}/revoke")
    @PreAuthorize("hasRole('super_admin') or hasRole('ROLE_SUPER_ADMIN') or hasAuthority('system.support.impersonate.force-revoke')")
    public ResponseEntity<?> emergencyRevoke(
            @PathVariable("sessionId") UUID sessionId,
            @AuthenticationPrincipal Jwt jwt) {

        UUID superAdminId = UUID.fromString(jwt.getSubject());
        log.warn("🚨 [ImpersonationController] Emergency revoke requested for session {} by {}", sessionId, superAdminId);

        impersonationService.emergencyRevokeSession(sessionId, superAdminId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Sesi impersonasi telah dicabut secara darurat."
        ));
    }
}
