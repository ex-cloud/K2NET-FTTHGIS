package com.company.ftthgis.domain.network.dto;

import com.company.ftthgis.domain.network.entity.ZoneStage;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoteZoneRequest {

    @NotNull(message = "Target stage is required")
    private ZoneStage targetStage;
}
