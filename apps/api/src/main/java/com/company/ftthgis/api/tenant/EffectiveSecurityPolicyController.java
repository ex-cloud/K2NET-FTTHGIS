package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.security.dto.EffectiveSecurityPolicyDto;
import com.company.ftthgis.service.SecurityPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/security/policy")
@RequiredArgsConstructor
public class EffectiveSecurityPolicyController {

    private final SecurityPolicyService policyService;

    @GetMapping("/effective")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EffectiveSecurityPolicyDto> getEffectivePolicy(
            @RequestParam(required = false) String slug,
            @AuthenticationPrincipal Jwt jwt) {
        String targetSlug = slug;
        if (targetSlug == null || targetSlug.isBlank()) {
            if (jwt != null) {
                targetSlug = jwt.getClaimAsString("tenant_slug");
                if (targetSlug == null) {
                    targetSlug = jwt.getClaimAsString("org_slug");
                }
            }
        }
        return ResponseEntity.ok(policyService.resolveEffectivePolicy(targetSlug));
    }
}

