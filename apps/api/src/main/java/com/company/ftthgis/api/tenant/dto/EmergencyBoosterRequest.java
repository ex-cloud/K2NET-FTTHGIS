package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyBoosterRequest {
    private int boosterOlts; // e.g. 5
    private int boosterOdps; // e.g. 1000
    @Builder.Default
    private int durationDays = 30; // default 30 days
    private String reason;   // e.g. "Kawasan Industri MM2100 Tender Project"
}
