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
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String actor = jwt != null ? (jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : jwt.getSubject()) : "tenant_admin";
            return ResponseEntity.ok(policyService.updateTenantPolicy(slug, request, actor));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}

