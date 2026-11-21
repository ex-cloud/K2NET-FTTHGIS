package com.company.ftthgis.api.system.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformModuleResponseDto {
    private UUID id;
    private String moduleKey;
    private String code; // Alias for moduleKey (frontend & @k2net/ui parity)
    private String name;
    private String description;
    private String scope;
    private String category;
    private String status;

    @JsonProperty("isEnabled")
    private boolean isEnabled;

    @JsonProperty("isEnabled")
    public boolean isEnabled() {
        return isEnabled;
    }

    @JsonProperty("enabled")
    public boolean getEnabled() {
        return isEnabled;
    }

    private String minPlanTier;
    private String licenseFlag;
    private String serviceTarget;
    private String metadataJson;
    private int permissionsCount;
    private List<MappedPermissionDto> permissions; // Detailed mapped permissions
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
