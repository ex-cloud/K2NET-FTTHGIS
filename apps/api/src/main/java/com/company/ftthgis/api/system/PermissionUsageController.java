package com.company.ftthgis.api.system;

import com.company.ftthgis.service.SecurityMetadataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/security/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionUsageController {

    private final SecurityMetadataService securityMetadataService;

    @GetMapping("/{code}/usages")
    @PreAuthorize("hasAuthority('system.audit.view') or hasAuthority('roles.view') or hasRole('super_admin')")
    public ResponseEntity<PermissionUsageResponseDto> getPermissionUsages(@PathVariable String code) {
        List<SecurityMetadataService.EndpointUsageDto> usages = securityMetadataService.getUsagesForPermission(code);
        return ResponseEntity.ok(new PermissionUsageResponseDto(code, usages, usages.size()));
    }

    @GetMapping("/usages")
    @PreAuthorize("hasAuthority('system.audit.view') or hasAuthority('roles.view') or hasRole('super_admin')")
    public ResponseEntity<Map<String, List<SecurityMetadataService.EndpointUsageDto>>> getAllPermissionUsages() {
        return ResponseEntity.ok(securityMetadataService.getAllPermissionUsages());
    }

    public record PermissionUsageResponseDto(
        String code,
        List<SecurityMetadataService.EndpointUsageDto> usages,
        int totalUsages
    ) {}
}
