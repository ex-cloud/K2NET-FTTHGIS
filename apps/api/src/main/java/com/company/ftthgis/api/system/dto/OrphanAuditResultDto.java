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
    private int totalRegisteredModules;
    private int totalDistinctPermissionModules;
    private List<String> orphanModulesWithoutPermissions;
    private List<String> orphanPermissionModulesWithoutRegistry;
    private String status; // HEALTHY, WARNING
    private LocalDateTime timestamp;
}
