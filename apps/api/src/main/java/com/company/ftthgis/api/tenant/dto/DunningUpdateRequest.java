package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DunningUpdateRequest {
    private int dunningLevel; // 0: Normal, 1: H+1 Warning, 2: H+3 Warning, 3: H+7 Soft-Lock
    private String notes;
}
