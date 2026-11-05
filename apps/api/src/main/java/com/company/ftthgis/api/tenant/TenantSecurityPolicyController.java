package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.security.dto.TenantSecurityPolicyDto;
import com.company.ftthgis.api.security.dto.UpdateTenantSecurityPolicyRequest;
import com.company.ftthgis.service.SecurityPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/organizations/{slug}/security-policy")
@RequiredArgsConstructor
public class TenantSecurityPolicyController {

    private final SecurityPolicyService policyService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.view') or hasAuthority('organizations.view'))")
    public ResponseEntity<TenantSecurityPolicyDto> getTenantPolicy(@PathVariable String slug) {
        return ResponseEntity.ok(policyService.getTenantPolicy(slug));
    }

    @PutMapping
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update'))")
    public ResponseEntity<?> updateTenantPolicy(
            @PathVariable String slug,
            @RequestBody UpdateTenantSecurityPolicyRequest request,
            @AuthenticationPrincipal Jwt jwt,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            String actor = jwt != null ? (jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : jwt.getSubject()) : "admin";
            String clientIp = resolveClientIp(httpRequest);
            return ResponseEntity.ok(policyService.updateTenantPolicy(slug, request, actor, clientIp));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    private String resolveClientIp(jakarta.servlet.http.HttpServletRequest req) {
        if (req == null) return null;
        String ip = req.getHeader("CF-Connecting-IP");
        if (ip == null || ip.isBlank()) {
            ip = req.getHeader("X-Forwarded-For");
            if (ip != null && !ip.isBlank() && ip.contains(",")) {
                ip = ip.split(",")[0].trim();
            }
        }
        if (ip == null || ip.isBlank()) {
            ip = req.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank()) {
            ip = req.getRemoteAddr();
        }
        return ip != null ? ip.trim() : null;
    }

    @PostMapping("/members/{memberId}/reset-mfa")
    @PreAuthorize("hasAuthority('system.security.policy.manage') or (@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update')))")
    public ResponseEntity<?> resetMemberMfa(
            @PathVariable String slug,
            @PathVariable java.util.UUID memberId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String actor = jwt != null ? (jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : jwt.getSubject()) : "admin";
            policyService.resetMemberMfa(slug, memberId, actor);
            return ResponseEntity.ok(java.util.Map.of(
                    "success", true,
                    "message", "Member MFA has been reset and required action re-assigned."
            ));
        } catch (IllegalArgumentException | java.util.NoSuchElementException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}

