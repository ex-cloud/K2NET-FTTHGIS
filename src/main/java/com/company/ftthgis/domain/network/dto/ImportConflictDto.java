package com.company.ftthgis.domain.network.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportConflictDto {
    private String code;
    private String type;
    private String conflictType; // DUPLICATE_CODE, SPATIAL_OVERLAP
    private String message;
    private Map<String, Object> existingData;
    private Map<String, Object> newData;
}
