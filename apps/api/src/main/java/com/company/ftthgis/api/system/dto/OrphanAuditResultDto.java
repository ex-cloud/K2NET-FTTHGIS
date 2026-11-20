package com.company.ftthgis.api.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrphanAuditResultDto {
    private boolean healthy;
    private int totalRegisteredModules;
    private int registeredModuleCount;
    private int totalDistinctPermissionModules;
    private int livePermissionCount;
    private List<String> orphanModulesWithoutPermissions;
    private List<String> unmappedModules; // Alias for orphanModulesWithoutPermissions
    private List<String> orphanPermissionModulesWithoutRegistry;
    private List<OrphanPermissionDetailDto> orphanPermissions; // Detailed orphan permissions list
    private String status; // HEALTHY, WARNING
    private LocalDateTime timestamp;
}
