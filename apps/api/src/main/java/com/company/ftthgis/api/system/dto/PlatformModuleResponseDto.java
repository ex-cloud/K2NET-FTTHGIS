package com.company.ftthgis.api.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformModuleResponseDto {
    private UUID id;
    private String moduleKey;
    private String name;
    private String description;
    private String scope;
    private String category;
    private String status;
    private boolean isEnabled;
    private String minPlanTier;
    private String licenseFlag;
    private String serviceTarget;
    private String metadataJson;
    private int permissionsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
