package com.company.ftthgis.api.system;

import com.company.ftthgis.api.security.dto.SystemIpPolicyOverviewDto;
import com.company.ftthgis.service.SecurityPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Control Plane read-only overview of tenant IP Allowlist & Country Geofencing postures (ADR-0032).
 */
@RestController
@RequestMapping("/api/v1/system/security/ip-policies")
@RequiredArgsConstructor
public class SystemIpPolicyOverviewController {

    private final SecurityPolicyService securityPolicyService;

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('system.security.manage') or hasAuthority('system.security.policy.view') or hasAuthority('system.audit.view')")
    public ResponseEntity<List<SystemIpPolicyOverviewDto>> getOverview() {
        return ResponseEntity.ok(securityPolicyService.getSystemIpPolicyOverview());
    }
}
