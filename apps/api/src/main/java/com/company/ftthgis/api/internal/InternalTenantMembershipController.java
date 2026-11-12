package com.company.ftthgis.api.internal;

import com.company.ftthgis.api.tenant.dto.AcceptMemberByEmailRequest;
import com.company.ftthgis.api.tenant.dto.OrganizationMemberDto;
import com.company.ftthgis.service.organization.OrganizationMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * <h1>Internal Tenant Membership Controller</h1>
 * <p>
 * Private mesh endpoint used exclusively by Go gateway microservices (such as gateway-auth)
 * to atomically transition invited memberships upon verified social login or SSO authentication.
 * Protected strictly by the internal X-Gateway-Token header.
 * </p>
 */
@RestController
@RequestMapping("/api/v1/internal/organizations/{orgId}/members")
@RequiredArgsConstructor
@Slf4j
public class InternalTenantMembershipController {

    private final OrganizationMemberService memberService;

    @Value("${app.gateway.token:}")
    private String gatewayToken;

    @PostMapping("/accept-by-email")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> acceptMemberByEmail(
            @PathVariable UUID orgId,
            @RequestHeader(value = "X-Gateway-Token", required = false) String tokenHeader,
            @Valid @RequestBody AcceptMemberByEmailRequest request) {

        if (gatewayToken == null || gatewayToken.isBlank() || !gatewayToken.equals(tokenHeader)) {
            log.warn("🚨 Unauthorized internal membership acceptance attempt: missing or invalid X-Gateway-Token header");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "FORBIDDEN",
                    "message", "Akses internal ditolak: Token gateway tidak valid."
            ));
        }

        try {
            OrganizationMemberDto member = memberService.acceptInvitationByEmail(orgId, request.email());
            return ResponseEntity.ok(member);
        } catch (NoSuchElementException e) {
            log.warn("Membership acceptance not found: orgId={}, email={}", orgId, request.email());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "MEMBERSHIP_NOT_FOUND",
                    "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            log.warn("Membership acceptance invalid state: orgId={}, email={}, err={}", orgId, request.email(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", "INVALID_INVITATION_STATE",
                    "message", e.getMessage()
            ));
        } catch (SecurityException e) {
            log.warn("Membership acceptance security violation: orgId={}, email={}, err={}", orgId, request.email(), e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "MEMBERSHIP_NOT_ACTIVE",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Unexpected error accepting membership by email: orgId={}, email={}", orgId, request.email(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "INTERNAL_ERROR",
                    "message", "Gagal memproses akseptasi keanggotaan."
            ));
        }
    }
}

