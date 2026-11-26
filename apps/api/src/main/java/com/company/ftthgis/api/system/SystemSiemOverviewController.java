package com.company.ftthgis.api.system;

import com.company.ftthgis.api.security.dto.SystemSiemOverviewDto;
import com.company.ftthgis.service.siem.SecuritySiemStreamingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Control Plane read-only overview of Enterprise tenant SIEM streaming health and DLQ counts.
 */
@RestController
@RequestMapping("/api/v1/system/security/siem")
@RequiredArgsConstructor
public class SystemSiemOverviewController {

    private final SecuritySiemStreamingService siemService;

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('system.security.manage') or hasAuthority('system.security.policy.view') or hasAuthority('system.audit.view')")
    public ResponseEntity<List<SystemSiemOverviewDto>> getOverview() {
        return ResponseEntity.ok(siemService.getSystemOverview());
    }
}
