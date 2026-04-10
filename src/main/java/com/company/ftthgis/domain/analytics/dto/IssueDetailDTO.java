package com.company.ftthgis.domain.analytics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IssueDetailDTO {
    private String code;
    private String type;
    private String status;
    private String lastNote;
    private Double lng;
    private Double lat;
}
