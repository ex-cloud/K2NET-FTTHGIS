package com.company.ftthgis.api.system;

import com.company.ftthgis.api.security.dto.PlatformSecurityPolicyDto;
import com.company.ftthgis.api.security.dto.UpdatePlatformSecurityPolicyRequest;
import com.company.ftthgis.service.SecurityPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/system/security-policy")
@RequiredArgsConstructor
public class PlatformSecurityPolicyController {

    private final SecurityPolicyService policyService;

    @GetMapping
    @PreAuthorize("hasAuthority('system.security.manage') or hasAuthority('system.security.policy.view')")
    public ResponseEntity<PlatformSecurityPolicyDto> getPlatformPolicy() {
        return ResponseEntity.ok(policyService.getPlatformPolicy());
    }

    @PutMapping
    @PreAuthorize("hasAuthority('system.security.manage') or hasAuthority('system.security.policy.manage')")
    public ResponseEntity<PlatformSecurityPolicyDto> updatePlatformPolicy(
            @RequestBody UpdatePlatformSecurityPolicyRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String actor = jwt != null ? (jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : jwt.getSubject()) : "super_admin";
        return ResponseEntity.ok(policyService.updatePlatformPolicy(request, actor));
    }
}

