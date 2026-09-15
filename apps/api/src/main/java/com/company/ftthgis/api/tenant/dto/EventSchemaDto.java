package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSchemaDto {
    private String eventType;
    private String displayName;
    private String description;
    private String severity; // CRITICAL, EMERGENCY, WARNING, INFO
    private String samplePayloadJson;
}
